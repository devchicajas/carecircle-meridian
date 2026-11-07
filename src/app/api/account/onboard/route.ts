import { requireAppUser, privateJson } from "@/lib/auth";
import {
  ACCOUNT_COOKIE,
  accountCookieOptions,
  encodeAccountCookie,
  getAccountProfile,
} from "@/lib/account/session";
import type { AccountProfile } from "@/lib/account/types";
import { MERIDIAN_OBJECTS } from "@/lib/meridian/objects";
import {
  flattenRecord,
  recordEnvelopeId,
} from "@/lib/meridian/records";
import {
  createPlatformSDKFromEnv,
  PlatformSDKError,
} from "@/lib/sdk/platformSDK";
import { pickString } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Completes onboarding by creating or linking a Meridian Patient/Caregiver
 * using the immutable Cursor Identity `sub`. Does not grant Coordinator/Admin.
 * Mapping is stored in a signed httpOnly cookie until Meridian gains an
 * `identitySubject` field (proposed).
 */
export async function POST(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  if (
    identity.kind === "person" &&
    !identity.emailVerified &&
    !identity.simulated
  ) {
    return privateJson(
      {
        error: "Verify your email before completing onboarding.",
        errorEs: "Verifica tu correo antes de completar la incorporación.",
        code: "EMAIL_UNVERIFIED",
      },
      { status: 403 },
    );
  }

  const existing = await getAccountProfile();
  if (!existing || existing.identitySub !== identity.sub) {
    return privateJson(
      {
        error: "Create your account profile before onboarding.",
        code: "PROFILE_REQUIRED",
      },
      { status: 400 },
    );
  }

  if (!existing.termsAcceptedAt) {
    return privateJson(
      { error: "Terms acceptance is required.", code: "TERMS_REQUIRED" },
      { status: 400 },
    );
  }

  const sdk = createPlatformSDKFromEnv();
  if (!sdk) {
    return privateJson(
      { error: "MERIDIAN_API_KEY required", code: "MISSING_API_KEY" },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    linkExistingId?: string;
  };

  try {
    const profile: AccountProfile = { ...existing, updatedAt: new Date().toISOString() };

    if (existing.accountType === "patient") {
      const linked = await linkOrCreatePatient(sdk, profile, body.linkExistingId);
      profile.meridianPatientId = linked.id;
      profile.meridianPatientBusinessId = linked.businessId;
      profile.role = "patient";
    } else {
      const linked = await linkOrCreateCaregiver(
        sdk,
        profile,
        body.linkExistingId,
      );
      profile.meridianCaregiverId = linked.id;
      profile.meridianCaregiverBusinessId = linked.businessId;
      profile.role = "family_caregiver";
    }

    profile.onboarded = true;

    const res = privateJson({
      profile,
      mapping:
        "Linked via CareCircle signed cookie + Meridian record. Propose Meridian field identitySubject for durable cross-device mapping.",
    });
    res.cookies.set(
      ACCOUNT_COOKIE,
      encodeAccountCookie(profile),
      accountCookieOptions(),
    );
    return res;
  } catch (err) {
    if (err instanceof PlatformSDKError) {
      return privateJson(
        { error: err.detail || err.message, code: err.code },
        { status: err.status },
      );
    }
    return privateJson(
      { error: err instanceof Error ? err.message : "Onboarding failed" },
      { status: 500 },
    );
  }
}

async function linkOrCreatePatient(
  sdk: NonNullable<ReturnType<typeof createPlatformSDKFromEnv>>,
  profile: AccountProfile,
  linkExistingId?: string,
) {
  const { records } = await sdk.listRecords(MERIDIAN_OBJECTS.patient, {
    limit: 200,
  });

  if (linkExistingId) {
    const match = (records as Record<string, unknown>[]).find(
      (row) =>
        String(row.id) === linkExistingId ||
        pickString(flattenRecord(row), ["patientId"]) === linkExistingId,
    );
    if (!match) {
      throw new PlatformSDKError({
        status: 404,
        code: "NOT_FOUND",
        detail: "Patient to link was not found.",
      });
    }
    // Security: only allow link when email matches identity (immutable id field absent).
    const flat = flattenRecord(match);
    const email = pickString(flat, ["emailAddress"]);
    if (
      email &&
      profile.email &&
      email.toLowerCase() !== profile.email.toLowerCase()
    ) {
      throw new PlatformSDKError({
        status: 403,
        code: "EMAIL_MISMATCH",
        detail:
          "Cannot link Patient: email does not match signed-in identity. Meridian needs an identitySubject field for safer mapping.",
      });
    }
    return {
      id: recordEnvelopeId(match),
      businessId: pickString(flat, ["patientId"]),
    };
  }

  const created = await sdk.createRecord(
    MERIDIAN_OBJECTS.patient,
    {
      firstName: profile.firstName,
      lastName: profile.lastName,
      preferredName: profile.preferredName,
      preferredLanguage: profile.preferredLanguage,
      emailAddress: profile.email || undefined,
      careStatus: "Routine Care",
      portalAccessStatus: "Active",
    },
    "CareCircle onboarding: create patient for Cursor identity",
  );
  const flat = flattenRecord(created as Record<string, unknown>);
  return {
    id: recordEnvelopeId(created as Record<string, unknown>),
    businessId: pickString(flat, ["patientId"]),
  };
}

async function linkOrCreateCaregiver(
  sdk: NonNullable<ReturnType<typeof createPlatformSDKFromEnv>>,
  profile: AccountProfile,
  linkExistingId?: string,
) {
  const { records } = await sdk.listRecords(MERIDIAN_OBJECTS.caregiver, {
    limit: 200,
  });

  if (linkExistingId) {
    const match = (records as Record<string, unknown>[]).find(
      (row) =>
        String(row.id) === linkExistingId ||
        pickString(flattenRecord(row), ["caregiverId"]) === linkExistingId,
    );
    if (!match) {
      throw new PlatformSDKError({
        status: 404,
        code: "NOT_FOUND",
        detail: "Caregiver to link was not found.",
      });
    }
    const flat = flattenRecord(match);
    const email = pickString(flat, ["emailAddress", "email"]);
    if (
      email &&
      profile.email &&
      email.toLowerCase() !== profile.email.toLowerCase()
    ) {
      throw new PlatformSDKError({
        status: 403,
        code: "EMAIL_MISMATCH",
        detail:
          "Cannot link Caregiver: email does not match signed-in identity. Meridian needs an identitySubject field for safer mapping.",
      });
    }
    // Never elevate Family Caregiver to Coordinator via browser onboarding.
    return {
      id: recordEnvelopeId(match),
      businessId: pickString(flat, ["caregiverId"]),
    };
  }

  const created = await sdk.createRecord(
    MERIDIAN_OBJECTS.caregiver,
    {
      firstName: profile.firstName,
      lastName: profile.lastName,
      preferredName: profile.preferredName,
      preferredLanguage: profile.preferredLanguage,
      emailAddress: profile.email || undefined,
      caregiverType: "Family Caregiver",
      status: "Active",
      portalAccessStatus: "Active",
    },
    "CareCircle onboarding: create family caregiver for Cursor identity",
  );
  const flat = flattenRecord(created as Record<string, unknown>);
  return {
    id: recordEnvelopeId(created as Record<string, unknown>),
    businessId: pickString(flat, ["caregiverId"]),
  };
}
