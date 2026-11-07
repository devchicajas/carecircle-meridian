import { requireAppUser, privateJson } from "@/lib/auth";
import {
  createPatientInvite,
  findInviteByCode,
  listActiveInvitesForPatient,
  markInviteRedeemed,
} from "@/lib/auth/invites";
import { createMembershipRecord } from "@/lib/meridian/care-data";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";

export const dynamic = "force-dynamic";

/** Patient creates an invite code for a caregiver to redeem. */
export async function GET(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;
  if (identity.accountType !== "patient") {
    return privateJson(
      { error: "Only patient accounts can list connection invites." },
      { status: 403 },
    );
  }
  const invites = listActiveInvitesForPatient(identity.id).map((row) => ({
    code: row.code,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));
  return privateJson({ invites });
}

export async function POST(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  const body = (await request.json().catch(() => ({}))) as {
    action?: "create" | "redeem";
    code?: string;
    relationshipType?: string;
  };

  if (body.action === "redeem" || body.code) {
    if (identity.accountType !== "family_caregiver") {
      return privateJson(
        { error: "Only family caregivers can redeem invites." },
        { status: 403 },
      );
    }
    const caregiverRef =
      identity.meridianCaregiverBusinessId || identity.meridianCaregiverId;
    if (!caregiverRef) {
      return privateJson(
        {
          error:
            "Link your caregiver profile before redeeming a connection invite.",
        },
        { status: 400 },
      );
    }

    const code = String(body.code || "").trim();
    // Uniform response — do not reveal whether a patient/code exists.
    const genericFail = () =>
      privateJson(
        {
          error:
            "Invite could not be redeemed. Check the code with the patient and try again.",
          code: "INVITE_REDEEM_FAILED",
        },
        { status: 400 },
      );

    if (!code) return genericFail();
    const invite = findInviteByCode(code);
    if (!invite || invite.redeemed_at || invite.expires_at < new Date().toISOString()) {
      return genericFail();
    }

    const patientRef =
      invite.meridian_patient_business_id || invite.meridian_patient_id;
    const relationshipType = [
      "Parent",
      "Child",
      "Spouse",
      "Sibling",
      "Family Member",
      "Friend",
      "Other",
    ].includes(String(body.relationshipType || ""))
      ? String(body.relationshipType)
      : "Family Member";

    try {
      const membership = await createMembershipRecord({
        patient: patientRef,
        caregiver: caregiverRef,
        relationshipType,
        membershipStatus: "Inactive",
        startDate: new Date().toISOString().slice(0, 10),
      });
      markInviteRedeemed({
        inviteId: invite.id,
        caregiverUserId: identity.id,
      });
      return privateJson({
        ok: true,
        membership,
        note:
          "Connection requested. Membership is Inactive until a coordinator/admin activates it. The patient will appear in My Loved Ones after activation.",
      });
    } catch (err) {
      if (err instanceof PlatformSDKError) {
        // Still avoid leaking patient identity details.
        return privateJson(
          {
            error:
              "Invite could not be completed right now. Ask the patient to create a new invite or contact a coordinator.",
            code: err.code,
            traceId: err.traceId,
          },
          { status: 400 },
        );
      }
      return genericFail();
    }
  }

  // create invite
  if (identity.accountType !== "patient") {
    return privateJson(
      { error: "Only patient accounts can create connection invites." },
      { status: 403 },
    );
  }
  if (!identity.meridianPatientId) {
    return privateJson(
      { error: "Link your patient profile before creating invites." },
      { status: 400 },
    );
  }

  const invite = createPatientInvite({
    patientUserId: identity.id,
    meridianPatientId: identity.meridianPatientId,
    meridianPatientBusinessId: identity.meridianPatientBusinessId,
  });
  return privateJson({
    ok: true,
    invite: {
      code: invite.code,
      expiresAt: invite.expiresAt,
    },
    note: "Share this code only with a trusted caregiver. It does not grant access until membership is activated.",
  });
}
