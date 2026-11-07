import { requireAppUser, privateJson } from "@/lib/auth";
import { createCarePlanRecord } from "@/lib/meridian/care-data";
import {
  assertAuthorizedPatientAccess,
  loadAuthorizedCareView,
} from "@/lib/meridian/authorized-care";
import { canMutateCareRecords } from "@/lib/care/permissions";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;
  const view = await loadAuthorizedCareView(identity);
  return privateJson({
    source: view.source,
    connected: view.connected,
    carePlans: view.carePlans,
    warnings: view.warnings,
    authError: view.authError,
    loadingError: view.loadingError,
  });
}

export async function POST(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;
  if (!canMutateCareRecords(identity.accountType)) {
    return privateJson(
      { error: "Your account cannot create care plans." },
      { status: 403 },
    );
  }
  try {
    const body = await request.json();
    if (!body.patient || !body.recoveryGoals) {
      return privateJson(
        { error: "patient and recoveryGoals are required" },
        { status: 400 },
      );
    }
    await assertAuthorizedPatientAccess(identity, body.patient);
    const carePlan = await createCarePlanRecord(body);
    return privateJson({ carePlan }, { status: 201 });
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
