import { discoverCareCircleSchema } from "@/lib/meridian/discovery";
import { MERIDIAN_OBJECTS } from "@/lib/meridian/objects";
import {
  composePersonName,
  flattenRecord,
  recordEnvelopeId,
} from "@/lib/meridian/records";
import {
  assertCaregiverAuthorizedForPatient,
  canonicalCaregiverWriteRef,
} from "@/lib/meridian/task-assignment";
import {
  assertTaskPatientMatchesCarePlan,
  canonicalCarePlanWriteRef,
  canonicalPatientWriteRef,
} from "@/lib/meridian/task-consistency";
import {
  createPlatformSDKFromEnv,
  PlatformSDK,
  PlatformSDKError,
} from "@/lib/sdk/platformSDK";
import { isActiveStatus, pickString } from "@/lib/utils";

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
    activeCarePlans: input.carePlans.filter((p) => isActiveStatus(p.status))
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

function matchesCaregiverRef(
  caregiver: Caregiver,
  ref?: string,
) {
  if (!ref) return false;
  return (
    ref === caregiver.id ||
    ref === caregiver.businessId ||
    ref.toLowerCase() === caregiver.name.toLowerCase()
  );
}

/**
 * Family caregivers should see people in their care circle — not a tenant-wide
 * patient directory. Returns [] when no memberships exist yet for this caregiver.
 */
export function lovedOnesForCaregiver(
  snapshot: CareSnapshot,
  caregiverRefs: Array<string | undefined | null>,
): Patient[] {
  const refs = caregiverRefs.filter(Boolean).map(String);
  if (refs.length === 0) return [];

  const caregiver = snapshot.caregivers.find((c) =>
    refs.some((ref) => matchesCaregiverRef(c, ref)),
  );
  const aliases = new Set(
    [caregiver?.id, caregiver?.businessId, caregiver?.name, ...refs].filter(
      Boolean,
    ) as string[],
  );

  const patientRefs = new Set(
    snapshot.memberships
      .filter((m) => {
      if (!m.caregiverRef) return false;
      // Meridian membershipStatus enum is Active | Inactive only.
      if (!/^active$/i.test((m.status || "").trim())) return false;
      if (aliases.has(m.caregiverRef)) return true;
      return caregiver
        ? matchesCaregiverRef(caregiver, m.caregiverRef)
        : false;
      })
      .map((m) => m.patientRef)
      .filter(Boolean) as string[],
  );

  return snapshot.patients.filter((p) =>
    [...patientRefs].some((ref) => matchesPatientRef(p, ref)),
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

  if (!values.patient?.trim()) {
    throw new PlatformSDKError({
      status: 422,
      code: "PATIENT_REQUIRED",
      detail: "Patient is required for Care Tasks.",
    });
  }
  if (!values.carePlan?.trim()) {
    throw new PlatformSDKError({
      status: 422,
      code: "CARE_PLAN_REQUIRED",
      detail: "Care Plan is required for Care Tasks.",
    });
  }
  if (!values.assignedCaregiver?.trim()) {
    throw new PlatformSDKError({
      status: 422,
      code: "ASSIGNED_CAREGIVER_REQUIRED",
      detail: "Assigned Caregiver is required for Care Tasks.",
    });
  }
  if (!values.description?.trim()) {
    throw new PlatformSDKError({
      status: 422,
      code: "DESCRIPTION_REQUIRED",
      detail: "Description is required for Care Tasks.",
    });
  }
  if (!values.dueDate?.trim()) {
    throw new PlatformSDKError({
      status: 422,
      code: "DUE_DATE_REQUIRED",
      detail: "Due Date is required for Care Tasks.",
    });
  }
  if (!values.priority?.trim()) {
    throw new PlatformSDKError({
      status: 422,
      code: "PRIORITY_REQUIRED",
      detail: "Priority is required for Care Tasks.",
    });
  }
  if (!values.status?.trim()) {
    throw new PlatformSDKError({
      status: 422,
      code: "STATUS_REQUIRED",
      detail: "Status is required for Care Tasks.",
    });
  }

  // Server-side CareCircle validation (not Meridian-global).
  const consistency = await assertTaskPatientMatchesCarePlan({
    patientRef: values.patient,
    carePlanRef: values.carePlan,
    sdk,
  });
  const assignment = await assertCaregiverAuthorizedForPatient({
    patientRef: values.patient,
    caregiverRef: values.assignedCaregiver,
    sdk,
  });

  const payload: Record<string, unknown> = {
    patient: canonicalPatientWriteRef(consistency.patient),
    description: values.description,
    priority: values.priority,
    status: values.status,
    dueDate: values.dueDate,
  };
  if (assignment.caregiver) {
    payload.assignedCaregiver = canonicalCaregiverWriteRef(assignment.caregiver);
  }
  if (consistency.carePlan) {
    payload.carePlan = canonicalCarePlanWriteRef(consistency.carePlan);
  }

  const created = await sdk.createRecord(
    MERIDIAN_OBJECTS.careTask,
    payload,
    "CareCircle: create care task after patient/care-plan check",
  );
  const createdTask = normalizeTask(created as Record<string, unknown>);

  // Read back from Meridian to verify persistence.
  const { records } = await sdk.listRecords(MERIDIAN_OBJECTS.careTask, {
    limit: 200,
  });
  const saved =
    (records as Record<string, unknown>[]).find(
      (row) => String(row.id) === createdTask.id,
    ) ?? null;
  if (!saved) {
    throw new PlatformSDKError({
      status: 502,
      code: "READBACK_FAILED",
      detail:
        "Care Task write appeared to succeed but the record could not be read back from Meridian.",
    });
  }
  return normalizeTask(saved);
}

export async function updateCareTaskStatus(
  taskId: string,
  status: string,
) {
  return updateCareTask(taskId, { status });
}

export async function updateCareTask(
  taskId: string,
  patch: {
    status?: string;
    patient?: string;
    carePlan?: string | null;
    description?: string;
    priority?: string;
    dueDate?: string;
    assignedCaregiver?: string;
    escalated?: boolean;
  },
) {
  const sdk = createPlatformSDKFromEnv();
  if (!sdk) {
    throw new PlatformSDKError({
      status: 503,
      code: "MISSING_API_KEY",
      detail: "MERIDIAN_API_KEY required to update care tasks.",
    });
  }

  const { records } = await sdk.listRecords(MERIDIAN_OBJECTS.careTask, {
    limit: 200,
  });
  const existingRow = (records as Record<string, unknown>[]).find(
    (row) => String(row.id) === taskId,
  );
  if (!existingRow) {
    throw new PlatformSDKError({
      status: 404,
      code: "NOT_FOUND",
      detail: `Care Task ${taskId} was not found in Meridian.`,
    });
  }
  const existing = normalizeTask(existingRow);

  const nextPatient = patch.patient ?? existing.patientRef;
  const nextCarePlan =
    patch.carePlan === null
      ? undefined
      : patch.carePlan !== undefined
        ? patch.carePlan
        : existing.carePlanRef;

  if (!nextPatient) {
    throw new PlatformSDKError({
      status: 422,
      code: "PATIENT_REQUIRED",
      detail: "Care Task updates require a resolvable Patient reference.",
    });
  }

  const nextAssignee =
    patch.assignedCaregiver !== undefined
      ? patch.assignedCaregiver || undefined
      : existing.assigneeRef;

  const patientOrPlanChanging =
    patch.patient !== undefined || patch.carePlan !== undefined;
  const assigneeChanging = patch.assignedCaregiver !== undefined;
  const resultingRefsChanging =
    patientOrPlanChanging || assigneeChanging || !!nextCarePlan || !!nextAssignee;

  let writePatient = nextPatient;
  let writeCarePlan = nextCarePlan;
  let writeAssignee = nextAssignee;

  if (resultingRefsChanging) {
    // Revalidate the complete resulting Patient + Care Plan + Caregiver state.
    const consistency = await assertTaskPatientMatchesCarePlan({
      patientRef: nextPatient,
      carePlanRef: nextCarePlan,
      sdk,
    });
    writePatient = canonicalPatientWriteRef(consistency.patient);
    writeCarePlan = consistency.carePlan
      ? canonicalCarePlanWriteRef(consistency.carePlan)
      : undefined;

    const assignment = await assertCaregiverAuthorizedForPatient({
      patientRef: nextPatient,
      caregiverRef: nextAssignee,
      sdk,
    });
    writeAssignee = assignment.caregiver
      ? canonicalCaregiverWriteRef(assignment.caregiver)
      : undefined;
  }

  const values: Record<string, unknown> = {};
  if (patch.status !== undefined) {
    values.status = patch.status;
    if (/complete/i.test(patch.status)) {
      values.completedOn = new Date().toISOString().slice(0, 10);
    }
  }
  if (patch.description !== undefined) values.description = patch.description;
  if (patch.priority !== undefined) values.priority = patch.priority;
  if (patch.dueDate !== undefined) values.dueDate = patch.dueDate;
  if (patch.escalated !== undefined) values.escalated = patch.escalated;
  if (patientOrPlanChanging || assigneeChanging) {
    values.patient = writePatient;
    if (writeCarePlan) values.carePlan = writeCarePlan;
    if (patch.carePlan === null) values.carePlan = "";
    if (writeAssignee) values.assignedCaregiver = writeAssignee;
    if (patch.assignedCaregiver === "") values.assignedCaregiver = "";
  }

  if (Object.keys(values).length === 0) {
    return existing;
  }

  const updated = await sdk.updateRecord(
    MERIDIAN_OBJECTS.careTask,
    taskId,
    values,
    "CareCircle: update care task after patient/care-plan check",
  );
  const updatedTask = normalizeTask(updated as Record<string, unknown>);

  const { records: again } = await sdk.listRecords(MERIDIAN_OBJECTS.careTask, {
    limit: 200,
  });
  const saved =
    (again as Record<string, unknown>[]).find(
      (row) => String(row.id) === taskId,
    ) ?? null;
  if (!saved) {
    throw new PlatformSDKError({
      status: 502,
      code: "READBACK_FAILED",
      detail:
        "Care Task update appeared to succeed but the record could not be read back from Meridian.",
    });
  }

  // Final verification of persisted combination when a plan is present.
  const persisted = normalizeTask(saved);
  if (persisted.carePlanRef) {
    await assertTaskPatientMatchesCarePlan({
      patientRef: persisted.patientRef || writePatient,
      carePlanRef: persisted.carePlanRef,
      sdk,
    });
  }

  return persisted;
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

function requireMeridianSdk() {
  const sdk = createPlatformSDKFromEnv();
  if (!sdk) {
    throw new PlatformSDKError({
      status: 503,
      code: "MISSING_API_KEY",
      detail: "MERIDIAN_API_KEY required.",
    });
  }
  return sdk;
}

async function readBack(
  objectName: string,
  id: string,
): Promise<Record<string, unknown>> {
  const sdk = requireMeridianSdk();
  const { records } = await sdk.listRecords(objectName, { limit: 200 });
  const saved = (records as Record<string, unknown>[]).find(
    (row) => String(row.id) === id,
  );
  if (!saved) {
    throw new PlatformSDKError({
      status: 502,
      code: "READBACK_FAILED",
      detail: `${objectName} write succeeded but read-back failed.`,
    });
  }
  return saved;
}

async function assertEligibleCoordinator(
  sdk: PlatformSDK,
  coordinatorRef: string,
) {
  const { records } = await sdk.listRecords(MERIDIAN_OBJECTS.caregiver, {
    limit: 200,
  });
  const match = (records as Record<string, unknown>[]).find((row) => {
    const f = flattenRecord(row);
    const id = recordEnvelopeId(row);
    const bid = pickString(f, ["caregiverId"]);
    return coordinatorRef === id || coordinatorRef === bid;
  });
  if (!match) {
    throw new PlatformSDKError({
      status: 422,
      code: "COORDINATOR_NOT_FOUND",
      detail: "Assigned Coordinator was not found in Meridian.",
    });
  }
  const f = flattenRecord(match);
  const type = pickString(f, ["caregiverType"]) || "";
  const status = pickString(f, ["status"]) || "";
  if (!/care coordinator/i.test(type) || !isActiveStatus(status)) {
    throw new PlatformSDKError({
      status: 422,
      code: "COORDINATOR_INELIGIBLE",
      detail:
        "Assigned Coordinator must be an Active Caregiver with type Care Coordinator.",
    });
  }
  const bid = pickString(f, ["caregiverId"]);
  return bid || recordEnvelopeId(match);
}

export async function createCarePlanRecord(values: {
  patient: string;
  recoveryGoals: string;
  status?: string;
  startDate?: string;
  reviewDate?: string;
  dischargeDate?: string;
  assignedCoordinator?: string;
}) {
  const sdk = requireMeridianSdk();
  if (!values.patient?.trim()) {
    throw new PlatformSDKError({
      status: 422,
      code: "PATIENT_REQUIRED",
      detail: "Patient is required.",
    });
  }
  if (!values.recoveryGoals?.trim()) {
    throw new PlatformSDKError({
      status: 422,
      code: "RECOVERY_GOALS_REQUIRED",
      detail: "Recovery Goals are required.",
    });
  }
  if (!values.assignedCoordinator?.trim()) {
    throw new PlatformSDKError({
      status: 422,
      code: "COORDINATOR_REQUIRED",
      detail: "Assigned Coordinator is required.",
    });
  }
  if (!values.startDate?.trim()) {
    throw new PlatformSDKError({
      status: 422,
      code: "START_DATE_REQUIRED",
      detail: "Start Date is required.",
    });
  }
  if (!values.status?.trim()) {
    throw new PlatformSDKError({
      status: 422,
      code: "STATUS_REQUIRED",
      detail: "Status is required.",
    });
  }
  if (
    values.startDate &&
    values.reviewDate &&
    values.reviewDate < values.startDate
  ) {
    throw new PlatformSDKError({
      status: 422,
      code: "REVIEW_BEFORE_START",
      detail: "Review Date cannot be earlier than Start Date.",
    });
  }

  const coordinatorRef = await assertEligibleCoordinator(
    sdk,
    values.assignedCoordinator,
  );

  const created = await sdk.createRecord(
    MERIDIAN_OBJECTS.carePlan,
    {
      patient: values.patient,
      recoveryGoals: values.recoveryGoals,
      status: values.status,
      startDate: values.startDate,
      reviewDate: values.reviewDate,
      dischargeDate: values.dischargeDate,
      assignedCoordinator: coordinatorRef,
    },
    "CareCircle: create care plan",
  );
  const id = recordEnvelopeId(created as Record<string, unknown>);
  return normalizeCarePlan(await readBack(MERIDIAN_OBJECTS.carePlan, id));
}

export async function updateCarePlanRecord(
  id: string,
  patch: {
    recoveryGoals?: string;
    status?: string;
    startDate?: string;
    reviewDate?: string;
    dischargeDate?: string;
    assignedCoordinator?: string;
    patient?: string;
  },
) {
  const sdk = requireMeridianSdk();
  const values: Record<string, unknown> = { ...patch };
  if (patch.assignedCoordinator) {
    values.assignedCoordinator = await assertEligibleCoordinator(
      sdk,
      patch.assignedCoordinator,
    );
  }
  // Never send auto business id
  delete (values as { carePlanId?: unknown }).carePlanId;
  await sdk.updateRecord(
    MERIDIAN_OBJECTS.carePlan,
    id,
    values,
    "CareCircle: update care plan",
  );
  return normalizeCarePlan(await readBack(MERIDIAN_OBJECTS.carePlan, id));
}

export async function createAppointmentRecord(values: {
  patient: string;
  appointmentDateTime: string;
  appointmentType?: string;
  provider?: string;
  location?: string;
  status?: string;
  notes?: string;
}) {
  const sdk = requireMeridianSdk();
  if (!values.appointmentDateTime?.trim()) {
    throw new PlatformSDKError({
      status: 422,
      code: "APPOINTMENT_DATETIME_REQUIRED",
      detail: "Appointment Date & Time is required.",
    });
  }
  if (/cancel/i.test(values.status || "") && !values.notes?.trim()) {
    throw new PlatformSDKError({
      status: 422,
      code: "NOTES_REQUIRED_WHEN_CANCELLED",
      detail: "Notes are required when Status is Cancelled.",
    });
  }
  const created = await sdk.createRecord(
    MERIDIAN_OBJECTS.appointment,
    {
      patient: values.patient,
      appointmentDateTime: values.appointmentDateTime,
      appointmentType: values.appointmentType,
      provider: values.provider,
      location: values.location,
      status: values.status || "Scheduled",
      notes: values.notes,
    },
    "CareCircle: create appointment",
  );
  const id = recordEnvelopeId(created as Record<string, unknown>);
  return normalizeAppointment(
    await readBack(MERIDIAN_OBJECTS.appointment, id),
  );
}

export async function updateAppointmentRecord(
  id: string,
  patch: {
    status?: string;
    notes?: string;
    appointmentDateTime?: string;
    location?: string;
  },
) {
  const sdk = requireMeridianSdk();
  const { records } = await sdk.listRecords(MERIDIAN_OBJECTS.appointment, {
    limit: 200,
  });
  const existing = (records as Record<string, unknown>[]).find(
    (row) => String(row.id) === id,
  );
  if (!existing) {
    throw new PlatformSDKError({
      status: 404,
      code: "NOT_FOUND",
      detail: `Appointment ${id} not found.`,
    });
  }
  const current = normalizeAppointment(existing);
  const nextStatus = patch.status ?? current.status;
  const nextNotes = patch.notes ?? current.notes;
  if (/cancel/i.test(nextStatus) && !nextNotes?.trim()) {
    throw new PlatformSDKError({
      status: 422,
      code: "NOTES_REQUIRED_WHEN_CANCELLED",
      detail: "Notes are required when Status is Cancelled.",
    });
  }
  await sdk.updateRecord(
    MERIDIAN_OBJECTS.appointment,
    id,
    patch,
    "CareCircle: update appointment",
  );
  return normalizeAppointment(await readBack(MERIDIAN_OBJECTS.appointment, id));
}

export async function createMedicationRecord(values: {
  patient: string;
  medicationName: string;
  instructions?: string;
  frequency?: string;
  refillDate?: string;
  status?: string;
}) {
  const sdk = requireMeridianSdk();
  if (!values.patient?.trim()) {
    throw new PlatformSDKError({
      status: 422,
      code: "PATIENT_REQUIRED",
      detail: "Patient is required.",
    });
  }
  if (!values.medicationName?.trim()) {
    throw new PlatformSDKError({
      status: 422,
      code: "MEDICATION_NAME_REQUIRED",
      detail: "Medication name is required.",
    });
  }
  if (!values.status?.trim()) {
    throw new PlatformSDKError({
      status: 422,
      code: "STATUS_REQUIRED",
      detail: "Status is required.",
    });
  }
  const created = await sdk.createRecord(
    MERIDIAN_OBJECTS.medication,
    {
      patient: values.patient,
      medicationName: values.medicationName,
      instructions: values.instructions,
      frequency: values.frequency,
      refillDate: values.refillDate,
      status: values.status,
    },
    "CareCircle: create medication",
  );
  const id = recordEnvelopeId(created as Record<string, unknown>);
  return normalizeMedication(
    await readBack(MERIDIAN_OBJECTS.medication, id),
  );
}

export async function updateMedicationRecord(
  id: string,
  patch: {
    medicationName?: string;
    instructions?: string;
    frequency?: string;
    refillDate?: string;
    status?: string;
    patient?: string;
  },
) {
  const sdk = requireMeridianSdk();
  const values: Record<string, unknown> = { ...patch };
  delete (values as { medicationId?: unknown }).medicationId;
  await sdk.updateRecord(
    MERIDIAN_OBJECTS.medication,
    id,
    values,
    "CareCircle: update medication",
  );
  return normalizeMedication(await readBack(MERIDIAN_OBJECTS.medication, id));
}

export async function createMembershipRecord(values: {
  patient: string;
  caregiver: string;
  relationshipType?: string;
  membershipStatus?: string;
  startDate?: string;
  endDate?: string;
}) {
  const sdk = requireMeridianSdk();
  if (
    values.startDate &&
    values.endDate &&
    values.endDate < values.startDate
  ) {
    throw new PlatformSDKError({
      status: 422,
      code: "END_BEFORE_START",
      detail: "End Date must be on or after Start Date.",
    });
  }

  // Meridian accepts only Active | Inactive (no Pending).
  const status = values.membershipStatus || "Inactive";
  if (isActiveStatus(status)) {
    const { records } = await sdk.listRecords(
      MERIDIAN_OBJECTS.careCircleMembership,
      { limit: 200 },
    );
    const duplicate = (records as Record<string, unknown>[]).some((row) => {
      const f = flattenRecord(row);
      const st = pickString(f, ["membershipStatus", "status"]) || "";
      return (
        isActiveStatus(st) &&
        (pickString(f, ["patient"]) === values.patient ||
          pickString(f, ["patient"])?.toLowerCase() ===
            values.patient.toLowerCase()) &&
        (pickString(f, ["caregiver"]) === values.caregiver ||
          pickString(f, ["caregiver"])?.toLowerCase() ===
            values.caregiver.toLowerCase())
      );
    });
    if (duplicate) {
      throw new PlatformSDKError({
        status: 422,
        code: "DUPLICATE_ACTIVE_MEMBERSHIP",
        detail:
          "Only one Active membership per Patient/Caregiver pair is allowed.",
      });
    }
  }

  const created = await sdk.createRecord(
    MERIDIAN_OBJECTS.careCircleMembership,
    {
      patient: values.patient,
      caregiver: values.caregiver,
      relationshipType: values.relationshipType || "Family Member",
      membershipStatus: status,
      startDate: values.startDate,
      endDate: values.endDate,
    },
    "CareCircle: create care circle membership",
  );
  const id = recordEnvelopeId(created as Record<string, unknown>);
  return normalizeMembership(
    await readBack(MERIDIAN_OBJECTS.careCircleMembership, id),
  );
}

function refsMatch(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  return a === b || a.toLowerCase() === b.toLowerCase();
}

/** All memberships for a patient/caregiver pair (any status). */
export async function listMembershipsForPair(input: {
  patientRef: string;
  caregiverRef: string;
}) {
  const sdk = requireMeridianSdk();
  const { records } = await sdk.listRecords(
    MERIDIAN_OBJECTS.careCircleMembership,
    { limit: 200 },
  );
  return (records as Record<string, unknown>[])
    .map(normalizeMembership)
    .filter(
      (m) =>
        refsMatch(m.patientRef, input.patientRef) &&
        refsMatch(m.caregiverRef, input.caregiverRef),
    );
}

/** Find an existing membership for a patient/caregiver pair (prefer Active). */
export async function findMembershipForPair(input: {
  patientRef: string;
  caregiverRef: string;
}) {
  const matches = await listMembershipsForPair(input);
  if (matches.length === 0) return null;
  return matches.find((m) => isActiveStatus(m.status)) || matches[0];
}

export async function updateMembershipStatus(
  membershipId: string,
  membershipStatus: "Active" | "Inactive",
  options?: { exclusiveActive?: boolean },
) {
  const sdk = requireMeridianSdk();
  const current = await readBack(
    MERIDIAN_OBJECTS.careCircleMembership,
    membershipId,
  );
  const flat = flattenRecord(current);
  const patient = pickString(flat, ["patient"]);
  const caregiver = pickString(flat, ["caregiver"]);

  if (membershipStatus === "Active" && patient && caregiver) {
    const siblings = await listMembershipsForPair({
      patientRef: patient,
      caregiverRef: caregiver,
    });
    const otherActive = siblings.filter(
      (m) => m.id !== membershipId && isActiveStatus(m.status),
    );

    if (otherActive.length > 0 && !options?.exclusiveActive) {
      throw new PlatformSDKError({
        status: 422,
        code: "DUPLICATE_ACTIVE_MEMBERSHIP",
        detail: `This pair already has Active membership ${otherActive[0].businessId || otherActive[0].id}. Deactivate it first, or use exclusive activation.`,
      });
    }

    // Admin exclusive activate: deactivate other Active rows for the same pair.
    if (options?.exclusiveActive) {
      for (const other of otherActive) {
        await sdk.updateRecord(
          MERIDIAN_OBJECTS.careCircleMembership,
          other.id,
          { membershipStatus: "Inactive" },
          `CareCircle Admin: deactivate duplicate Active before activating ${membershipId}`,
        );
      }
    }
  }

  await sdk.updateRecord(
    MERIDIAN_OBJECTS.careCircleMembership,
    membershipId,
    { membershipStatus },
    `CareCircle: set membership ${membershipStatus}`,
  );
  return normalizeMembership(
    await readBack(MERIDIAN_OBJECTS.careCircleMembership, membershipId),
  );
}

/**
 * Admin helper: make exactly one Active membership for a patient/caregiver pair.
 * Creates an Inactive row first when none exist, then activates exclusively.
 */
export async function improveMembership(input: {
  membershipId?: string;
  patientRef?: string;
  caregiverRef?: string;
  relationshipType?: string;
  membershipStatus?: "Active" | "Inactive";
}) {
  const targetStatus = input.membershipStatus || "Active";

  let membership: Membership | null = null;
  if (input.membershipId) {
    membership = normalizeMembership(
      await readBack(MERIDIAN_OBJECTS.careCircleMembership, input.membershipId),
    );
  } else if (input.patientRef && input.caregiverRef) {
    membership = await findMembershipForPair({
      patientRef: input.patientRef,
      caregiverRef: input.caregiverRef,
    });
    if (!membership) {
      membership = await createMembershipRecord({
        patient: input.patientRef,
        caregiver: input.caregiverRef,
        relationshipType: input.relationshipType || "Family Member",
        membershipStatus: "Inactive",
        startDate: new Date().toISOString().slice(0, 10),
      });
    }
  } else {
    throw new PlatformSDKError({
      status: 400,
      code: "MEMBERSHIP_INPUT_REQUIRED",
      detail: "Provide membershipId or patientRef + caregiverRef.",
    });
  }

  if (input.relationshipType && input.relationshipType !== membership.relationshipType) {
    const sdk = requireMeridianSdk();
    await sdk.updateRecord(
      MERIDIAN_OBJECTS.careCircleMembership,
      membership.id,
      { relationshipType: input.relationshipType },
      "CareCircle Admin: update membership relationship",
    );
    membership = normalizeMembership(
      await readBack(MERIDIAN_OBJECTS.careCircleMembership, membership.id),
    );
  }

  if (isActiveStatus(targetStatus)) {
    membership = await updateMembershipStatus(membership.id, "Active", {
      exclusiveActive: true,
    });
  } else {
    membership = await updateMembershipStatus(membership.id, "Inactive");
  }

  return membership;
}

export type CareJourneyEvent = {
  id: string;
  date: string;
  title: string;
  description: string;
  status: string;
  caregiver?: string;
  href?: string;
  kind: "carePlan" | "appointment" | "careTask" | "notification";
};

export function buildCareJourney(
  snapshot: CareSnapshot,
  patientRef?: string,
): CareJourneyEvent[] {
  const events: CareJourneyEvent[] = [];
  const matchPatient = (ref?: string) => {
    if (!patientRef) return true;
    if (!ref) return false;
    return (
      ref === patientRef ||
      ref.toLowerCase() === patientRef.toLowerCase() ||
      snapshot.patients.some(
        (p) =>
          (p.businessId === patientRef || p.id === patientRef) &&
          (p.businessId === ref || p.id === ref),
      )
    );
  };

  for (const plan of snapshot.carePlans) {
    if (!matchPatient(plan.patientRef)) continue;
    events.push({
      id: `plan-${plan.id}`,
      date: plan.startDate || plan.reviewDate || "",
      title: `Care Plan ${plan.businessId || plan.id}`,
      description: plan.recoveryGoals || plan.status,
      status: plan.status,
      caregiver: plan.assignedCoordinator,
      href: "/care-plans",
      kind: "carePlan",
    });
  }
  for (const appt of snapshot.appointments) {
    if (!matchPatient(appt.patientRef)) continue;
    events.push({
      id: `appt-${appt.id}`,
      date: appt.dateTime || "",
      title: appt.type || "Appointment",
      description: [appt.provider, appt.location].filter(Boolean).join(" · "),
      status: appt.status,
      href: "/appointments",
      kind: "appointment",
    });
  }
  for (const task of snapshot.tasks) {
    if (!matchPatient(task.patientRef)) continue;
    events.push({
      id: `task-${task.id}`,
      date: task.dueAt || task.completedOn || "",
      title: task.title,
      description: `Priority: ${task.priority || "—"}`,
      status: task.status,
      caregiver: resolveCaregiverLabel(snapshot.caregivers, task.assigneeRef),
      href: "/tasks",
      kind: "careTask",
    });
  }
  for (const note of snapshot.notifications) {
    if (!matchPatient(note.patientRef)) continue;
    events.push({
      id: `note-${note.id}`,
      date: note.createdAt || "",
      title: note.notificationType || "Notification",
      description: note.message,
      status: note.status,
      href: "/notifications",
      kind: "notification",
    });
  }

  return events
    .filter((e) => e.date)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}
