import { requireAppUser, privateJson } from "@/lib/auth";
import {
  decideConnectionRequest,
  findConnectionById,
} from "@/lib/auth/connections";
import {
  createMembershipRecord,
  findMembershipForPair,
  loadCareSnapshot,
  updateMembershipStatus,
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

  const isPatientOwner =
    identity.accountType === "patient" &&
    identity.id === connection.patient_user_id;

  let isCoordinator = false;
  if (!isPatientOwner) {
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

  if (!isPatientOwner && !isCoordinator) {
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

  // Approve → ensure Meridian membership is Active, then mark request approved.
  try {
    const patientRef =
      connection.meridian_patient_business_id ||
      connection.meridian_patient_id;
    const caregiverRef =
      connection.meridian_caregiver_business_id ||
      connection.meridian_caregiver_id;

    let membership =
      (await findMembershipForPair({
        patientRef,
        caregiverRef,
      })) || null;

    if (!membership) {
      membership = await createMembershipRecord({
        patient: patientRef,
        caregiver: caregiverRef,
        relationshipType: connection.relationship_type,
        membershipStatus: "Inactive",
        startDate: new Date().toISOString().slice(0, 10),
      });
    }

    if (!isActiveStatus(membership.status)) {
      membership = await updateMembershipStatus(membership.id, "Active");
    }

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

    // Read-back confirmation
    const confirmed = await findMembershipForPair({
      patientRef,
      caregiverRef,
    });

    return privateJson({
      ok: true,
      ...inviteMessagesBoth("approved"),
      request: updated,
      membership: confirmed,
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
