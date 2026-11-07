import { discoverCareCircleSchema } from "@/lib/meridian/discovery";
import {
  createPlatformSDKFromEnv,
  PlatformSDK,
  PlatformSDKError,
} from "@/lib/sdk/platformSDK";
import { pickString } from "@/lib/utils";

export type DataSource = "meridian" | "demo";

export type Patient = {
  id: string;
  name: string;
  status: string;
  age?: string;
  condition?: string;
  caregiver?: string;
  phone?: string;
  city?: string;
  notes?: string;
  updatedAt?: string;
  raw: Record<string, unknown>;
};

export type CareTask = {
  id: string;
  title: string;
  status: string;
  priority?: string;
  dueAt?: string;
  patientId?: string;
  patientName?: string;
  assignee?: string;
  notes?: string;
  raw: Record<string, unknown>;
  canUpdateStatus: boolean;
};

export type CareSnapshot = {
  source: DataSource;
  connected: boolean;
  warnings: string[];
  patientObject: string | null;
  taskObject: string | null;
  objects: string[];
  patients: Patient[];
  tasks: CareTask[];
  metrics: {
    patients: number;
    activePatients: number;
    openTasks: number;
    completedTasks: number;
    needsAttention: number;
  };
};

const DEMO_PATIENTS: Patient[] = [
  {
    id: "demo-maria",
    name: "María González",
    status: "Active",
    age: "78",
    condition: "Hypertension · Type 2 Diabetes",
    caregiver: "Sofía Alvarez",
    phone: "(404) 555-0148",
    city: "Atlanta, GA",
    notes: "Prefers Spanish-first communication. Morning meds with breakfast.",
    updatedAt: new Date().toISOString(),
    raw: { demo: true },
  },
  {
    id: "demo-james",
    name: "James Okonkwo",
    status: "Active",
    age: "71",
    condition: "COPD · Mild cognitive impairment",
    caregiver: "Amara Okonkwo",
    phone: "(404) 555-0192",
    city: "Decatur, GA",
    notes: "Needs afternoon nebulizer check-ins.",
    updatedAt: new Date().toISOString(),
    raw: { demo: true },
  },
  {
    id: "demo-elena",
    name: "Elena Ruiz",
    status: "Monitoring",
    age: "84",
    condition: "Post-hip replacement recovery",
    caregiver: "Luis Ruiz",
    phone: "(678) 555-0110",
    city: "Marietta, GA",
    notes: "Physical therapy Mon/Wed/Fri.",
    updatedAt: new Date().toISOString(),
    raw: { demo: true },
  },
];

const DEMO_TASKS: CareTask[] = [
  {
    id: "demo-task-1",
    title: "Confirm morning blood pressure reading",
    status: "Open",
    priority: "High",
    dueAt: new Date().toISOString(),
    patientId: "demo-maria",
    patientName: "María González",
    assignee: "Sofía Alvarez",
    notes: "Log systolic/diastolic in care notes.",
    raw: { demo: true },
    canUpdateStatus: false,
  },
  {
    id: "demo-task-2",
    title: "Prepare medication refill checklist",
    status: "In Progress",
    priority: "Medium",
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    patientId: "demo-maria",
    patientName: "María González",
    assignee: "Sofía Alvarez",
    raw: { demo: true },
    canUpdateStatus: false,
  },
  {
    id: "demo-task-3",
    title: "Schedule pulmonology follow-up",
    status: "Open",
    priority: "High",
    patientId: "demo-james",
    patientName: "James Okonkwo",
    assignee: "Amara Okonkwo",
    raw: { demo: true },
    canUpdateStatus: false,
  },
];

function recordId(record: Record<string, unknown>) {
  return (
    pickString(record, ["id", "Id", "ID", "record_id", "uuid", "pk"]) ??
    pickString(record, ["name", "Name", "title", "Title"]) ??
    JSON.stringify(record).slice(0, 24)
  );
}

function normalizePatient(record: Record<string, unknown>): Patient {
  const first = pickString(record, [
    "first_name",
    "firstName",
    "FirstName",
    "given_name",
  ]);
  const last = pickString(record, [
    "last_name",
    "lastName",
    "LastName",
    "family_name",
  ]);
  const combined = [first, last].filter(Boolean).join(" ");
  const name =
    pickString(record, [
      "name",
      "Name",
      "full_name",
      "fullName",
      "patient_name",
      "PatientName",
      "display_name",
    ]) ||
    combined ||
    "Unnamed patient";

  return {
    id: recordId(record),
    name,
    status:
      pickString(record, [
        "status",
        "Status",
        "care_status",
        "CareStatus",
        "state",
      ]) || "Active",
    age: pickString(record, ["age", "Age"]),
    condition: pickString(record, [
      "condition",
      "Condition",
      "diagnosis",
      "Diagnosis",
      "primary_condition",
      "health_conditions",
    ]),
    caregiver: pickString(record, [
      "caregiver",
      "Caregiver",
      "primary_caregiver",
      "assigned_caregiver",
      "caregiver_name",
    ]),
    phone: pickString(record, ["phone", "Phone", "mobile", "Mobile"]),
    city: pickString(record, [
      "city",
      "City",
      "location",
      "Location",
      "address_city",
    ]),
    notes: pickString(record, ["notes", "Notes", "summary", "Summary"]),
    updatedAt: pickString(record, [
      "updated_at",
      "updatedAt",
      "UpdatedAt",
      "modified_at",
      "last_modified",
    ]),
    raw: record,
  };
}

function normalizeTask(
  record: Record<string, unknown>,
  canUpdateStatus: boolean,
): CareTask {
  return {
    id: recordId(record),
    title:
      pickString(record, [
        "title",
        "Title",
        "name",
        "Name",
        "task",
        "Task",
        "description",
        "Description",
        "subject",
      ]) || "Untitled task",
    status:
      pickString(record, [
        "status",
        "Status",
        "task_status",
        "TaskStatus",
        "state",
      ]) || "Open",
    priority: pickString(record, ["priority", "Priority"]),
    dueAt: pickString(record, [
      "due_at",
      "dueAt",
      "DueAt",
      "due_date",
      "DueDate",
      "deadline",
    ]),
    patientId: pickString(record, [
      "patient_id",
      "patientId",
      "PatientId",
      "patient",
      "Patient",
      "care_recipient_id",
    ]),
    patientName: pickString(record, [
      "patient_name",
      "patientName",
      "PatientName",
      "care_recipient_name",
    ]),
    assignee: pickString(record, [
      "assignee",
      "Assignee",
      "assigned_to",
      "AssignedTo",
      "caregiver",
      "owner",
    ]),
    notes: pickString(record, ["notes", "Notes", "details", "Details"]),
    raw: record,
    canUpdateStatus,
  };
}

function isOpenStatus(status: string) {
  const s = status.toLowerCase();
  return !(
    s.includes("complete") ||
    s.includes("done") ||
    s.includes("closed") ||
    s.includes("cancel")
  );
}

function computeMetrics(patients: Patient[], tasks: CareTask[]) {
  const openTasks = tasks.filter((t) => isOpenStatus(t.status)).length;
  const completedTasks = tasks.length - openTasks;
  const activePatients = patients.filter((p) =>
    /active|monitoring|open/i.test(p.status),
  ).length;
  const needsAttention = tasks.filter(
    (t) =>
      isOpenStatus(t.status) &&
      /high|urgent|critical/i.test(t.priority ?? ""),
  ).length;
  return {
    patients: patients.length,
    activePatients,
    openTasks,
    completedTasks,
    needsAttention,
  };
}

function demoSnapshot(warnings: string[]): CareSnapshot {
  return {
    source: "demo",
    connected: false,
    warnings,
    patientObject: null,
    taskObject: null,
    objects: [],
    patients: DEMO_PATIENTS,
    tasks: DEMO_TASKS,
    metrics: computeMetrics(DEMO_PATIENTS, DEMO_TASKS),
  };
}

function taskSupportsPatch(
  schemaOps: string[],
  taskObject: string | null,
): boolean {
  if (!taskObject) return false;
  return schemaOps.some(
    (op) =>
      op.includes(`PATCH /api/ext/v1/objects/${taskObject}/`) ||
      op.startsWith("PATCH"),
  );
}

export async function loadCareSnapshot(): Promise<CareSnapshot> {
  const sdk = createPlatformSDKFromEnv();
  const schema = await discoverCareCircleSchema(sdk);

  if (!sdk || !schema.connected) {
    return demoSnapshot(schema.warnings);
  }

  const warnings = [...schema.warnings];
  let patients: Patient[] = [];
  let tasks: CareTask[] = [];
  const canUpdate = taskSupportsPatch(
    schema.objects.flatMap((o) => o.operations),
    schema.taskObject,
  );

  if (schema.patientObject) {
    try {
      const { records } = await sdk.listRecords(schema.patientObject, {
        limit: 100,
      });
      patients = records.map((r) =>
        normalizePatient(r as Record<string, unknown>),
      );
    } catch (err) {
      warnings.push(formatErr("Patients", err));
    }
  }

  if (schema.taskObject) {
    try {
      const { records } = await sdk.listRecords(schema.taskObject, {
        limit: 100,
      });
      tasks = records.map((r) =>
        normalizeTask(r as Record<string, unknown>, canUpdate),
      );
    } catch (err) {
      warnings.push(formatErr("Care tasks", err));
    }
  }

  // If connected but empty objects, keep Meridian source (not fake demo patients)
  return {
    source: "meridian",
    connected: true,
    warnings,
    patientObject: schema.patientObject,
    taskObject: schema.taskObject,
    objects: schema.objects.map((o) => o.name),
    patients,
    tasks,
    metrics: computeMetrics(patients, tasks),
  };
}

export async function getPatientById(id: string) {
  const snapshot = await loadCareSnapshot();
  const patient = snapshot.patients.find((p) => p.id === id);
  if (!patient) return { snapshot, patient: null, tasks: [] as CareTask[] };
  const tasks = snapshot.tasks.filter(
    (t) =>
      t.patientId === patient.id ||
      t.patientName?.toLowerCase() === patient.name.toLowerCase() ||
      (patient.name.toLowerCase().includes("maría") &&
        t.patientName?.toLowerCase().includes("maría")),
  );
  return { snapshot, patient, tasks };
}

export async function updateTaskStatus(taskId: string, status: string) {
  const sdk = createPlatformSDKFromEnv();
  if (!sdk) {
    throw new PlatformSDKError({
      status: 503,
      code: "MISSING_API_KEY",
      detail: "Cannot update tasks without MERIDIAN_API_KEY.",
    });
  }

  const schema = await discoverCareCircleSchema(sdk);
  if (!schema.taskObject) {
    throw new PlatformSDKError({
      status: 404,
      code: "TASK_OBJECT_UNEXPOSED",
      detail:
        "No care-task object is exposed in Meridian OpenAPI. Expose it under Object APIs before status updates can work.",
    });
  }

  // Only send status-like fields — do not invent schema.
  const payloadCandidates = [
    { status },
    { Status: status },
    { task_status: status },
  ];

  let lastError: unknown;
  for (const payload of payloadCandidates) {
    try {
      const updated = await sdk.updateRecord(
        schema.taskObject,
        taskId,
        payload,
      );
      return normalizeTask(
        (updated as Record<string, unknown>) ?? { id: taskId, status },
        true,
      );
    } catch (err) {
      lastError = err;
      // Try next field shape on validation-like failures
      if (
        err instanceof PlatformSDKError &&
        (err.status === 400 || err.status === 422)
      ) {
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

function formatErr(label: string, err: unknown) {
  if (err instanceof PlatformSDKError) {
    return `${label}: ${err.status} ${err.code}${err.detail ? ` — ${err.detail}` : ""}${err.traceId ? ` (trace ${err.traceId})` : ""}`;
  }
  if (err instanceof Error) return `${label}: ${err.message}`;
  return `${label}: unknown error`;
}

export function findMariaGonzalez(patients: Patient[]) {
  return (
    patients.find((p) =>
      /mar[ií]a\s+gonz[aá]lez/i.test(p.name),
    ) ?? null
  );
}
