import { requireAppUser, privateJson } from "@/lib/auth";
import {
  loadCareSnapshot,
  updateCarePlanRecord,
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
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;
  const { id } = await context.params;
  const view = await loadAuthorizedCareView(identity);
  const carePlan = view.carePlans.find(
    (p) => p.id === decodeURIComponent(id) || p.businessId === decodeURIComponent(id),
  );
  if (!carePlan) {
    return privateJson({ error: "Care plan not found." }, { status: 404 });
  }
  return privateJson({ carePlan });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;
  if (!canMutateCareRecords(identity.accountType)) {
    return privateJson(
      { error: "Your account cannot update care plans." },
      { status: 403 },
    );
  }
  const { id } = await context.params;
  try {
    const snapshot = await loadCareSnapshot();
    const existing = snapshot.carePlans.find(
      (p) => p.id === decodeURIComponent(id),
    );
    if (!existing?.patientRef) {
      return privateJson({ error: "Care plan not found." }, { status: 404 });
    }
    await assertAuthorizedPatientAccess(identity, existing.patientRef);
    const body = await request.json();
    if (body.patient) {
      await assertAuthorizedPatientAccess(identity, body.patient);
    }
    const carePlan = await updateCarePlanRecord(decodeURIComponent(id), body);
    return privateJson({ carePlan });
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
