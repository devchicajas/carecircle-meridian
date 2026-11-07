import { requireAdminUser, privateJson } from "@/lib/auth";
import {
  loadCareSnapshot,
  improveMembership,
  listMembershipsForPair,
  updateMembershipStatus,
} from "@/lib/meridian/care-data";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";
import { isActiveStatus } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Admin overview of Meridian patients, caregivers, memberships, care plans. */
export async function GET(request: Request) {
  const admin = await requireAdminUser(request);
  if (admin instanceof Response) return admin;

  const snap = await loadCareSnapshot();
  const url = new URL(request.url);
  const patientRef = url.searchParams.get("patientRef") || undefined;
  const caregiverRef = url.searchParams.get("caregiverRef") || undefined;

  let pairMemberships = null;
  if (patientRef && caregiverRef) {
    pairMemberships = await listMembershipsForPair({ patientRef, caregiverRef });
  }

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
    pairMemberships,
  });
}

/**
 * Admin membership management:
 * - { membershipId, membershipStatus } → activate/deactivate (Active is exclusive per pair)
 * - { patientRef, caregiverRef, relationshipType?, membershipStatus? } → create/improve
 * - { action: "improve", ... } → same as create/improve helper
 */
export async function PATCH(request: Request) {
  const admin = await requireAdminUser(request);
  if (admin instanceof Response) return admin;

  const body = (await request.json().catch(() => ({}))) as {
    action?: "improve" | "set_status";
    membershipId?: string;
    membershipStatus?: "Active" | "Inactive";
    patientRef?: string;
    caregiverRef?: string;
    relationshipType?: string;
    exclusiveActive?: boolean;
  };

  try {
    // Preferred path: improve / create+activate
    if (
      body.action === "improve" ||
      (body.patientRef && body.caregiverRef) ||
      (body.membershipId && body.membershipStatus && body.exclusiveActive !== false)
    ) {
      const membership = await improveMembership({
        membershipId: body.membershipId,
        patientRef: body.patientRef,
        caregiverRef: body.caregiverRef,
        relationshipType: body.relationshipType,
        membershipStatus: body.membershipStatus || "Active",
      });

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

      const siblings =
        membership.patientRef && membership.caregiverRef
          ? await listMembershipsForPair({
              patientRef: membership.patientRef,
              caregiverRef: membership.caregiverRef,
            })
          : [];

      return privateJson({
        ok: true,
        membership,
        siblings,
        note: isActiveStatus(membership.status)
          ? "Membership is Active in Meridian. The caregiver should see this patient under My Loved Ones."
          : "Membership is Inactive in Meridian.",
      });
    }

    if (body.membershipId && body.membershipStatus) {
      const membership = await updateMembershipStatus(
        body.membershipId,
        body.membershipStatus,
        { exclusiveActive: body.membershipStatus === "Active" },
      );
      return privateJson({ ok: true, membership });
    }

    return privateJson(
      {
        error:
          "Provide membershipId + membershipStatus, or patientRef + caregiverRef to improve a membership.",
      },
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
