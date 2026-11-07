import { requireAppUser, privateJson, type AppSessionUser } from "@/lib/auth";
import { findUserById } from "@/lib/auth/db";
import {
  classifyInvite,
  createConnectionRequest,
  createPatientInvite,
  findApprovedConnection,
  findInviteByCode,
  findPendingConnection,
  listConnectionRequestsForCaregiver,
  listConnectionRequestsForPatient,
  listInvitesForPatient,
  markInviteRedeemed,
  revokeInvite,
} from "@/lib/auth/connections";
import { ensureLiveCaregiverProfile } from "@/lib/meridian/caregiver-link";
import {
  createMembershipRecord,
  findMembershipForPair,
} from "@/lib/meridian/care-data";
import { inviteMessagesBoth } from "@/lib/i18n/invite-messages";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";

export const dynamic = "force-dynamic";

const RELATIONSHIP_TYPES = [
  "Parent",
  "Child",
  "Spouse",
  "Sibling",
  "Family Member",
  "Friend",
  "Other",
] as const;

export async function GET(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  if (identity.accountType === "patient") {
    const invites = listInvitesForPatient(identity.id).map((row) => {
      const { state } = classifyInvite(row);
      return {
        id: row.id,
        code: state === "usable" ? row.code : undefined,
        maskedCode:
          state === "usable"
            ? row.code
            : `${row.code.slice(0, 2)}••••${row.code.slice(-2)}`,
        status: state === "usable" ? "active" : state,
        relationshipHint: row.relationship_hint,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        revokedAt: row.revoked_at,
        redeemedAt: row.redeemed_at,
      };
    });
    const requests = listConnectionRequestsForPatient(identity.id);
    return privateJson({ invites, requests });
  }

  if (identity.accountType === "family_caregiver") {
    const requests = listConnectionRequestsForCaregiver(identity.id);
    return privateJson({ invites: [], requests });
  }

  return privateJson(inviteMessagesBoth("unauthorized"), { status: 403 });
}

export async function POST(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  const body = (await request.json().catch(() => ({}))) as {
    action?: "create" | "redeem" | "revoke";
    code?: string;
    inviteId?: string;
    relationshipType?: string;
    relationshipHint?: string;
  };

  if (body.action === "revoke") {
    if (identity.accountType !== "patient") {
      return privateJson(inviteMessagesBoth("unauthorized"), { status: 403 });
    }
    const ok = revokeInvite({
      inviteId: String(body.inviteId || ""),
      patientUserId: identity.id,
    });
    if (!ok) {
      return privateJson(inviteMessagesBoth("invalid"), { status: 400 });
    }
    return privateJson({ ok: true });
  }

  if (body.action === "redeem" || body.code) {
    return redeemInvite(identity as AppSessionUser, body);
  }

  // create
  if (identity.accountType !== "patient") {
    return privateJson(inviteMessagesBoth("patientOnlyCreate"), {
      status: 403,
    });
  }
  if (!identity.meridianPatientId) {
    return privateJson(
      {
        error: "Link your patient profile before creating invites.",
        errorEs:
          "Vincula tu perfil de paciente antes de crear invitaciones.",
      },
      { status: 400 },
    );
  }

  const invite = createPatientInvite({
    patientUserId: identity.id,
    meridianPatientId: identity.meridianPatientId,
    meridianPatientBusinessId: identity.meridianPatientBusinessId,
    relationshipHint: body.relationshipHint || null,
  });
  return privateJson({
    ok: true,
    invite: {
      id: invite.id,
      code: invite.code,
      expiresAt: invite.expiresAt,
    },
    note: "Share this code only with a trusted caregiver. Access stays pending until approved.",
    noteEs:
      "Comparte este código solo con un cuidador de confianza. El acceso permanece pendiente hasta la aprobación.",
  });
}

async function redeemInvite(
  identity: AppSessionUser,
  body: {
    code?: string;
    relationshipType?: string;
  },
) {
  if (identity.accountType !== "family_caregiver") {
    return privateJson(inviteMessagesBoth("caregiverOnlyRedeem"), {
      status: 403,
    });
  }

  const code = String(body.code || "").trim();
  if (!code) {
    return privateJson(inviteMessagesBoth("invalid"), { status: 400 });
  }

  const classified = classifyInvite(findInviteByCode(code));
  if (classified.state === "invalid") {
    return privateJson(inviteMessagesBoth("invalid"), { status: 400 });
  }
  if (classified.state === "expired") {
    return privateJson(inviteMessagesBoth("expired"), { status: 400 });
  }
  if (classified.state === "revoked") {
    return privateJson(inviteMessagesBoth("revoked"), { status: 400 });
  }
  if (classified.state === "redeemed") {
    return privateJson(inviteMessagesBoth("redeemed"), { status: 400 });
  }

  const invite = classified.invite!;
  const row = findUserById(identity.id);
  if (!row) {
    return privateJson(inviteMessagesBoth("unauthorized"), { status: 401 });
  }

  // Already connected?
  const approved = findApprovedConnection(invite.patient_user_id, identity.id);
  if (approved) {
    // Consume the single-use code even when the pair is already linked.
    markInviteRedeemed({
      inviteId: invite.id,
      caregiverUserId: identity.id,
    });
    return privateJson({
      ok: true,
      alreadyConnected: true,
      ...inviteMessagesBoth("alreadyConnected"),
      request: approved,
    });
  }

  const pending = findPendingConnection(invite.patient_user_id, identity.id);
  if (pending) {
    markInviteRedeemed({
      inviteId: invite.id,
      caregiverUserId: identity.id,
    });
    return privateJson({
      ok: true,
      status: "pending_approval",
      ...inviteMessagesBoth("requestSubmitted"),
      request: pending,
    });
  }

  let caregiver;
  try {
    caregiver = await ensureLiveCaregiverProfile({
      userId: identity.id,
      email: identity.email,
      firstName: identity.firstName || row.first_name,
      lastName: identity.lastName || row.last_name,
      preferredLanguage: identity.preferredLanguage,
      meridianCaregiverId: identity.meridianCaregiverId,
      meridianCaregiverBusinessId: identity.meridianCaregiverBusinessId,
    });
  } catch (err) {
    if (err instanceof PlatformSDKError) {
      return privateJson(
        {
          ...inviteMessagesBoth("meridianError"),
          code: err.code,
          traceId: err.traceId,
        },
        { status: 502 },
      );
    }
    return privateJson(inviteMessagesBoth("caregiverNotLinked"), {
      status: 400,
    });
  }

  const caregiverRef = caregiver.businessId || caregiver.id;
  const patientRef =
    invite.meridian_patient_business_id || invite.meridian_patient_id;

  const relationshipType = RELATIONSHIP_TYPES.includes(
    body.relationshipType as (typeof RELATIONSHIP_TYPES)[number],
  )
    ? String(body.relationshipType)
    : "Family Member";

  // Create or reuse Inactive Meridian membership (never invent Pending status).
  let membershipId: string | null = null;
  let membershipBusinessId: string | null = null;
  try {
    const existing = await findMembershipForPair({
      patientRef,
      caregiverRef,
    });
    if (existing) {
      membershipId = existing.id;
      membershipBusinessId = existing.businessId || null;
    } else {
      const membership = await createMembershipRecord({
        patient: patientRef,
        caregiver: caregiverRef,
        relationshipType,
        membershipStatus: "Inactive",
        startDate: new Date().toISOString().slice(0, 10),
      });
      membershipId = membership.id;
      membershipBusinessId = membership.businessId || null;
    }
  } catch (err) {
    // Persist the CareCircle request even if Meridian membership write fails —
    // but report a Meridian error so the user knows approval may need a coordinator.
    if (err instanceof PlatformSDKError) {
      // Still create local pending request for approval workflow.
      const redeemed = markInviteRedeemed({
        inviteId: invite.id,
        caregiverUserId: identity.id,
      });
      if (!redeemed) {
        return privateJson(inviteMessagesBoth("redeemed"), { status: 400 });
      }
      try {
        const request = createConnectionRequest({
          inviteId: invite.id,
          patientUserId: invite.patient_user_id,
          caregiverUserId: identity.id,
          meridianPatientId: invite.meridian_patient_id,
          meridianPatientBusinessId: invite.meridian_patient_business_id,
          meridianCaregiverId: caregiver.id,
          meridianCaregiverBusinessId: caregiver.businessId,
          relationshipType,
        });
        return privateJson({
          ok: true,
          status: "pending_approval",
          request,
          warning: inviteMessagesBoth("meridianError").error,
          warningEs: inviteMessagesBoth("meridianError").errorEs,
          meridianCode: err.code,
          traceId: err.traceId,
          ...inviteMessagesBoth("requestSubmitted"),
        });
      } catch {
        return privateJson(
          {
            ...inviteMessagesBoth("meridianError"),
            code: err.code,
            traceId: err.traceId,
          },
          { status: 400 },
        );
      }
    }
    return privateJson(inviteMessagesBoth("meridianError"), { status: 502 });
  }

  const redeemed = markInviteRedeemed({
    inviteId: invite.id,
    caregiverUserId: identity.id,
  });
  if (!redeemed) {
    return privateJson(inviteMessagesBoth("redeemed"), { status: 400 });
  }

  let request;
  try {
    request = createConnectionRequest({
      inviteId: invite.id,
      patientUserId: invite.patient_user_id,
      caregiverUserId: identity.id,
      meridianPatientId: invite.meridian_patient_id,
      meridianPatientBusinessId: invite.meridian_patient_business_id,
      meridianCaregiverId: caregiver.id,
      meridianCaregiverBusinessId: caregiver.businessId,
      relationshipType,
      meridianMembershipId: membershipId,
      meridianMembershipBusinessId: membershipBusinessId,
    });
  } catch {
    // Unique pending constraint — treat as already submitted.
    const existingPending = findPendingConnection(
      invite.patient_user_id,
      identity.id,
    );
    if (existingPending) {
      return privateJson({
        ok: true,
        status: "pending_approval",
        request: existingPending,
        ...inviteMessagesBoth("requestSubmitted"),
      });
    }
    return privateJson(inviteMessagesBoth("meridianError"), { status: 500 });
  }

  return privateJson({
    ok: true,
    status: "pending_approval",
    request,
    membership: {
      id: membershipId,
      businessId: membershipBusinessId,
      membershipStatus: "Inactive",
    },
    ...inviteMessagesBoth("requestSubmitted"),
  });
}
