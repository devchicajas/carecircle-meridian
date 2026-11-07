import { requireAppUser, privateJson } from "@/lib/auth";
import {
  decideConnectionRequest,
  findConnectionById,
} from "@/lib/auth/connections";
import {
  improveMembership,
  loadCareSnapshot,
} from "@/lib/meridian/care-data";
import { inviteMessagesBoth } from "@/lib/i18n/invite-messages";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";
import { isActiveStatus } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Approve or reject a pending connection request.
 * Authorized actors:
 * - The Patient who owns the invite/request
 * - A CareCircle user linked to an Active Care Coordinator Meridian profile
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    decision?: "approve" | "reject";
  };
  if (body.decision !== "approve" && body.decision !== "reject") {
    return privateJson(
      { error: "decision must be approve or reject" },
      { status: 400 },
    );
  }

  const connection = findConnectionById(decodeURIComponent(id));
  if (!connection || connection.status !== "pending_approval") {
    return privateJson(inviteMessagesBoth("invalid"), { status: 404 });
  }

  const isAdmin = identity.accountType === "admin";
  const isPatientOwner =
    identity.accountType === "patient" &&
    identity.id === connection.patient_user_id;

  let isCoordinator = false;
  if (!isPatientOwner && !isAdmin) {
    const snap = await loadCareSnapshot();
    const cg = snap.caregivers.find(
      (c) =>
        c.id === identity.meridianCaregiverId ||
        c.businessId === identity.meridianCaregiverBusinessId,
    );
    isCoordinator = Boolean(
      cg &&
        /care coordinator/i.test(cg.role || "") &&
        isActiveStatus(cg.status),
    );
  }

  if (!isPatientOwner && !isCoordinator && !isAdmin) {
    return privateJson(inviteMessagesBoth("unauthorized"), { status: 403 });
  }

  if (body.decision === "reject") {
    const updated = decideConnectionRequest({
      requestId: connection.id,
      status: "rejected",
      decidedByUserId: identity.id,
    });
    return privateJson({ ok: true, request: updated });
  }

  // Approve → ensure Meridian membership is Active (exclusive per pair).
  try {
    const patientRef =
      connection.meridian_patient_business_id ||
      connection.meridian_patient_id;
    const caregiverRef =
      connection.meridian_caregiver_business_id ||
      connection.meridian_caregiver_id;

    const membership = await improveMembership({
      membershipId: connection.meridian_membership_id || undefined,
      patientRef,
      caregiverRef,
      relationshipType: connection.relationship_type,
      membershipStatus: "Active",
    });

    if (!isActiveStatus(membership.status)) {
      return privateJson(
        {
          ...inviteMessagesBoth("meridianError"),
          detail: "Membership was not Active after approval.",
        },
        { status: 502 },
      );
    }

    const updated = decideConnectionRequest({
      requestId: connection.id,
      status: "approved",
      decidedByUserId: identity.id,
      meridianMembershipId: membership.id,
      meridianMembershipBusinessId: membership.businessId,
    });

    return privateJson({
      ok: true,
      ...inviteMessagesBoth("approved"),
      request: updated,
      membership,
    });
  } catch (err) {
    if (err instanceof PlatformSDKError) {
      return privateJson(
        {
          ...inviteMessagesBoth("meridianError"),
          code: err.code,
          traceId: err.traceId,
          detail: err.detail,
        },
        { status: err.status >= 400 ? err.status : 502 },
      );
    }
    return privateJson(inviteMessagesBoth("meridianError"), { status: 502 });
  }
}
