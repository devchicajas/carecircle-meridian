import { EXPOSED_OBJECT_NAMES, MERIDIAN_OBJECTS } from "@/lib/meridian/objects";
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
  readOnly: boolean;
};

export type CareCircleSchema = {
  source: "openapi" | "configured" | "unavailable";
  objects: DiscoveredObject[];
  patientObject: string;
  caregiverObject: string;
  carePlanObject: string;
  appointmentObject: string;
  medicationObject: string;
  taskObject: string;
  notificationObject: string;
  warnings: string[];
  connected: boolean;
  authError?: {
    status: number;
    code: string;
    detail?: string;
    traceId?: string;
  };
  writeOpsNeeded: string[];
};

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function parseOpenApiObjects(spec: unknown): DiscoveredObject[] {
  const root = spec as {
    paths?: Record<string, Record<string, unknown>>;
  };
  const paths = root?.paths ?? {};
  const byObject = new Map<string, DiscoveredObject>();

  for (const [path, methods] of Object.entries(paths)) {
    const match = path.match(/\/api\/ext\/v1\/objects\/([^/{]+)(?:\/|$)/);
    if (!match) continue;
    const name = match[1];
    if (!name || name.startsWith("{")) continue;

    const methodNames = Object.keys(methods ?? {})
      .filter((m) => !m.startsWith("x-"))
      .map((m) => m.toUpperCase());

    const existing = byObject.get(name) ?? {
      name,
      path: `/api/ext/v1/objects/${name}`,
      methods: [],
      operations: [],
      readOnly: true,
    };
    existing.methods = unique([...existing.methods, ...methodNames]);
    existing.operations = unique([
      ...existing.operations,
      ...methodNames.map((m) => `${m} ${path}`),
    ]);
    existing.readOnly = !existing.methods.some((m) =>
      ["POST", "PATCH", "PUT", "DELETE"].includes(m),
    );
    byObject.set(name, existing);
  }

  return [...byObject.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function configuredObjects(): DiscoveredObject[] {
  return EXPOSED_OBJECT_NAMES.map((name) => ({
    name,
    path: `/api/ext/v1/objects/${name}`,
    methods: ["GET"],
    operations: [`GET /api/ext/v1/objects/${name}`],
    readOnly: true,
  }));
}

function writeOpsFromObjects(objects: DiscoveredObject[]) {
  const needed: string[] = [];
  for (const name of EXPOSED_OBJECT_NAMES) {
    const obj = objects.find((o) => o.name === name);
    const ops = obj?.methods ?? ["GET"];
    if (!ops.includes("POST")) {
      needed.push(`POST /api/ext/v1/objects/${name} (create)`);
    }
    if (!ops.includes("PATCH") && !ops.includes("PUT")) {
      needed.push(`PATCH /api/ext/v1/objects/${name}/{id} (update)`);
    }
  }
  return needed;
}

export async function discoverCareCircleSchema(
  sdk?: PlatformSDK | null,
): Promise<CareCircleSchema> {
  const client = sdk === undefined ? createPlatformSDKFromEnv() : sdk;
  const base: Omit<CareCircleSchema, "source" | "objects" | "warnings" | "connected" | "writeOpsNeeded"> = {
    patientObject: MERIDIAN_OBJECTS.patient,
    caregiverObject: MERIDIAN_OBJECTS.caregiver,
    carePlanObject: MERIDIAN_OBJECTS.carePlan,
    appointmentObject: MERIDIAN_OBJECTS.appointment,
    medicationObject: MERIDIAN_OBJECTS.medication,
    taskObject: MERIDIAN_OBJECTS.careTask,
    notificationObject: MERIDIAN_OBJECTS.notification,
  };

  if (!client) {
    return {
      ...base,
      source: "unavailable",
      objects: configuredObjects(),
      warnings: [
        "MERIDIAN_API_KEY is not available in this runtime. Live Meridian reads require the server-side key (present on the published app).",
      ],
      connected: false,
      writeOpsNeeded: writeOpsFromObjects(configuredObjects()),
    };
  }

  try {
    const spec = await client.getOpenApi();
    const parsed = parseOpenApiObjects(spec);
    const known = EXPOSED_OBJECT_NAMES.map((name) => {
      const found = parsed.find((o) => o.name === name);
      return (
        found ?? {
          name,
          path: `/api/ext/v1/objects/${name}`,
          methods: ["GET"],
          operations: [`GET /api/ext/v1/objects/${name}`],
          readOnly: true,
        }
      );
    });

    const warnings: string[] = [];
    for (const name of EXPOSED_OBJECT_NAMES) {
      if (!parsed.some((o) => o.name === name)) {
        warnings.push(
          `OpenAPI did not list object "${name}" explicitly; using configured name.`,
        );
      }
    }

    return {
      ...base,
      source: "openapi",
      objects: known,
      warnings,
      connected: true,
      writeOpsNeeded: writeOpsFromObjects(known),
    };
  } catch (err) {
    const authError =
      err instanceof PlatformSDKError
        ? {
            status: err.status,
            code: err.code,
            detail: err.detail,
            traceId: err.traceId,
          }
        : undefined;

    const warnings = [
      err instanceof PlatformSDKError
        ? `OpenAPI auth/load failed: HTTP ${err.status} ${err.code}${err.traceId ? ` (trace ${err.traceId})` : ""}`
        : err instanceof Error
          ? `OpenAPI load failed: ${err.message}`
          : "OpenAPI load failed.",
    ];

    // Key may still list records even if OpenAPI route differs
    return {
      ...base,
      source: "configured",
      objects: configuredObjects(),
      warnings,
      connected: true,
      authError,
      writeOpsNeeded: writeOpsFromObjects(configuredObjects()),
    };
  }
}
