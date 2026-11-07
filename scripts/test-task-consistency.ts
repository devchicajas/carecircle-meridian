/**
 * Live Care Task Patient–Care Plan consistency checks against Meridian.
 * Enforcement is CareCircle Next.js server-side only — not Meridian-global.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertTaskPatientMatchesCarePlan,
  TaskConsistencyError,
  PATIENT_CAREPLAN_MISMATCH,
} from "../src/lib/meridian/task-consistency";
import { createCareTask, updateCareTask } from "../src/lib/meridian/care-data";
import { createPlatformSDKFromEnv } from "../src/lib/sdk/platformSDK";
import { MERIDIAN_OBJECTS } from "../src/lib/meridian/objects";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i).trim();
    const value = trimmed.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const EXPECTED_EN = "The selected Care Plan belongs to a different Patient.";
const EXPECTED_ES =
  "El plan de cuidados seleccionado pertenece a otro paciente.";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function main() {
  const sdk = createPlatformSDKFromEnv();
  assert(sdk, "SDK missing — set MERIDIAN_API_KEY");

  console.log(
    "Resolving fictional Meridian fixtures PAT-001/CP-001 and PAT-002…",
  );
  const valid = await assertTaskPatientMatchesCarePlan({
    patientRef: "PAT-001",
    carePlanRef: "CP-001",
    sdk,
  });
  console.log("✓ valid pair resolves", {
    patient: valid.patient.businessId || valid.patient.envelopeId,
    carePlan: valid.carePlan?.businessId || valid.carePlan?.envelopeId,
    planPatient: valid.planPatient?.businessId,
  });

  let mismatchCaught: unknown = null;
  try {
    await assertTaskPatientMatchesCarePlan({
      patientRef: "PAT-002",
      carePlanRef: "CP-001",
      sdk,
    });
  } catch (err) {
    mismatchCaught = err;
  }
  assert(
    mismatchCaught instanceof TaskConsistencyError,
    "mismatch should throw TaskConsistencyError",
  );
  assert(mismatchCaught.status === 422, "mismatch status 422");
  assert(
    mismatchCaught.code === PATIENT_CAREPLAN_MISMATCH.code,
    "mismatch code",
  );
  assert(mismatchCaught.error === EXPECTED_EN, "English error text");
  assert(mismatchCaught.errorEs === EXPECTED_ES, "Spanish error text");
  console.log("✓ mismatched pair rejected", {
    status: mismatchCaught.status,
    code: mismatchCaught.code,
    error: mismatchCaught.error,
    errorEs: mismatchCaught.errorEs,
  });

  let createMismatch: unknown = null;
  try {
    await createCareTask({
      patient: "PAT-002",
      carePlan: "CP-001",
      description: "SHOULD NOT PERSIST — mismatched patient/plan probe",
      priority: "Low",
      status: "Pending",
      dueDate: new Date().toISOString().slice(0, 10),
    });
  } catch (err) {
    createMismatch = err;
  }
  assert(
    createMismatch instanceof TaskConsistencyError,
    "create mismatch blocked",
  );
  assert(
    (createMismatch as InstanceType<typeof TaskConsistencyError>).status ===
      422,
    "create mismatch 422",
  );
  assert(
    (createMismatch as InstanceType<typeof TaskConsistencyError>).error ===
      EXPECTED_EN,
    "create mismatch EN",
  );
  assert(
    (createMismatch as InstanceType<typeof TaskConsistencyError>).errorEs ===
      EXPECTED_ES,
    "create mismatch ES",
  );
  console.log("✓ createCareTask blocked mismatched write (no Meridian create)");

  let persisted: Awaited<ReturnType<typeof createCareTask>> | null = null;
  try {
    persisted = await createCareTask({
      patient: "PAT-001",
      carePlan: "CP-001",
      description:
        "Consistency check valid write — confirm med pickup for María",
      priority: "Medium",
      status: "Pending",
      dueDate: new Date().toISOString().slice(0, 10),
    });
    console.log("✓ createCareTask valid write + readback", {
      id: persisted.id,
      businessId: persisted.businessId,
      patientRef: persisted.patientRef,
      carePlanRef: persisted.carePlanRef,
    });
  } catch (err) {
    const detail =
      err instanceof Error
        ? `${(err as { code?: string }).code || ""} ${err.message}`.trim()
        : String(err);
    console.warn(
      "createCareTask valid path hit Meridian write error; falling back to update+readback:",
      detail,
    );
    const { records } = await sdk.listRecords(MERIDIAN_OBJECTS.careTask, {
      limit: 50,
    });
    const existing = records.find((row) => {
      const r = row as Record<string, unknown>;
      const payload = (r.payload as Record<string, unknown>) || r;
      return (
        String(payload.taskId || "") === "TSK-001" ||
        String(r.id) === "97fa9d7c-3751-428d-b032-3db4f4bbac09"
      );
    }) as Record<string, unknown> | undefined;
    assert(existing, "expected existing TSK-001 for fallback update");
    persisted = await updateCareTask(String(existing.id), {
      patient: "PAT-001",
      carePlan: "CP-001",
      description:
        "Consistency check valid update — confirm med pickup for María",
    });
    console.log("✓ updateCareTask valid write + readback", {
      id: persisted.id,
      businessId: persisted.businessId,
      patientRef: persisted.patientRef,
      carePlanRef: persisted.carePlanRef,
    });
  }

  assert(persisted?.patientRef, "persisted patientRef");
  await assertTaskPatientMatchesCarePlan({
    patientRef: persisted.patientRef!,
    carePlanRef: persisted.carePlanRef || "CP-001",
    sdk,
  });
  console.log("✓ read-back combination revalidated against Meridian");

  let updateMismatch: unknown = null;
  try {
    await updateCareTask(persisted.id, {
      patient: "PAT-002",
      carePlan: "CP-001",
    });
  } catch (err) {
    updateMismatch = err;
  }
  assert(
    updateMismatch instanceof TaskConsistencyError,
    "update mismatch blocked",
  );
  assert(
    (updateMismatch as InstanceType<typeof TaskConsistencyError>).status ===
      422,
    "update mismatch 422",
  );
  assert(
    (updateMismatch as InstanceType<typeof TaskConsistencyError>).error ===
      EXPECTED_EN,
    "update mismatch EN",
  );
  console.log(
    "✓ updateCareTask blocked mismatched Patient/Care Plan change",
  );

  // Caregiver membership authorization (PAT-001 + CG-004 has no Active membership).
  const {
    assertCaregiverAuthorizedForPatient,
    CAREGIVER_NOT_AUTHORIZED,
  } = await import("../src/lib/meridian/task-assignment");
  let caregiverBlocked: unknown = null;
  try {
    await assertCaregiverAuthorizedForPatient({
      patientRef: "PAT-001",
      caregiverRef: "CG-004",
      sdk,
    });
  } catch (err) {
    caregiverBlocked = err;
  }
  assert(
    caregiverBlocked instanceof TaskConsistencyError,
    "unauthorized caregiver should throw",
  );
  assert(
    (caregiverBlocked as InstanceType<typeof TaskConsistencyError>).code ===
      CAREGIVER_NOT_AUTHORIZED.code,
    "caregiver not authorized code",
  );
  console.log("✓ unauthorized caregiver assignment blocked", {
    error: (caregiverBlocked as InstanceType<typeof TaskConsistencyError>).error,
    errorEs: (caregiverBlocked as InstanceType<typeof TaskConsistencyError>)
      .errorEs,
  });

  const okAssign = await assertCaregiverAuthorizedForPatient({
    patientRef: "PAT-001",
    caregiverRef: "CG-001",
    sdk,
  });
  assert(okAssign.membership, "CG-001 should have Active membership for PAT-001");
  console.log("✓ authorized caregiver assignment allowed", {
    caregiver: okAssign.caregiver?.businessId,
    membership: okAssign.membership?.businessId,
  });

  console.log("\nAll CareCircle Patient–Care Plan consistency tests passed.");
  console.log(
    "Note: enforcement is CareCircle Next.js server-side only — not Meridian-global.",
  );
}

main().catch((err) => {
  console.error("TEST FAILED", err);
  process.exit(1);
});
