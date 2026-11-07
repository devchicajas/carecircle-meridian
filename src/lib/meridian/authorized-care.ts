/**
 * Server-side authorized care data access for CareCircle accounts.
 * Never return tenant-wide records to Patient / Family Caregiver sessions.
 */
import type { AppSessionUser } from "@/lib/auth";
import {
  type Appointment,
  type CarePlan,
  type CareSnapshot,
  type CareTask,
  type Caregiver,
  type Medication,
  type Membership,
  type NotificationItem,
  type Patient,
  loadCareSnapshot,
  lovedOnesForCaregiver,
} from "@/lib/meridian/care-data";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";
import { isActiveStatus } from "@/lib/utils";

export type CareAccount =
  | Pick<
      AppSessionUser,
      | "id"
      | "accountType"
      | "meridianPatientId"
      | "meridianPatientBusinessId"
      | "meridianCaregiverId"
      | "meridianCaregiverBusinessId"
    >
  | null
  | undefined;

export type AuthorizedCareView = {
  source: CareSnapshot["source"];
  connected: boolean;
  loadingError?: string;
  authError?: CareSnapshot["authError"];
  warnings: string[];
  scope: "anonymous" | "patient" | "family_caregiver";
  /** Patients the viewer may see */
  patients: Patient[];
  caregivers: Caregiver[];
  memberships: Membership[];
  carePlans: CarePlan[];
  appointments: Appointment[];
  medications: Medication[];
  tasks: CareTask[];
  notifications: NotificationItem[];
  metrics: CareSnapshot["metrics"];
  /** Alias strings used for patient matching (envelope id + business id) */
  patientAliases: string[];
  patientObject: string;
  taskObject: string;
  rawSnapshot: CareSnapshot;
};

function aliasesForPatient(patient: Patient): string[] {
  return [patient.id, patient.businessId].filter(Boolean) as string[];
}

export function patientRefMatches(
  aliases: Set<string>,
  ref?: string | null,
): boolean {
  if (!ref) return false;
  if (aliases.has(ref)) return true;
  const lower = ref.toLowerCase();
  for (const a of aliases) {
    if (a.toLowerCase() === lower) return true;
  }
  return false;
}

function buildAliasSet(patients: Patient[]): Set<string> {
  const set = new Set<string>();
  for (const p of patients) {
    for (const a of aliasesForPatient(p)) set.add(a);
  }
  return set;
}

function computeScopedMetrics(input: {
  patients: Patient[];
  carePlans: CarePlan[];
  appointments: Appointment[];
  tasks: CareTask[];
  notifications: NotificationItem[];
  medications: Medication[];
}): CareSnapshot["metrics"] {
  const pendingTasks = input.tasks.filter((t) =>
    /pending|in progress|open/i.test(t.status),
  ).length;
  const overdueTasks = input.tasks.filter((t) => {
    if (/overdue/i.test(t.status)) return true;
    if (!t.dueAt || /complete|cancel/i.test(t.status)) return false;
    const due = new Date(t.dueAt);
    if (Number.isNaN(due.getTime())) return false;
    const end = new Date(due);
    end.setHours(23, 59, 59, 999);
    return end.getTime() < Date.now();
  }).length;
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
    openTasks: input.tasks.filter((t) => !/complete|cancel/i.test(t.status))
      .length,
    completedTasks: input.tasks.filter((t) => /complete/i.test(t.status))
      .length,
    needsAttention: overdueTasks,
    activePatients: input.patients.filter((p) =>
      /active|recovery|chronic|routine/i.test(p.status),
    ).length,
    medications: input.medications.length,
  };
}

function filterByPatients<T extends { patientRef?: string }>(
  rows: T[],
  aliases: Set<string>,
): T[] {
  if (aliases.size === 0) return [];
  return rows.filter((row) => patientRefMatches(aliases, row.patientRef));
}

/**
 * Load Meridian snapshot and clamp it to the signed-in account's authorized
 * Patient / loved-one scope. Anonymous callers get an empty authorized view
 * (never the full tenant dump).
 */
export async function loadAuthorizedCareView(
  account: CareAccount,
): Promise<AuthorizedCareView> {
  const raw = await loadCareSnapshot();

  const base = {
    source: raw.source,
    connected: raw.connected,
    loadingError: raw.loadingError,
    authError: raw.authError,
    warnings: raw.warnings,
    patientObject: raw.patientObject,
    taskObject: raw.taskObject,
    rawSnapshot: raw,
  };

  if (!account) {
    const empty = {
      patients: [] as Patient[],
      caregivers: [] as Caregiver[],
      memberships: [] as Membership[],
      carePlans: [] as CarePlan[],
      appointments: [] as Appointment[],
      medications: [] as Medication[],
      tasks: [] as CareTask[],
      notifications: [] as NotificationItem[],
    };
    return {
      ...base,
      scope: "anonymous",
      ...empty,
      patientAliases: [],
      metrics: computeScopedMetrics(empty),
    };
  }

  if (account.accountType === "patient") {
    const linked = raw.patients.find(
      (p) =>
        p.id === account.meridianPatientId ||
        p.businessId === account.meridianPatientBusinessId ||
        p.id === account.meridianPatientBusinessId ||
        p.businessId === account.meridianPatientId,
    );
    const patients = linked ? [linked] : [];
    const aliases = buildAliasSet(patients);
    const memberships = raw.memberships.filter((m) =>
      patientRefMatches(aliases, m.patientRef),
    );
    const caregiverRefs = new Set(
      memberships.map((m) => m.caregiverRef).filter(Boolean) as string[],
    );
    const caregivers = raw.caregivers.filter(
      (c) =>
        caregiverRefs.has(c.id) ||
        caregiverRefs.has(c.businessId || "") ||
        [...caregiverRefs].some(
          (ref) => ref.toLowerCase() === c.name.toLowerCase(),
        ),
    );
    const scoped = {
      patients,
      caregivers,
      memberships,
      carePlans: filterByPatients(raw.carePlans, aliases),
      appointments: filterByPatients(raw.appointments, aliases),
      medications: filterByPatients(raw.medications, aliases),
      tasks: filterByPatients(raw.tasks, aliases),
      notifications: filterByPatients(raw.notifications, aliases),
    };
    return {
      ...base,
      scope: "patient",
      ...scoped,
      patientAliases: [...aliases],
      metrics: computeScopedMetrics(scoped),
    };
  }

  // Family caregiver — Active memberships only for loved-one visibility.
  const patients = lovedOnesForCaregiver(raw, [
    account.meridianCaregiverId,
    account.meridianCaregiverBusinessId,
  ]);
  const aliases = buildAliasSet(patients);

  const cg = raw.caregivers.find(
    (c) =>
      c.id === account.meridianCaregiverId ||
      c.businessId === account.meridianCaregiverBusinessId,
  );
  const cgAliases = new Set(
    [
      account.meridianCaregiverId,
      account.meridianCaregiverBusinessId,
      cg?.id,
      cg?.businessId,
      cg?.name,
    ].filter(Boolean) as string[],
  );

  const memberships = raw.memberships.filter(
    (m) =>
      m.caregiverRef &&
      (cgAliases.has(m.caregiverRef) ||
        [...cgAliases].some(
          (a) => a.toLowerCase() === m.caregiverRef!.toLowerCase(),
        )),
  );

  const caregivers = cg
    ? [
        cg,
        ...raw.caregivers.filter(
          (c) =>
            /care coordinator/i.test(c.role || "") &&
            isActiveStatus(c.status) &&
            c.id !== cg.id,
        ),
      ]
    : raw.caregivers.filter(
        (c) =>
          /care coordinator/i.test(c.role || "") && isActiveStatus(c.status),
      );

  const scoped = {
    patients,
    caregivers,
    memberships,
    carePlans: filterByPatients(raw.carePlans, aliases),
    appointments: filterByPatients(raw.appointments, aliases),
    medications: filterByPatients(raw.medications, aliases),
    tasks: filterByPatients(raw.tasks, aliases),
    notifications: filterByPatients(raw.notifications, aliases),
  };

  return {
    ...base,
    scope: "family_caregiver",
    ...scoped,
    patientAliases: [...aliases],
    metrics: computeScopedMetrics(scoped),
  };
}

/** Throw 403 if the account cannot access this patient reference. */
export async function assertAuthorizedPatientAccess(
  account: CareAccount,
  patientRef: string,
) {
  if (!account) {
    throw new PlatformSDKError({
      status: 401,
      code: "UNAUTHENTICATED",
      detail: "Authentication required.",
    });
  }
  const view = await loadAuthorizedCareView(account);
  const aliases = new Set(view.patientAliases);
  // Also allow if ref matches one of the authorized patients directly
  const ok =
    patientRefMatches(aliases, patientRef) ||
    view.patients.some(
      (p) => p.id === patientRef || p.businessId === patientRef,
    );
  if (!ok) {
    throw new PlatformSDKError({
      status: 403,
      code: "PATIENT_ACCESS_DENIED",
      detail: "You are not authorized to access this patient record.",
    });
  }
  return view;
}

export function activeCareCoordinators(view: AuthorizedCareView): Caregiver[] {
  const pool =
    view.scope === "family_caregiver"
      ? view.rawSnapshot.caregivers
      : view.caregivers;
  return pool.filter(
    (c) =>
      /care coordinator/i.test(c.role || "") && isActiveStatus(c.status),
  );
}
