import { MERIDIAN_OBJECTS } from "@/lib/meridian/objects";
import {
  flattenRecord,
  recordEnvelopeId,
} from "@/lib/meridian/records";
import {
  createPlatformSDKFromEnv,
  PlatformSDK,
  PlatformSDKError,
} from "@/lib/sdk/platformSDK";
import { pickString } from "@/lib/utils";

export const PATIENT_CAREPLAN_MISMATCH = {
  code: "PATIENT_CAREPLAN_MISMATCH",
  status: 422,
  error: "The selected Care Plan belongs to a different Patient.",
  errorEs: "El plan de cuidados seleccionado pertenece a otro paciente.",
} as const;

export const PATIENT_CAREPLAN_UNVERIFIABLE = {
  code: "PATIENT_CAREPLAN_UNVERIFIABLE",
  status: 422,
  error:
    "CareCircle cannot verify that this Care Plan belongs to the selected Patient from Meridian data, so the write was blocked.",
  errorEs:
    "CareCircle no puede verificar en Meridian que este plan de cuidados pertenece al paciente seleccionado, por lo que se bloqueó la operación.",
} as const;

export class TaskConsistencyError extends Error {
  status: number;
  code: string;
  error: string;
  errorEs: string;

  constructor(input: {
    status: number;
    code: string;
    error: string;
    errorEs: string;
  }) {
    super(input.error);
    this.name = "TaskConsistencyError";
    this.status = input.status;
    this.code = input.code;
    this.error = input.error;
    this.errorEs = input.errorEs;
  }
}

export type ResolvedPatient = {
  envelopeId: string;
  businessId?: string;
  aliases: Set<string>;
};

export type ResolvedCarePlan = {
  envelopeId: string;
  businessId?: string;
  patientRef?: string;
  aliases: Set<string>;
};

function requireSdk(sdk?: PlatformSDK | null) {
  const client = sdk ?? createPlatformSDKFromEnv();
  if (!client) {
    throw new PlatformSDKError({
      status: 503,
      code: "MISSING_API_KEY",
      detail: "MERIDIAN_API_KEY required for Care Task consistency checks.",
    });
  }
  return client;
}

function aliasSet(...values: Array<string | undefined | null>) {
  const set = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    const trimmed = String(value).trim();
    if (!trimmed) continue;
    set.add(trimmed);
    set.add(trimmed.toLowerCase());
  }
  return set;
}

function matchesAlias(aliases: Set<string>, ref: string) {
  const trimmed = ref.trim();
  return aliases.has(trimmed) || aliases.has(trimmed.toLowerCase());
}

async function listEnvelopes(sdk: PlatformSDK, objectName: string) {
  const { records } = await sdk.listRecords(objectName, { limit: 200 });
  return records as Record<string, unknown>[];
}

export async function resolvePatientFromMeridian(
  patientRef: string,
  sdk?: PlatformSDK | null,
): Promise<ResolvedPatient | null> {
  const client = requireSdk(sdk);
  const rows = await listEnvelopes(client, MERIDIAN_OBJECTS.patient);
  for (const row of rows) {
    const flat = flattenRecord(row);
    const envelopeId = recordEnvelopeId(row);
    const businessId = pickString(flat, ["patientId"]);
    const aliases = aliasSet(
      envelopeId,
      businessId,
      pickString(flat, ["preferredName"]),
      [pickString(flat, ["firstName"]), pickString(flat, ["lastName"])]
        .filter(Boolean)
        .join(" "),
    );
    if (matchesAlias(aliases, patientRef)) {
      return { envelopeId, businessId, aliases };
    }
  }
  return null;
}

export async function resolveCarePlanFromMeridian(
  carePlanRef: string,
  sdk?: PlatformSDK | null,
): Promise<ResolvedCarePlan | null> {
  const client = requireSdk(sdk);
  const rows = await listEnvelopes(client, MERIDIAN_OBJECTS.carePlan);
  for (const row of rows) {
    const flat = flattenRecord(row);
    const envelopeId = recordEnvelopeId(row);
    const businessId = pickString(flat, ["carePlanId"]);
    const patientRef = pickString(flat, ["patient"]);
    const aliases = aliasSet(envelopeId, businessId);
    if (matchesAlias(aliases, carePlanRef)) {
      return { envelopeId, businessId, patientRef, aliases };
    }
  }
  return null;
}

/**
 * Compare Care Task patient vs Care Plan patient using Meridian-resolved
 * canonical identifiers (envelope UUID and/or business patientId).
 * Enforced only by CareCircle server routes — not by Meridian globally.
 */
export async function assertTaskPatientMatchesCarePlan(input: {
  patientRef: string;
  carePlanRef?: string | null;
  sdk?: PlatformSDK | null;
}) {
  const carePlanRef = input.carePlanRef?.trim();
  if (!carePlanRef) {
    // No care plan on the task → nothing to compare.
    const patient = await resolvePatientFromMeridian(input.patientRef, input.sdk);
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
    return {
      patient,
      carePlan: null as ResolvedCarePlan | null,
      planPatient: null as ResolvedPatient | null,
    };
  }

  const [patient, carePlan] = await Promise.all([
    resolvePatientFromMeridian(input.patientRef, input.sdk),
    resolveCarePlanFromMeridian(carePlanRef, input.sdk),
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

  if (!carePlan) {
    throw new TaskConsistencyError({
      status: 422,
      code: "CAREPLAN_NOT_FOUND",
      error:
        "The selected Care Plan could not be found in Meridian, so the Care Task write was blocked.",
      errorEs:
        "No se encontró el plan de cuidados seleccionado en Meridian, por lo que se bloqueó la operación de la tarea.",
    });
  }

  if (!carePlan.patientRef) {
    throw new TaskConsistencyError(PATIENT_CAREPLAN_UNVERIFIABLE);
  }

  const planPatient = await resolvePatientFromMeridian(
    carePlan.patientRef,
    input.sdk,
  );
  if (!planPatient) {
    throw new TaskConsistencyError(PATIENT_CAREPLAN_UNVERIFIABLE);
  }

  const sameEnvelope = patient.envelopeId === planPatient.envelopeId;
  const sameBusiness =
    !!patient.businessId &&
    !!planPatient.businessId &&
    patient.businessId === planPatient.businessId;

  if (!sameEnvelope && !sameBusiness) {
    throw new TaskConsistencyError(PATIENT_CAREPLAN_MISMATCH);
  }

  return { patient, carePlan, planPatient };
}

/** Prefer canonical Meridian business IDs on write when available. */
export function canonicalPatientWriteRef(patient: ResolvedPatient) {
  return patient.businessId || patient.envelopeId;
}

export function canonicalCarePlanWriteRef(carePlan: ResolvedCarePlan) {
  return carePlan.businessId || carePlan.envelopeId;
}
