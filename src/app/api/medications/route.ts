import { requireAppUser, privateJson } from "@/lib/auth";
import {
  createMedicationRecord,
  loadCareSnapshot,
} from "@/lib/meridian/care-data";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;
  const snapshot = await loadCareSnapshot();
  return privateJson({
    source: snapshot.source,
    connected: snapshot.connected,
    medications: snapshot.medications,
    warnings: snapshot.warnings,
    authError: snapshot.authError,
  });
}

export async function POST(request: Request) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;
  try {
    const body = await request.json();
    if (!body.patient || !body.medicationName) {
      return privateJson(
        { error: "patient and medicationName are required" },
        { status: 400 },
      );
    }
    const medication = await createMedicationRecord(body);
    return privateJson({ medication }, { status: 201 });
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
