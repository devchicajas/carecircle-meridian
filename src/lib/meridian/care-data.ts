import { discoverCareCircleSchema } from "@/lib/meridian/discovery";
import { MERIDIAN_OBJECTS } from "@/lib/meridian/objects";
import {
  composePersonName,
  flattenRecord,
  recordEnvelopeId,
} from "@/lib/meridian/records";
import {
  createPlatformSDKFromEnv,
  PlatformSDKError,
} from "@/lib/sdk/platformSDK";
import { pickString } from "@/lib/utils";

export type DataSource = "meridian" | "unavailable";

export type Patient = {
  id: string;
  businessId?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  status: string;
  language?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  careStartDate?: string;
  updatedAt?: string;
  raw: Record<string, unknown>;
};

export type Caregiver = {
  id: string;
  businessId?: string;
  name: string;
  role?: string;
  language?: string;
  phone?: string;
  email?: string;
  status: string;
  raw: Record<string, unknown>;
};

export type Membership = {
  id: string;
  businessId?: string;
  patientRef?: string;
  caregiverRef?: string;
  relationshipType?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  raw: Record<string, unknown>;
};

export type CarePlan = {
  id: string;
  businessId?: string;
  patientRef?: string;
  recoveryGoals?: string;
  dischargeDate?: string;
  assignedCoordinator?: string;
  status: string;
  startDate?: string;
  reviewDate?: string;
  raw: Record<string, unknown>;
};

export type Appointment = {
  id: string;
  businessId?: string;
  patientRef?: string;
  type?: string;
  provider?: string;
  dateTime?: string;
  location?: string;
  status: string;
  notes?: string;
  raw: Record<string, unknown>;
};

export type Medication = {
  id: string;
  businessId?: string;
  patientRef?: string;
  name: string;
  instructions?: string;
  frequency?: string;
  refillDate?: string;
  status: string;
  raw: Record<string, unknown>;
};

export type CareTask = {
  id: string;
  businessId?: string;
  title: string;
  status: string;
  priority?: string;
  dueAt?: string;
  patientRef?: string;
  carePlanRef?: string;
  assigneeRef?: string;
  completedOn?: string;
  escalated?: boolean;
  notes?: string;
  raw: Record<string, unknown>;
  canUpdateStatus: boolean;
};

export type NotificationItem = {
  id: string;
  businessId?: string;
  patientRef?: string;
  recipientCaregiver?: string;
  relatedTask?: string;
  relatedAppointment?: string;
  message: string;
  notificationType?: string;
  status: string;
  createdAt?: string;
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
  membershipObject: string;
  carePlanObject: string;
  appointmentObject: string;
  medicationObject: string;
  taskObject: string;
  notificationObject: string;
  objects: string[];
  patients: Patient[];
  caregivers: Caregiver[];
  memberships: Membership[];
  carePlans: CarePlan[];
  appointments: Appointment[];
  medications: Medication[];
  tasks: CareTask[];
  notifications: NotificationItem[];
  metrics: {
    patients: number;
    activeCarePlans: number;
    upcomingAppointments: number;
    pendingTasks: number;
    overdueTasks: number;
    unreadNotifications: number;
    openTasks: number;
    completedTasks: number;
    needsAttention: number;
    activePatients: number;
    medications: number;
  };
};

function normalizePatient(envelope: Record<string, unknown>): Patient {
  const f = flattenRecord(envelope);
  return {
    id: recordEnvelopeId(envelope),
    businessId: pickString(f, ["patientId"]),
    name: composePersonName(f),
    firstName: pickString(f, ["firstName"]),
    lastName: pickString(f, ["lastName"]),
    status: pickString(f, ["careStatus", "status"]) || "Unknown",
    language: pickString(f, ["preferredLanguage"]),
    phone: pickString(f, ["phoneNumber", "phone"]),
    email: pickString(f, ["emailAddress", "email"]),
    dateOfBirth: pickString(f, ["dateOfBirth"]),
    careStartDate: pickString(f, ["careStartDate"]),
    updatedAt: pickString(f, ["updatedAt"]),
    raw: envelope,
  };
}

function normalizeCaregiver(envelope: Record<string, unknown>): Caregiver {
  const f = flattenRecord(envelope);
  return {
    id: recordEnvelopeId(envelope),
    businessId: pickString(f, ["caregiverId"]),
    name: composePersonName(f),
    role: pickString(f, ["caregiverType"]),
    language: pickString(f, ["preferredLanguage"]),
    phone: pickString(f, ["phoneNumber"]),
    email: pickString(f, ["emailAddress", "email"]),
    status: pickString(f, ["status"]) || "Unknown",
    raw: envelope,
  };
}

function normalizeMembership(envelope: Record<string, unknown>): Membership {
  const f = flattenRecord(envelope);
  return {
    id: recordEnvelopeId(envelope),
    businessId: pickString(f, ["membershipId"]),
    patientRef: pickString(f, ["patient"]),
    caregiverRef: pickString(f, ["caregiver"]),
    relationshipType: pickString(f, ["relationshipType"]),
    status: pickString(f, ["membershipStatus", "status"]) || "Unknown",
    startDate: pickString(f, ["startDate"]),
    endDate: pickString(f, ["endDate"]),
    raw: envelope,
  };
}

function normalizeCarePlan(envelope: Record<string, unknown>): CarePlan {
  const f = flattenRecord(envelope);
  return {
    id: recordEnvelopeId(envelope),
    businessId: pickString(f, ["carePlanId"]),
    patientRef: pickString(f, ["patient"]),
    recoveryGoals: pickString(f, ["recoveryGoals"]),
    dischargeDate: pickString(f, ["dischargeDate"]),
    assignedCoordinator: pickString(f, ["assignedCoordinator"]),
    status: pickString(f, ["status"]) || "Unknown",
    startDate: pickString(f, ["startDate"]),
    reviewDate: pickString(f, ["reviewDate"]),
    raw: envelope,
  };
}

function normalizeAppointment(envelope: Record<string, unknown>): Appointment {
  const f = flattenRecord(envelope);
  return {
    id: recordEnvelopeId(envelope),
    businessId: pickString(f, ["appointmentId"]),
    patientRef: pickString(f, ["patient"]),
    type: pickString(f, ["appointmentType"]),
    provider: pickString(f, ["provider"]),
    dateTime: pickString(f, ["appointmentDateTime"]),
    location: pickString(f, ["location"]),
    status: pickString(f, ["status"]) || "Unknown",
    notes: pickString(f, ["notes"]),
    raw: envelope,
  };
}

function normalizeMedication(envelope: Record<string, unknown>): Medication {
  const f = flattenRecord(envelope);
  return {
    id: recordEnvelopeId(envelope),
    businessId: pickString(f, ["medicationId"]),
    patientRef: pickString(f, ["patient"]),
    name: pickString(f, ["medicationName", "name"]) || "Untitled medication",
    instructions: pickString(f, ["instructions"]),
    frequency: pickString(f, ["frequency"]),
    refillDate: pickString(f, ["refillDate"]),
    status: pickString(f, ["status"]) || "Unknown",
    raw: envelope,
  };
}

export function normalizeTask(envelope: Record<string, unknown>): CareTask {
  const f = flattenRecord(envelope);
  return {
    id: recordEnvelopeId(envelope),
    businessId: pickString(f, ["taskId"]),
    title: pickString(f, ["description", "title", "name"]) || "Untitled task",
    status: pickString(f, ["status"]) || "Pending",
    priority: pickString(f, ["priority"]),
    dueAt: pickString(f, ["dueDate"]),
    patientRef: pickString(f, ["patient"]),
    carePlanRef: pickString(f, ["carePlan"]),
    assigneeRef: pickString(f, ["assignedCaregiver"]),
    completedOn: pickString(f, ["completedOn"]),
    escalated: typeof f.escalated === "boolean" ? f.escalated : undefined,
    notes: pickString(f, ["notes"]),
    raw: envelope,
    canUpdateStatus: true,
  };
}

function normalizeNotification(
  envelope: Record<string, unknown>,
): NotificationItem {
  const f = flattenRecord(envelope);
  return {
    id: recordEnvelopeId(envelope),
    businessId: pickString(f, ["notificationId"]),
    patientRef: pickString(f, ["patient"]),
    recipientCaregiver: pickString(f, ["recipientCaregiver"]),
    relatedTask: pickString(f, ["relatedTask"]),
    relatedAppointment: pickString(f, ["relatedAppointment"]),
    message: pickString(f, ["message"]) || "Notification",
    notificationType: pickString(f, ["notificationType"]),
    status: pickString(f, ["readStatus", "status"]) || "Unknown",
    createdAt: pickString(f, ["createdAt"]),
    raw: envelope,
  };
}

function isPending(status: string) {
  return /pending|in progress|open/i.test(status);
}

function isOverdue(task: CareTask) {
  if (/overdue/i.test(task.status)) return true;
  if (!task.dueAt || /complete|cancel/i.test(task.status)) return false;
  const due = new Date(task.dueAt);
  if (Number.isNaN(due.getTime())) return false;
  const endOfDue = new Date(due);
  endOfDue.setHours(23, 59, 59, 999);
  return endOfDue.getTime() < Date.now();
}

function computeMetrics(input: {
  patients: Patient[];
  carePlans: CarePlan[];
  appointments: Appointment[];
  tasks: CareTask[];
  notifications: NotificationItem[];
  medications: Medication[];
}) {
  const pendingTasks = input.tasks.filter((t) => isPending(t.status)).length;
  const overdueTasks = input.tasks.filter((t) => isOverdue(t)).length;
  const openTasks = input.tasks.filter(
    (t) => !/complete|cancel/i.test(t.status),
  ).length;
  return {
    patients: input.patients.length,
    activeCarePlans: input.carePlans.filter((p) => /active/i.test(p.status))
      .length,
    upcomingAppointments: input.appointments.filter((a) =>
      /scheduled|rescheduled/i.test(a.status),
    ).length,
    pendingTasks,
    overdueTasks,
    unreadNotifications: input.notifications.filter((n) =>
      /unread|pending|new/i.test(n.status),
    ).length,
    openTasks,
    completedTasks: input.tasks.filter((t) => /complete/i.test(t.status))
      .length,
    needsAttention: overdueTasks,
    activePatients: input.patients.filter((p) => /active|recovery|chronic|routine/i.test(p.status))
      .length,
    medications: input.medications.length,
  };
}

function emptySnapshot(
  partial: Partial<CareSnapshot> &
    Pick<CareSnapshot, "warnings" | "source" | "connected">,
): CareSnapshot {
  const patients = partial.patients ?? [];
  const caregivers = partial.caregivers ?? [];
  const memberships = partial.memberships ?? [];
  const carePlans = partial.carePlans ?? [];
  const appointments = partial.appointments ?? [];
  const medications = partial.medications ?? [];
  const tasks = partial.tasks ?? [];
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
    membershipObject: MERIDIAN_OBJECTS.careCircleMembership,
    carePlanObject: MERIDIAN_OBJECTS.carePlan,
    appointmentObject: MERIDIAN_OBJECTS.appointment,
    medicationObject: MERIDIAN_OBJECTS.medication,
    taskObject: MERIDIAN_OBJECTS.careTask,
    notificationObject: MERIDIAN_OBJECTS.notification,
    objects: partial.objects ?? Object.values(MERIDIAN_OBJECTS),
    patients,
    caregivers,
    memberships,
    carePlans,
    appointments,
    medications,
    tasks,
    notifications,
    metrics: computeMetrics({
      patients,
      carePlans,
      appointments,
      tasks,
      notifications,
      medications,
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
    membershipRows,
    carePlanRows,
    appointmentRows,
    medicationRows,
    taskRows,
    notificationRows,
  ] = await Promise.all([
    listObject(sdk, MERIDIAN_OBJECTS.patient, "patient", warnings),
    listObject(sdk, MERIDIAN_OBJECTS.caregiver, "caregiver", warnings),
    listObject(
      sdk,
      MERIDIAN_OBJECTS.careCircleMembership,
      "careCircleMembership",
      warnings,
    ),
    listObject(sdk, MERIDIAN_OBJECTS.carePlan, "carePlan", warnings),
    listObject(sdk, MERIDIAN_OBJECTS.appointment, "appointment", warnings),
    listObject(sdk, MERIDIAN_OBJECTS.medication, "medication", warnings),
    listObject(sdk, MERIDIAN_OBJECTS.careTask, "careTask", warnings),
    listObject(sdk, MERIDIAN_OBJECTS.notification, "notification", warnings),
  ]);

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

  return emptySnapshot({
    source: "meridian",
    connected: true,
    authError,
    warnings,
    writeOpsNeeded: schema.writeOpsNeeded,
    objects: schema.objects.map((o) => o.name),
    patients: patientRows.map(normalizePatient),
    caregivers: caregiverRows.map(normalizeCaregiver),
    memberships: membershipRows.map(normalizeMembership),
    carePlans: carePlanRows.map(normalizeCarePlan),
    appointments: appointmentRows.map(normalizeAppointment),
    medications: medicationRows.map(normalizeMedication),
    tasks: taskRows.map(normalizeTask),
    notifications: notificationRows.map(normalizeNotification),
  });
}

function matchesPatientRef(
  patient: Patient,
  ref?: string,
) {
  if (!ref) return false;
  return (
    ref === patient.id ||
    ref === patient.businessId ||
    ref.toLowerCase() === patient.name.toLowerCase()
  );
}

export async function getPatientById(id: string) {
  const snapshot = await loadCareSnapshot();
  const patient =
    snapshot.patients.find(
      (p) => p.id === id || p.businessId === id,
    ) ?? null;
  if (!patient) {
    return {
      snapshot,
      patient: null,
      tasks: [] as CareTask[],
      caregivers: [] as Caregiver[],
      memberships: [] as Membership[],
      carePlans: [] as CarePlan[],
      appointments: [] as Appointment[],
      medications: [] as Medication[],
      notifications: [] as NotificationItem[],
    };
  }

  const memberships = snapshot.memberships.filter((m) =>
    matchesPatientRef(patient, m.patientRef),
  );
  const caregiverRefs = new Set(
    memberships.map((m) => m.caregiverRef).filter(Boolean),
  );
  const caregivers = snapshot.caregivers.filter(
    (c) =>
      caregiverRefs.has(c.businessId) ||
      caregiverRefs.has(c.id) ||
      memberships.some((m) => m.caregiverRef === c.name),
  );

  return {
    snapshot,
    patient,
    memberships,
    caregivers,
    carePlans: snapshot.carePlans.filter((p) =>
      matchesPatientRef(patient, p.patientRef),
    ),
    appointments: snapshot.appointments.filter((a) =>
      matchesPatientRef(patient, a.patientRef),
    ),
    medications: snapshot.medications.filter((m) =>
      matchesPatientRef(patient, m.patientRef),
    ),
    tasks: snapshot.tasks.filter((t) =>
      matchesPatientRef(patient, t.patientRef),
    ),
    notifications: snapshot.notifications.filter((n) =>
      matchesPatientRef(patient, n.patientRef),
    ),
  };
}

export function findMariaGonzalez(patients: Patient[]) {
  return (
    patients.find((p) => /mar[ií]a\s+gonz[aá]lez/i.test(p.name)) ?? null
  );
}

export function resolvePatientLabel(
  patients: Patient[],
  ref?: string,
) {
  if (!ref) return undefined;
  const match = patients.find(
    (p) => p.businessId === ref || p.id === ref || p.name === ref,
  );
  return match?.name ?? ref;
}

export function resolveCaregiverLabel(
  caregivers: Caregiver[],
  ref?: string,
) {
  if (!ref) return undefined;
  const match = caregivers.find(
    (c) => c.businessId === ref || c.id === ref || c.name === ref,
  );
  return match?.name ?? ref;
}

/** Create a care task — Meridian generates taskId. Do not send fabricated IDs. */
export async function createCareTask(values: {
  patient: string;
  description: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  assignedCaregiver?: string;
  carePlan?: string;
}) {
  const sdk = createPlatformSDKFromEnv();
  if (!sdk) {
    throw new PlatformSDKError({
      status: 503,
      code: "MISSING_API_KEY",
      detail: "MERIDIAN_API_KEY required to create care tasks.",
    });
  }

  const payload: Record<string, unknown> = {
    patient: values.patient,
    description: values.description,
    priority: values.priority || "Medium",
    status: values.status || "Pending",
  };
  if (values.dueDate) payload.dueDate = values.dueDate;
  if (values.assignedCaregiver) {
    payload.assignedCaregiver = values.assignedCaregiver;
  }
  if (values.carePlan) payload.carePlan = values.carePlan;

  const created = await sdk.createRecord(
    MERIDIAN_OBJECTS.careTask,
    payload,
    "CareCircle demo: create care task",
  );
  return normalizeTask(created as Record<string, unknown>);
}

export async function updateCareTaskStatus(
  taskId: string,
  status: string,
) {
  const sdk = createPlatformSDKFromEnv();
  if (!sdk) {
    throw new PlatformSDKError({
      status: 503,
      code: "MISSING_API_KEY",
      detail: "MERIDIAN_API_KEY required to update care tasks.",
    });
  }

  const values: Record<string, unknown> = { status };
  if (/complete/i.test(status)) {
    values.completedOn = new Date().toISOString().slice(0, 10);
  }

  const updated = await sdk.updateRecord(
    MERIDIAN_OBJECTS.careTask,
    taskId,
    values,
    "CareCircle demo: update care task status",
  );
  return normalizeTask(updated as Record<string, unknown>);
}

export async function updateNotificationReadStatus(
  notificationId: string,
  readStatus: string,
) {
  const sdk = createPlatformSDKFromEnv();
  if (!sdk) {
    throw new PlatformSDKError({
      status: 503,
      code: "MISSING_API_KEY",
      detail: "MERIDIAN_API_KEY required to update notifications.",
    });
  }
  const updated = await sdk.updateRecord(
    MERIDIAN_OBJECTS.notification,
    notificationId,
    { readStatus },
    "CareCircle demo: update notification read status",
  );
  return normalizeNotification(updated as Record<string, unknown>);
}
