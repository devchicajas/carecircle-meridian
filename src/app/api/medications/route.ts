import { requireAppUser, privateJson } from "@/lib/auth";
import { createMedicationRecord } from "@/lib/meridian/care-data";
import {
  assertAuthorizedPatientAccess,
  loadAuthorizedCareView,
} from "@/lib/meridian/authorized-care";
import { canMutateCareRecords } from "@/lib/care/permissions";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;
  const view = await loadAuthorizedCareView(user);
  return privateJson({
    source: view.source,
    connected: view.connected,
    medications: view.medications,
    warnings: view.warnings,
    authError: view.authError,
    loadingError: view.loadingError,
  });
}

export async function POST(request: Request) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;
  if (!canMutateCareRecords(user.accountType)) {
    return privateJson(
      { error: "Your account cannot create medication records." },
      { status: 403 },
    );
  }
  try {
    const body = await request.json();
    if (!body.patient || !body.medicationName) {
      return privateJson(
        { error: "patient and medicationName are required" },
        { status: 400 },
      );
    }
    await assertAuthorizedPatientAccess(user, body.patient);
    const medication = await createMedicationRecord(body);
    return privateJson({ medication }, { status: 201 });
  } catch (err) {
    if (err instanceof PlatformSDKError) {
      return privateJson(
        {
          error: err.detail || err.message,
          code: err.code,
          traceId: err.traceId,
        },
        { status: err.status },
      );
    }
    return privateJson(
      { error: err instanceof Error ? err.message : "Create failed" },
      { status: 500 },
    );
  }
}
