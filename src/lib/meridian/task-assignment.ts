import { MERIDIAN_OBJECTS } from "@/lib/meridian/objects";
import {
  flattenRecord,
  recordEnvelopeId,
} from "@/lib/meridian/records";
import {
  resolvePatientFromMeridian,
  TaskConsistencyError,
} from "@/lib/meridian/task-consistency";
import {
  createPlatformSDKFromEnv,
  PlatformSDK,
  PlatformSDKError,
} from "@/lib/sdk/platformSDK";
import { pickString } from "@/lib/utils";

export const CAREGIVER_NOT_AUTHORIZED = {
  code: "CAREGIVER_NOT_AUTHORIZED",
  status: 422,
  error: "The selected Caregiver is not authorized for this Patient.",
  errorEs: "El cuidador seleccionado no está autorizado para este paciente.",
} as const;

export const CAREGIVER_INACTIVE = {
  code: "CAREGIVER_INACTIVE",
  status: 422,
  error: "Assigned Caregiver must be active.",
  errorEs: "El cuidador asignado debe estar activo.",
} as const;

function requireSdk(sdk?: PlatformSDK | null) {
  const client = sdk ?? createPlatformSDKFromEnv();
  if (!client) {
    throw new PlatformSDKError({
      status: 503,
      code: "MISSING_API_KEY",
      detail: "MERIDIAN_API_KEY required for caregiver assignment checks.",
    });
  }
  return client;
}

function aliases(...values: Array<string | undefined | null>) {
  const set = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    const t = String(value).trim();
    if (!t) continue;
    set.add(t);
    set.add(t.toLowerCase());
  }
  return set;
}

function matches(set: Set<string>, ref: string) {
  const t = ref.trim();
  return set.has(t) || set.has(t.toLowerCase());
}

export type ResolvedCaregiver = {
  envelopeId: string;
  businessId?: string;
  status?: string;
  caregiverType?: string;
  aliases: Set<string>;
};

export async function resolveCaregiverFromMeridian(
  caregiverRef: string,
  sdk?: PlatformSDK | null,
): Promise<ResolvedCaregiver | null> {
  const client = requireSdk(sdk);
  const { records } = await client.listRecords(MERIDIAN_OBJECTS.caregiver, {
    limit: 200,
  });
  for (const row of records as Record<string, unknown>[]) {
    const flat = flattenRecord(row);
    const envelopeId = recordEnvelopeId(row);
    const businessId = pickString(flat, ["caregiverId"]);
    const set = aliases(envelopeId, businessId);
    if (matches(set, caregiverRef)) {
      return {
        envelopeId,
        businessId,
        status: pickString(flat, ["status"]),
        caregiverType: pickString(flat, ["caregiverType"]),
        aliases: set,
      };
    }
  }
  return null;
}

function membershipActive(status: string, startDate?: string, endDate?: string) {
  if (!/active/i.test(status)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (startDate) {
    const start = new Date(startDate);
    if (!Number.isNaN(start.getTime()) && start > today) return false;
  }
  if (endDate) {
    const end = new Date(endDate);
    if (!Number.isNaN(end.getTime()) && end < today) return false;
  }
  return true;
}

/**
 * CareCircle server check: assigned caregiver must be Active and have an
 * Active careCircleMembership for the task patient. Not Meridian-global.
 */
export async function assertCaregiverAuthorizedForPatient(input: {
  patientRef: string;
  caregiverRef?: string | null;
  sdk?: PlatformSDK | null;
}) {
  const caregiverRef = input.caregiverRef?.trim();
  if (!caregiverRef) {
    return { caregiver: null as ResolvedCaregiver | null, membership: null };
  }

  const client = requireSdk(input.sdk);
  const [patient, caregiver] = await Promise.all([
    resolvePatientFromMeridian(input.patientRef, client),
    resolveCaregiverFromMeridian(caregiverRef, client),
  ]);

  if (!patient) {
    throw new TaskConsistencyError({
      status: 422,
      code: "PATIENT_NOT_FOUND",
      error:
        "The selected Patient could not be found in Meridian, so the Care Task write was blocked.",
      errorEs:
        "No se encontró el paciente seleccionado en Meridian, por lo que se bloqueó la operación de la tarea.",
    });
  }

  if (!caregiver) {
    throw new TaskConsistencyError({
      status: 422,
      code: "CAREGIVER_NOT_FOUND",
      error:
        "The selected Caregiver could not be found in Meridian, so the Care Task write was blocked.",
      errorEs:
        "No se encontró el cuidador seleccionado en Meridian, por lo que se bloqueó la operación de la tarea.",
    });
  }

  if (!/active/i.test(caregiver.status || "")) {
    throw new TaskConsistencyError(CAREGIVER_INACTIVE);
  }

  const { records } = await client.listRecords(
    MERIDIAN_OBJECTS.careCircleMembership,
    { limit: 200 },
  );

  const patientAliases = aliases(patient.envelopeId, patient.businessId);
  const caregiverAliases = caregiver.aliases;

  for (const row of records as Record<string, unknown>[]) {
    const flat = flattenRecord(row);
    const patientField = pickString(flat, ["patient"]);
    const caregiverField = pickString(flat, ["caregiver"]);
    const status =
      pickString(flat, ["membershipStatus", "status"]) || "Unknown";
    const startDate = pickString(flat, ["startDate"]);
    const endDate = pickString(flat, ["endDate"]);
    if (!patientField || !caregiverField) continue;
    if (!matches(patientAliases, patientField)) continue;
    if (!matches(caregiverAliases, caregiverField)) continue;
    if (!membershipActive(status, startDate, endDate)) continue;
    return {
      caregiver,
      membership: {
        id: recordEnvelopeId(row),
        businessId: pickString(flat, ["membershipId"]),
        status,
      },
    };
  }

  throw new TaskConsistencyError(CAREGIVER_NOT_AUTHORIZED);
}

export function canonicalCaregiverWriteRef(caregiver: ResolvedCaregiver) {
  return caregiver.businessId || caregiver.envelopeId;
}
