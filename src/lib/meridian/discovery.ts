import {
  createPlatformSDKFromEnv,
  PlatformSDK,
  PlatformSDKError,
} from "@/lib/sdk/platformSDK";

export type DiscoveredObject = {
  name: string;
  path: string;
  methods: string[];
  operations: string[];
};

export type CareCircleSchema = {
  source: "openapi" | "env-override" | "heuristic";
  objects: DiscoveredObject[];
  patientObject: string | null;
  taskObject: string | null;
  warnings: string[];
  connected: boolean;
};

const PATIENT_HINTS = [
  "patient",
  "paciente",
  "care_recipient",
  "carerecipient",
  "client",
  "member",
  "elder",
];

const TASK_HINTS = [
  "task",
  "tarea",
  "care_task",
  "caretask",
  "care_plan",
  "careplan",
  "todo",
  "assignment",
  "actividad",
  "activity",
];

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function scoreName(name: string, hints: string[]) {
  const n = name.toLowerCase().replace(/[\s_-]+/g, "");
  let score = 0;
  for (const hint of hints) {
    const h = hint.replace(/[\s_-]+/g, "");
    if (n === h) score += 100;
    else if (n.includes(h)) score += 40;
  }
  return score;
}

function parseOpenApiObjects(spec: unknown): DiscoveredObject[] {
  const root = spec as {
    paths?: Record<string, Record<string, unknown>>;
  };
  const paths = root?.paths ?? {};
  const byObject = new Map<string, DiscoveredObject>();

  for (const [path, methods] of Object.entries(paths)) {
    const match = path.match(
      /\/api\/ext\/v1\/objects\/(?:\{[^}]+\}|([^/{]+))(?:\/|$)/,
    );
    if (!match) continue;
    // Prefer concrete object names over path params
    let name = match[1];
    if (!name) {
      // Look for x-helios / extension hints
      const firstOp = Object.values(methods ?? {})[0] as
        | { "x-helios-object"?: string; "x-meridian-object"?: string }
        | undefined;
      name =
        firstOp?.["x-helios-object"] ||
        firstOp?.["x-meridian-object"] ||
        "";
    }
    if (!name || name.startsWith("{")) continue;

    const methodNames = Object.keys(methods ?? {})
      .filter((m) => !m.startsWith("x-"))
      .map((m) => m.toUpperCase());

    const existing = byObject.get(name) ?? {
      name,
      path: `/api/ext/v1/objects/${name}`,
      methods: [],
      operations: [],
    };
    existing.methods = unique([...existing.methods, ...methodNames]);
    existing.operations = unique([
      ...existing.operations,
      ...methodNames.map((m) => `${m} ${path}`),
    ]);
    byObject.set(name, existing);
  }

  return [...byObject.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function pickBest(objects: DiscoveredObject[], hints: string[]) {
  let best: DiscoveredObject | null = null;
  let bestScore = 0;
  for (const obj of objects) {
    const score = scoreName(obj.name, hints);
    if (score > bestScore) {
      best = obj;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best?.name ?? null : null;
}

export async function discoverCareCircleSchema(
  sdk?: PlatformSDK | null,
): Promise<CareCircleSchema> {
  const client = sdk === undefined ? createPlatformSDKFromEnv() : sdk;
  const warnings: string[] = [];

  const envPatient = process.env.MERIDIAN_PATIENT_OBJECT?.trim() || null;
  const envTask = process.env.MERIDIAN_TASK_OBJECT?.trim() || null;

  if (!client) {
    return {
      source: "heuristic",
      objects: [],
      patientObject: envPatient,
      taskObject: envTask,
      warnings: [
        "MERIDIAN_API_KEY is not available in this runtime. Live Meridian reads are disabled until the key is present server-side.",
      ],
      connected: false,
    };
  }

  try {
    const spec = await client.getOpenApi();
    const objects = parseOpenApiObjects(spec);
    const patientObject =
      envPatient || pickBest(objects, PATIENT_HINTS);
    const taskObject = envTask || pickBest(objects, TASK_HINTS);

    if (!patientObject) {
      warnings.push(
        "OpenAPI was loaded, but no patient-like object name was detected. Set MERIDIAN_PATIENT_OBJECT.",
      );
    }
    if (!taskObject) {
      warnings.push(
        "OpenAPI was loaded, but no care-task-like object name was detected. Set MERIDIAN_TASK_OBJECT if tasks are exposed.",
      );
    }
    if (objects.length === 0) {
      warnings.push(
        "OpenAPI contained no /api/ext/v1/objects/{Name} paths. Expose objects under Object APIs in Meridian.",
      );
    }

    return {
      source: envPatient || envTask ? "env-override" : "openapi",
      objects,
      patientObject,
      taskObject,
      warnings,
      connected: true,
    };
  } catch (err) {
    const detail =
      err instanceof PlatformSDKError
        ? `${err.code}: ${err.detail ?? err.message}`
        : err instanceof Error
          ? err.message
          : "Unknown OpenAPI error";
    warnings.push(`Unable to load Meridian OpenAPI (${detail}).`);

    // Heuristic probe of common names if OpenAPI fails but key works
    const candidates = unique(
      [
        envPatient,
        envTask,
        "Patient",
        "Patients",
        "CareRecipient",
        "Care_Recipient",
        "CareTask",
        "Care_Task",
        "Task",
        "Tasks",
      ].filter(Boolean) as string[],
    );

    const found: DiscoveredObject[] = [];
    for (const name of candidates) {
      try {
        await client.listRecords(name, { limit: 1 });
        found.push({
          name,
          path: `/api/ext/v1/objects/${name}`,
          methods: ["GET", "POST"],
          operations: [`GET /api/ext/v1/objects/${name}`],
        });
      } catch (probeErr) {
        if (
          probeErr instanceof PlatformSDKError &&
          (probeErr.status === 404 || probeErr.code === "NOT_FOUND")
        ) {
          continue;
        }
        // 403/401 means object may exist but key lacks access — still worth noting
        if (
          probeErr instanceof PlatformSDKError &&
          probeErr.status !== 404
        ) {
          warnings.push(
            `Probe ${name}: ${probeErr.status} ${probeErr.code}`,
          );
        }
      }
    }

    return {
      source: "heuristic",
      objects: found,
      patientObject: envPatient || pickBest(found, PATIENT_HINTS),
      taskObject: envTask || pickBest(found, TASK_HINTS),
      warnings,
      connected: true,
    };
  }
}
