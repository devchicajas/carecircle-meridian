import { requireAppUser, privateJson } from "@/lib/auth";
import {
  loadCareSnapshot,
  updateMedicationRecord,
} from "@/lib/meridian/care-data";
import {
  assertAuthorizedPatientAccess,
  loadAuthorizedCareView,
} from "@/lib/meridian/authorized-care";
import { canMutateCareRecords } from "@/lib/care/permissions";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;
  const { id } = await context.params;
  const view = await loadAuthorizedCareView(user);
  const medication = view.medications.find(
    (m) => m.id === decodeURIComponent(id) || m.businessId === decodeURIComponent(id),
  );
  if (!medication) {
    return privateJson({ error: "Medication not found." }, { status: 404 });
  }
  return privateJson({ medication });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;
  if (!canMutateCareRecords(user.accountType)) {
    return privateJson(
      { error: "Your account cannot update medication records." },
      { status: 403 },
    );
  }
  const { id } = await context.params;
  try {
    const snapshot = await loadCareSnapshot();
    const existing = snapshot.medications.find(
      (m) => m.id === decodeURIComponent(id),
    );
    if (!existing?.patientRef) {
      return privateJson({ error: "Medication not found." }, { status: 404 });
    }
    await assertAuthorizedPatientAccess(user, existing.patientRef);
    const body = await request.json();
    const medication = await updateMedicationRecord(
      decodeURIComponent(id),
      body,
    );
    return privateJson({ medication });
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
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 },
    );
  }
}
