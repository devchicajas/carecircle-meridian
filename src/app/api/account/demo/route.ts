import { NextResponse } from "next/server";
import { requireAppUser, privateJson } from "@/lib/auth";
import {
  ACCOUNT_COOKIE,
  accountCookieOptions,
  encodeAccountCookie,
} from "@/lib/account/session";
import type { AccountProfile, AccountType } from "@/lib/account/types";
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
 * One-click fictional showcase account.
 *
 * Meridian create endpoints currently conflict on stuck business-ID sequences
 * (always retrying CG-001 / PAT-001), so this flow:
 *  1) Creates a CareCircle account profile (signed cookie)
 *  2) Links it to an existing fictional Meridian Caregiver or Patient
 *  3) PATCHes a proof field on that Meridian record
 *  4) Reads the record back to prove the backend write persisted
 *
 * Synthetic demo only — not real patient data.
 */
export async function POST(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  const sdk = createPlatformSDKFromEnv();
  if (!sdk) {
    return privateJson(
      { error: "MERIDIAN_API_KEY required", code: "MISSING_API_KEY" },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    firstName?: string;
    lastName?: string;
    preferredLanguage?: "English" | "Spanish";
    accountType?: AccountType;
    linkBusinessId?: string;
  };

  const stamp = Date.now().toString(36).slice(-5);
  const firstName = (body.firstName || "Demo").trim() || "Demo";
  const lastName =
    (body.lastName || `Showcase${stamp}`).trim() || `Showcase${stamp}`;
  const preferredLanguage =
    body.preferredLanguage === "Spanish" ? "Spanish" : "English";
  const accountType: AccountType =
    body.accountType === "patient" ? "patient" : "family_caregiver";
  const demoEmail = `demo.${stamp}@carecircle.example`;

  try {
    if (accountType === "patient") {
      const linked = await linkAndTouchPatient(sdk, {
        linkBusinessId: body.linkBusinessId || "PAT-001",
        firstName,
        lastName,
        preferredLanguage,
        demoEmail,
        stamp,
      });

      const profile = buildProfile(identity, {
        firstName,
        lastName,
        preferredLanguage,
        accountType: "patient",
        email: demoEmail,
        meridianPatientId: linked.id,
        meridianPatientBusinessId: linked.businessId,
      });

      return withAccountCookie(
        {
          profile,
          meridian: linked,
          proof: linked.proof,
          mode: "link-existing-patient",
          note:
            "Meridian CREATE is blocked by stuck PAT-001 sequence in this tenant. Showcase account linked an existing fictional Patient and verified a live PATCH + read-back.",
        },
        profile,
      );
    }

    const linked = await linkAndTouchCaregiver(sdk, {
      linkBusinessId: body.linkBusinessId || "CG-001",
      firstName,
      lastName,
      preferredLanguage,
      demoEmail,
      stamp,
    });

    const profile = buildProfile(identity, {
      firstName,
      lastName,
      preferredLanguage,
      accountType: "family_caregiver",
      email: demoEmail,
      meridianCaregiverId: linked.id,
      meridianCaregiverBusinessId: linked.businessId,
    });

    return withAccountCookie(
      {
        profile,
        meridian: linked,
        proof: linked.proof,
        mode: "link-existing-caregiver",
        note:
          "Meridian CREATE is blocked by stuck CG-001 sequence in this tenant. Showcase account linked an existing fictional Caregiver and verified a live PATCH + read-back.",
      },
      profile,
    );
  } catch (err) {
    if (err instanceof PlatformSDKError) {
      return privateJson(
        { error: err.detail || err.message, code: err.code, traceId: err.traceId },
        { status: err.status },
      );
    }
    return privateJson(
      { error: err instanceof Error ? err.message : "Demo account failed" },
      { status: 500 },
    );
  }
}

function withAccountCookie(data: unknown, profile: AccountProfile) {
  const res = NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
  res.cookies.set(
    ACCOUNT_COOKIE,
    encodeAccountCookie(profile),
    accountCookieOptions(),
  );
  return res;
}

function buildProfile(
  identity: {
    sub: string;
    email: string;
    emailVerified: boolean;
    simulated?: boolean;
  },
  input: {
    firstName: string;
    lastName: string;
    preferredLanguage: "English" | "Spanish";
    accountType: AccountType;
    email: string;
    meridianPatientId?: string;
    meridianPatientBusinessId?: string;
    meridianCaregiverId?: string;
    meridianCaregiverBusinessId?: string;
  },
): AccountProfile {
  return {
    identitySub: identity.sub,
    email: identity.email || input.email,
    emailVerified: Boolean(identity.emailVerified || identity.simulated),
    firstName: input.firstName,
    lastName: input.lastName,
    preferredName: `${input.firstName} (demo)`,
    preferredLanguage: input.preferredLanguage,
    accountType: input.accountType,
    meridianPatientId: input.meridianPatientId,
    meridianPatientBusinessId: input.meridianPatientBusinessId,
    meridianCaregiverId: input.meridianCaregiverId,
    meridianCaregiverBusinessId: input.meridianCaregiverBusinessId,
    role: input.accountType,
    onboarded: true,
    termsAcceptedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function linkAndTouchCaregiver(
  sdk: NonNullable<ReturnType<typeof createPlatformSDKFromEnv>>,
  input: {
    linkBusinessId: string;
    firstName: string;
    lastName: string;
    preferredLanguage: string;
    demoEmail: string;
    stamp: string;
  },
) {
  const { records } = await sdk.listRecords(MERIDIAN_OBJECTS.caregiver, {
    limit: 200,
  });
  const match = (records as Record<string, unknown>[]).find((row) => {
    const f = flattenRecord(row);
    return (
      String(row.id) === input.linkBusinessId ||
      pickString(f, ["caregiverId"]) === input.linkBusinessId
    );
  });
  if (!match) {
    throw new PlatformSDKError({
      status: 404,
      code: "NOT_FOUND",
      detail: `Meridian Caregiver ${input.linkBusinessId} not found for showcase link.`,
    });
  }

  const id = recordEnvelopeId(match);
  const before = flattenRecord(match);
  // Use a valid NANP-ish synthetic number; Meridian validates phone format.
  // Encode a demo stamp in the last 4 digits so each showcase run is visible.
  const last4 = String(parseInt(input.stamp, 36) % 10000).padStart(4, "0");
  const proofPhone = `555-010-${last4}`;

  // Prefer phoneNumber for proof — Preferred Name has a Meridian uniqueness rule.
  await sdk.updateRecord(
    MERIDIAN_OBJECTS.caregiver,
    id,
    {
      phoneNumber: proofPhone,
      preferredLanguage: input.preferredLanguage,
    },
    "CareCircle showcase dummy account: prove Meridian PATCH",
  );

  const { records: again } = await sdk.listRecords(MERIDIAN_OBJECTS.caregiver, {
    limit: 200,
  });
  const saved = (again as Record<string, unknown>[]).find(
    (row) => String(row.id) === id,
  );
  if (!saved) {
    throw new PlatformSDKError({
      status: 502,
      code: "READBACK_FAILED",
      detail: "Caregiver update could not be read back from Meridian.",
    });
  }
  const after = flattenRecord(saved);
  const persistedPhone = pickString(after, ["phoneNumber"]);
  if (persistedPhone !== proofPhone) {
    throw new PlatformSDKError({
      status: 502,
      code: "READBACK_MISMATCH",
      detail: `Expected phone ${proofPhone} after write, Meridian returned ${persistedPhone || "(empty)"}.`,
    });
  }

  return {
    id,
    businessId: pickString(after, ["caregiverId"]),
    name: `${pickString(after, ["firstName"])} ${pickString(after, ["lastName"])}`.trim(),
    object: "caregiver",
    proof: {
      field: "phoneNumber",
      before: pickString(before, ["phoneNumber"]) || null,
      after: persistedPhone,
      verified: true,
    },
  };
}

async function linkAndTouchPatient(
  sdk: NonNullable<ReturnType<typeof createPlatformSDKFromEnv>>,
  input: {
    linkBusinessId: string;
    firstName: string;
    lastName: string;
    preferredLanguage: string;
    demoEmail: string;
    stamp: string;
  },
) {
  const { records } = await sdk.listRecords(MERIDIAN_OBJECTS.patient, {
    limit: 200,
  });
  const match = (records as Record<string, unknown>[]).find((row) => {
    const f = flattenRecord(row);
    return (
      String(row.id) === input.linkBusinessId ||
      pickString(f, ["patientId"]) === input.linkBusinessId
    );
  });
  if (!match) {
    throw new PlatformSDKError({
      status: 404,
      code: "NOT_FOUND",
      detail: `Meridian Patient ${input.linkBusinessId} not found for showcase link.`,
    });
  }

  const id = recordEnvelopeId(match);
  const before = flattenRecord(match);
  const last4 = String(parseInt(input.stamp, 36) % 10000).padStart(4, "0");
  const proofPhone = `555-014-${last4}`;

  await sdk.updateRecord(
    MERIDIAN_OBJECTS.patient,
    id,
    {
      phoneNumber: proofPhone,
      preferredLanguage: input.preferredLanguage,
    },
    "CareCircle showcase dummy account: prove Meridian PATCH",
  );

  const { records: again } = await sdk.listRecords(MERIDIAN_OBJECTS.patient, {
    limit: 200,
  });
  const saved = (again as Record<string, unknown>[]).find(
    (row) => String(row.id) === id,
  );
  if (!saved) {
    throw new PlatformSDKError({
      status: 502,
      code: "READBACK_FAILED",
      detail: "Patient update could not be read back from Meridian.",
    });
  }
  const after = flattenRecord(saved);
  const persistedPhone = pickString(after, ["phoneNumber"]);
  if (persistedPhone !== proofPhone) {
    throw new PlatformSDKError({
      status: 502,
      code: "READBACK_MISMATCH",
      detail: `Expected phone ${proofPhone} after write, Meridian returned ${persistedPhone || "(empty)"}.`,
    });
  }

  return {
    id,
    businessId: pickString(after, ["patientId"]),
    name: `${pickString(after, ["firstName"])} ${pickString(after, ["lastName"])}`.trim(),
    object: "patient",
    proof: {
      field: "phoneNumber",
      before: pickString(before, ["phoneNumber"]) || null,
      after: persistedPhone,
      verified: true,
    },
  };
}
