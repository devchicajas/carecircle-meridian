import { requireAdminUser, privateJson } from "@/lib/auth";
import { loadCareSnapshot } from "@/lib/meridian/care-data";
import {
  updateMembershipStatus,
  createMembershipRecord,
  findMembershipForPair,
} from "@/lib/meridian/care-data";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";
import { isActiveStatus } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Admin overview of Meridian patients, caregivers, memberships, care plans. */
export async function GET(request: Request) {
  const admin = await requireAdminUser(request);
  if (admin instanceof Response) return admin;

  const snap = await loadCareSnapshot();
  return privateJson({
    source: snap.source,
    connected: snap.connected,
    loadingError: snap.loadingError,
    authError: snap.authError,
    warnings: snap.warnings,
    patients: snap.patients,
    caregivers: snap.caregivers,
    memberships: snap.memberships,
    carePlans: snap.carePlans,
    metrics: snap.metrics,
  });
}

/** Admin membership activation / deactivation with Meridian read-back. */
export async function PATCH(request: Request) {
  const admin = await requireAdminUser(request);
  if (admin instanceof Response) return admin;

  const body = (await request.json().catch(() => ({}))) as {
    membershipId?: string;
    membershipStatus?: "Active" | "Inactive";
    patientRef?: string;
    caregiverRef?: string;
    relationshipType?: string;
  };

  try {
    if (body.membershipId && body.membershipStatus) {
      const membership = await updateMembershipStatus(
        body.membershipId,
        body.membershipStatus,
      );
      if (
        body.membershipStatus === "Active" &&
        !isActiveStatus(membership.status)
      ) {
        return privateJson(
          {
            error: "Meridian did not confirm Active membership status.",
            membership,
          },
          { status: 502 },
        );
      }
      return privateJson({ ok: true, membership });
    }

    if (body.patientRef && body.caregiverRef) {
      let membership = await findMembershipForPair({
        patientRef: body.patientRef,
        caregiverRef: body.caregiverRef,
      });
      if (!membership) {
        membership = await createMembershipRecord({
          patient: body.patientRef,
          caregiver: body.caregiverRef,
          relationshipType: body.relationshipType || "Family Member",
          membershipStatus: "Inactive",
          startDate: new Date().toISOString().slice(0, 10),
        });
      }
      if (body.membershipStatus === "Active") {
        membership = await updateMembershipStatus(membership.id, "Active");
      }
      return privateJson({ ok: true, membership });
    }

    return privateJson(
      { error: "Provide membershipId + membershipStatus, or patient/caregiver refs." },
      { status: 400 },
    );
  } catch (err) {
    if (err instanceof PlatformSDKError) {
      return privateJson(
        {
          error: err.detail || err.message,
          code: err.code,
          traceId: err.traceId,
        },
        { status: err.status >= 400 ? err.status : 502 },
      );
    }
    return privateJson(
      { error: err instanceof Error ? err.message : "Meridian update failed" },
      { status: 502 },
    );
  }
}
