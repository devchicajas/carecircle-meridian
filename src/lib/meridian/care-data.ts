import { discoverCareCircleSchema } from "@/lib/meridian/discovery";
import { MERIDIAN_OBJECTS } from "@/lib/meridian/objects";
import {
  createPlatformSDKFromEnv,
  PlatformSDKError,
} from "@/lib/sdk/platformSDK";
import { pickString } from "@/lib/utils";

export type DataSource = "meridian" | "unavailable";

export type Patient = {
  id: string;
  name: string;
  status: string;
  language?: string;
  phone?: string;
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  caregiver?: string;
  condition?: string;
  city?: string;
  notes?: string;
  updatedAt?: string;
  raw: Record<string, unknown>;
};

export type Caregiver = {
  id: string;
  name: string;
  role?: string;
  patientId?: string;
  patientName?: string;
  relationship?: string;
  language?: string;
  phone?: string;
  accessPermissions?: string;
  raw: Record<string, unknown>;
};

export type CarePlan = {
  id: string;
  patientId?: string;
  patientName?: string;
  diagnosisDate?: string;
  securityLevel?: string;
  followUpInstructions?: string;
  assignedCoordinator?: string;
  status: string;
  raw: Record<string, unknown>;
};

export type Appointment = {
  id: string;
  patientId?: string;
  patientName?: string;
  type?: string;
  provider?: string;
  dateTime?: string;
  location?: string;
  status: string;
  transportationSupport?: string;
  raw: Record<string, unknown>;
};

export type Medication = {
  id: string;
  patientId?: string;
  patientName?: string;
  name: string;
  dosage?: string;
  frequency?: string;
  prescribingDoctor?: string;
  lastRenewalDate?: string;
  refillReminderEnabled?: string;
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
  completionTimeline?: string;
  notes?: string;
  raw: Record<string, unknown>;
  canUpdateStatus: boolean;
};

export type NotificationItem = {
  id: string;
  recipientType?: string;
  recipientPatient?: string;
  recipientCaregiver?: string;
  language?: string;
  message: string;
  relatedTask?: string;
  relatedAppointment?: string;
  status: string;
  raw: Record<string, unknown>;
};

export type CareSnapshot = {
  source: DataSource;
  connected: boolean;
  loadingError?: string;
  authError?: {
    status: number;
    code: string;
    detail?: string;
    traceId?: string;
  };
  warnings: string[];
  writeOpsNeeded: string[];
  patientObject: string;
  caregiverObject: string;
  carePlanObject: string;
  appointmentObject: string;
  medicationObject: string;
  taskObject: string;
  notificationObject: string;
  objects: string[];
  patients: Patient[];
  caregivers: Caregiver[];
  carePlans: CarePlan[];
  appointments: Appointment[];
  medications: Medication[];
  tasks: CareTask[];
  notifications: NotificationItem[];
  metrics: {
    patients: number;
    activePatients: number;
    openTasks: number;
    completedTasks: number;
    needsAttention: number;
    upcomingAppointments: number;
    medications: number;
    unreadNotifications: number;
  };
};

function recordId(record: Record<string, unknown>) {
  return (
    pickString(record, [
      "id",
      "Id",
      "ID",
      "record_id",
      "uuid",
      "pk",
      "patient_id",
      "Patient ID",
      "patientId",
      "caregiver_id",
      "Caregiver ID",
      "plan_id",
      "Plan ID",
      "appointment_id",
      "Appointment ID",
      "medication_id",
      "Medication ID",
      "task_id",
      "Task ID",
      "notification_id",
      "Notification ID",
      "Event ID",
    ]) ?? JSON.stringify(record).slice(0, 24)
  );
}

function relationId(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return pickString(obj, ["id", "Id", "name", "Name", "label"]);
  }
  return undefined;
}

function relationName(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return pickString(obj, [
      "name",
      "Name",
      "full_name",
      "Full Name",
      "label",
      "title",
    ]);
  }
  return undefined;
}

export function normalizePatient(record: Record<string, unknown>): Patient {
  const first = pickString(record, ["first_name", "firstName", "FirstName"]);
  const last = pickString(record, ["last_name", "lastName", "LastName"]);
  const combined = [first, last].filter(Boolean).join(" ");
  return {
    id: recordId(record),
    name:
      pickString(record, [
        "full_name",
        "Full Name",
        "name",
        "Name",
        "patient_name",
        "display_name",
      ]) ||
      combined ||
      "Unnamed patient",
    status:
      pickString(record, [
        "case_status",
        "Case Status",
        "status",
        "Status",
        "care_status",
      ]) || "Unknown",
    language: pickString(record, [
      "preferred_language",
      "Preferred Language",
      "language",
      "Language",
    ]),
    phone: pickString(record, ["phone", "Phone", "mobile", "Mobile"]),
    email: pickString(record, ["email", "Email"]),
    emergencyContactName: pickString(record, [
      "emergency_contact_name",
      "Emergency Contact Name",
    ]),
    emergencyContactPhone: pickString(record, [
      "emergency_contact_phone",
      "Emergency Contact Phone",
    ]),
    caregiver: pickString(record, [
      "caregiver",
      "Caregiver",
      "primary_caregiver",
      "assigned_caregiver",
    ]),
    condition: pickString(record, [
      "condition",
      "Condition",
      "diagnosis",
      "Diagnosis",
    ]),
    city: pickString(record, ["city", "City", "location", "Location"]),
    notes: pickString(record, ["notes", "Notes", "summary", "Summary"]),
    updatedAt: pickString(record, [
      "updated_at",
      "updatedAt",
      "modified_at",
      "last_modified",
    ]),
    raw: record,
  };
}

function normalizeCaregiver(record: Record<string, unknown>): Caregiver {
  const patient = record.Patient ?? record.patient;
  return {
    id: recordId(record),
    name:
      pickString(record, ["full_name", "Full Name", "name", "Name"]) ||
      "Unnamed caregiver",
    role: pickString(record, ["role", "Role"]),
    patientId: relationId(patient) || pickString(record, ["patient_id", "PatientId"]),
    patientName:
      relationName(patient) ||
      pickString(record, ["patient_name", "PatientName"]),
    relationship: pickString(record, [
      "relationship_to_patient",
      "Relationship to Patient",
      "relationship",
    ]),
    language: pickString(record, [
      "preferred_language",
      "Preferred Language",
      "language",
    ]),
    phone: pickString(record, ["phone", "Phone"]),
    accessPermissions: pickString(record, [
      "access_permissions",
      "Access Permissions",
      "permissions",
    ]),
    raw: record,
  };
}

function normalizeCarePlan(record: Record<string, unknown>): CarePlan {
  const patient = record.Patient ?? record.patient;
  return {
    id: recordId(record),
    patientId: relationId(patient) || pickString(record, ["patient_id"]),
    patientName: relationName(patient) || pickString(record, ["patient_name"]),
    diagnosisDate: pickString(record, [
      "diagnosis_date",
      "Diagnosis Date",
      "diagnosisDate",
    ]),
    securityLevel: pickString(record, [
      "security_level",
      "Security Level",
      "securityLevel",
    ]),
    followUpInstructions: pickString(record, [
      "follow_up_instructions",
      "Follow-up Instructions",
      "followUpInstructions",
    ]),
    assignedCoordinator: pickString(record, [
      "assigned_coordinator",
      "Assigned Coordinator",
      "assignedCoordinator",
    ]),
    status: pickString(record, ["status", "Status"]) || "Unknown",
    raw: record,
  };
}

function normalizeAppointment(record: Record<string, unknown>): Appointment {
  const patient = record.Patient ?? record.patient;
  return {
    id: recordId(record),
    patientId: relationId(patient) || pickString(record, ["patient_id"]),
    patientName: relationName(patient) || pickString(record, ["patient_name"]),
    type: pickString(record, [
      "appointment_type",
      "Appointment Type",
      "type",
      "Type",
    ]),
    provider: pickString(record, [
      "provider_name",
      "Provider Name",
      "provider",
    ]),
    dateTime: pickString(record, [
      "date_time",
      "Date & Time",
      "dateTime",
      "scheduled_at",
      "start_at",
    ]),
    location: pickString(record, ["location", "Location"]),
    status: pickString(record, ["status", "Status"]) || "Unknown",
    transportationSupport: pickString(record, [
      "transportation_support",
      "Transportation Support",
    ]),
    raw: record,
  };
}

function normalizeMedication(record: Record<string, unknown>): Medication {
  const patient = record.Patient ?? record.patient;
  return {
    id: recordId(record),
    patientId: relationId(patient) || pickString(record, ["patient_id"]),
    patientName: relationName(patient) || pickString(record, ["patient_name"]),
    name:
      pickString(record, [
        "medication_name",
        "Medication Name",
        "name",
        "Name",
      ]) || "Untitled medication",
    dosage: pickString(record, [
      "prescribed_dosage",
      "Prescribed Dosage",
      "dosage",
    ]),
    frequency: pickString(record, ["frequency", "Frequency"]),
    prescribingDoctor: pickString(record, [
      "prescribing_doctor",
      "Prescribing Doctor",
    ]),
    lastRenewalDate: pickString(record, [
      "last_renewal_date",
      "Last Renewal Date",
    ]),
    refillReminderEnabled: pickString(record, [
      "refill_reminder_enabled",
      "Refill Reminder Enabled",
    ]),
    raw: record,
  };
}

export function normalizeTask(record: Record<string, unknown>): CareTask {
  const patient = record.Patient ?? record.patient;
  const caregiver = record["Assigned Caregiver"] ?? record.assigned_caregiver ?? record.assignee;
  return {
    id: recordId(record),
    title:
      pickString(record, [
        "task_description",
        "Task Description",
        "title",
        "Title",
        "name",
        "Name",
        "description",
        "Description",
      ]) || "Untitled task",
    status: pickString(record, ["status", "Status"]) || "Open",
    priority: pickString(record, ["priority", "Priority"]),
    dueAt: pickString(record, [
      "due_date",
      "Due Date",
      "due_at",
      "dueAt",
      "deadline",
    ]),
    patientId: relationId(patient) || pickString(record, ["patient_id", "PatientId"]),
    patientName:
      relationName(patient) ||
      pickString(record, ["patient_name", "PatientName"]),
    assignee:
      relationName(caregiver) ||
      pickString(record, [
        "assigned_caregiver",
        "Assigned Caregiver",
        "assignee",
        "Assignee",
      ]),
    completionTimeline: pickString(record, [
      "completion_timeline",
      "Completion Timeline",
    ]),
    notes: pickString(record, ["notes", "Notes", "details"]),
    raw: record,
    canUpdateStatus: false, // read-only until Meridian enables PATCH
  };
}

function normalizeNotification(
  record: Record<string, unknown>,
): NotificationItem {
  return {
    id: recordId(record),
    recipientType: pickString(record, [
      "recipient_type",
      "Recipient Type",
    ]),
    recipientPatient: pickString(record, [
      "recipient_patient",
      "Recipient Patient",
    ]),
    recipientCaregiver: pickString(record, [
      "recipient_caregiver",
      "Recipient Caregiver",
    ]),
    language: pickString(record, ["language", "Language"]),
    message:
      pickString(record, ["message", "Message", "body", "Body"]) ||
      "Notification",
    relatedTask: pickString(record, ["related_task", "Related Task"]),
    relatedAppointment: pickString(record, [
      "related_appointment",
      "Related Appointment",
    ]),
    status: pickString(record, ["status", "Status"]) || "Unknown",
    raw: record,
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

function computeMetrics(snapshot: {
  patients: Patient[];
  tasks: CareTask[];
  appointments: Appointment[];
  medications: Medication[];
  notifications: NotificationItem[];
}) {
  const openTasks = snapshot.tasks.filter((t) => isOpenStatus(t.status)).length;
  return {
    patients: snapshot.patients.length,
    activePatients: snapshot.patients.filter((p) =>
      /active|open|monitoring|en curso/i.test(p.status),
    ).length,
    openTasks,
    completedTasks: snapshot.tasks.length - openTasks,
    needsAttention: snapshot.tasks.filter(
      (t) =>
        isOpenStatus(t.status) &&
        /high|urgent|critical|alta/i.test(t.priority ?? ""),
    ).length,
    upcomingAppointments: snapshot.appointments.filter((a) =>
      isOpenStatus(a.status),
    ).length,
    medications: snapshot.medications.length,
    unreadNotifications: snapshot.notifications.filter((n) =>
      /unread|pending|new|open/i.test(n.status),
    ).length,
  };
}

function emptySnapshot(
  partial: Partial<CareSnapshot> & Pick<CareSnapshot, "warnings" | "source" | "connected">,
): CareSnapshot {
  const patients = partial.patients ?? [];
  const tasks = partial.tasks ?? [];
  const appointments = partial.appointments ?? [];
  const medications = partial.medications ?? [];
  const notifications = partial.notifications ?? [];
  return {
    source: partial.source,
    connected: partial.connected,
    loadingError: partial.loadingError,
    authError: partial.authError,
    warnings: partial.warnings,
    writeOpsNeeded: partial.writeOpsNeeded ?? [],
    patientObject: MERIDIAN_OBJECTS.patient,
    caregiverObject: MERIDIAN_OBJECTS.caregiver,
    carePlanObject: MERIDIAN_OBJECTS.carePlan,
    appointmentObject: MERIDIAN_OBJECTS.appointment,
    medicationObject: MERIDIAN_OBJECTS.medication,
    taskObject: MERIDIAN_OBJECTS.careTask,
    notificationObject: MERIDIAN_OBJECTS.notification,
    objects: partial.objects ?? Object.values(MERIDIAN_OBJECTS),
    patients,
    caregivers: partial.caregivers ?? [],
    carePlans: partial.carePlans ?? [],
    appointments,
    medications,
    tasks,
    notifications,
    metrics: computeMetrics({
      patients,
      tasks,
      appointments,
      medications,
      notifications,
    }),
  };
}

async function listObject(
  sdk: NonNullable<ReturnType<typeof createPlatformSDKFromEnv>>,
  objectName: string,
  label: string,
  warnings: string[],
) {
  try {
    const { records } = await sdk.listRecords(objectName, { limit: 100 });
    return records as Record<string, unknown>[];
  } catch (err) {
    if (err instanceof PlatformSDKError) {
      warnings.push(
        `${label}: HTTP ${err.status} ${err.code}${err.detail ? ` — ${err.detail}` : ""}${err.traceId ? ` (trace ${err.traceId})` : ""}`,
      );
      if (!warnings.some((w) => w.startsWith("authError:"))) {
        // stash structured auth once
      }
    } else if (err instanceof Error) {
      warnings.push(`${label}: ${err.message}`);
    } else {
      warnings.push(`${label}: unknown error`);
    }
    return [] as Record<string, unknown>[];
  }
}

export async function loadCareSnapshot(): Promise<CareSnapshot> {
  const sdk = createPlatformSDKFromEnv();
  const schema = await discoverCareCircleSchema(sdk);

  if (!sdk) {
    return emptySnapshot({
      source: "unavailable",
      connected: false,
      loadingError:
        "MERIDIAN_API_KEY is not configured in this server runtime.",
      warnings: schema.warnings,
      writeOpsNeeded: schema.writeOpsNeeded,
      objects: schema.objects.map((o) => o.name),
    });
  }

  const warnings = [...schema.warnings];
  let authError = schema.authError;

  const [
    patientRows,
    caregiverRows,
    carePlanRows,
    appointmentRows,
    medicationRows,
    taskRows,
    notificationRows,
  ] = await Promise.all([
    listObject(sdk, schema.patientObject, "patient", warnings),
    listObject(sdk, schema.caregiverObject, "caregiver", warnings),
    listObject(sdk, schema.carePlanObject, "carePlan", warnings),
    listObject(sdk, schema.appointmentObject, "appointment", warnings),
    listObject(sdk, schema.medicationObject, "medication", warnings),
    listObject(sdk, schema.taskObject, "careTask", warnings),
    listObject(sdk, schema.notificationObject, "notification", warnings),
  ]);

  // Capture first FORBIDDEN-style failure as authError if OpenAPI didn't
  if (!authError) {
    const forbidden = warnings.find((w) => /HTTP 401|HTTP 403/.test(w));
    if (forbidden) {
      const match = forbidden.match(
        /HTTP (\d+)\s+(\S+)(?:.*?trace ([a-f0-9-]+))?/i,
      );
      if (match) {
        authError = {
          status: Number(match[1]),
          code: match[2],
          detail: forbidden,
          traceId: match[3],
        };
      }
    }
  }

  const patients = patientRows.map(normalizePatient);
  const caregivers = caregiverRows.map(normalizeCaregiver);
  const carePlans = carePlanRows.map(normalizeCarePlan);
  const appointments = appointmentRows.map(normalizeAppointment);
  const medications = medicationRows.map(normalizeMedication);
  const tasks = taskRows.map(normalizeTask);
  const notifications = notificationRows.map(normalizeNotification);

  // Enrich patient caregiver label from caregiver records when possible
  for (const patient of patients) {
    if (patient.caregiver) continue;
    const linked = caregivers.find(
      (c) =>
        c.patientId === patient.id ||
        c.patientName?.toLowerCase() === patient.name.toLowerCase(),
    );
    if (linked) patient.caregiver = linked.name;
  }

  return emptySnapshot({
    source: "meridian",
    connected: true,
    authError,
    warnings,
    writeOpsNeeded: schema.writeOpsNeeded,
    objects: schema.objects.map((o) => o.name),
    patients,
    caregivers,
    carePlans,
    appointments,
    medications,
    tasks,
    notifications,
  });
}

export async function getPatientById(id: string) {
  const snapshot = await loadCareSnapshot();
  const patient = snapshot.patients.find((p) => p.id === id) ?? null;
  if (!patient) {
    return {
      snapshot,
      patient: null,
      tasks: [] as CareTask[],
      caregivers: [] as Caregiver[],
      carePlans: [] as CarePlan[],
      appointments: [] as Appointment[],
      medications: [] as Medication[],
      notifications: [] as NotificationItem[],
    };
  }

  const matchesPatient = (patientId?: string, patientName?: string) =>
    patientId === patient.id ||
    (!!patientName &&
      patientName.toLowerCase() === patient.name.toLowerCase());

  return {
    snapshot,
    patient,
    tasks: snapshot.tasks.filter((t) =>
      matchesPatient(t.patientId, t.patientName),
    ),
    caregivers: snapshot.caregivers.filter((c) =>
      matchesPatient(c.patientId, c.patientName),
    ),
    carePlans: snapshot.carePlans.filter((p) =>
      matchesPatient(p.patientId, p.patientName),
    ),
    appointments: snapshot.appointments.filter((a) =>
      matchesPatient(a.patientId, a.patientName),
    ),
    medications: snapshot.medications.filter((m) =>
      matchesPatient(m.patientId, m.patientName),
    ),
    notifications: snapshot.notifications.filter(
      (n) =>
        n.recipientPatient === patient.id ||
        n.recipientPatient?.toLowerCase() === patient.name.toLowerCase(),
    ),
  };
}

export function findMariaGonzalez(patients: Patient[]) {
  return (
    patients.find((p) => /mar[ií]a\s+gonz[aá]lez/i.test(p.name)) ?? null
  );
}
