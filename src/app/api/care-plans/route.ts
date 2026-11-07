import { requireAppUser, privateJson } from "@/lib/auth";
import {
  createCarePlanRecord,
  loadCareSnapshot,
} from "@/lib/meridian/care-data";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;
  const snapshot = await loadCareSnapshot();
  return privateJson({
    source: snapshot.source,
    connected: snapshot.connected,
    carePlans: snapshot.carePlans,
    warnings: snapshot.warnings,
    authError: snapshot.authError,
  });
}

export async function POST(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;
  try {
    const body = await request.json();
    if (!body.patient || !body.recoveryGoals) {
      return privateJson(
        { error: "patient and recoveryGoals are required" },
        { status: 400 },
      );
    }
    const carePlan = await createCarePlanRecord(body);
    return privateJson({ carePlan }, { status: 201 });
  } catch (err) {
    if (err instanceof PlatformSDKError) {
      return privateJson(
        { error: err.detail || err.message, code: err.code },
        { status: err.status },
      );
    }
    return privateJson(
      { error: err instanceof Error ? err.message : "Create failed" },
      { status: 500 },
    );
  }
}
