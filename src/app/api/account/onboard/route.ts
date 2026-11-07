import { requireAppUser, privateJson } from "@/lib/auth";
import { findUserById, toPublicUser, updateUserProfile } from "@/lib/auth/db";
import { MERIDIAN_OBJECTS } from "@/lib/meridian/objects";
import {
  flattenRecord,
  recordEnvelopeId,
} from "@/lib/meridian/records";
import {
  createPlatformSDKFromEnv,
  PlatformSDK,
  PlatformSDKError,
} from "@/lib/sdk/platformSDK";
import { pickString } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ProfileFields = {
  firstName: string;
  lastName: string;
  preferredName?: string;
  preferredLanguage: "English" | "Spanish";
  phoneNumber?: string;
};

/**
 * Create a Patient or Family Caregiver in Meridian for the signed-in user.
 * Never self-assigns Care Coordinator / Admin.
 *
 * If Meridian ID sequences are stuck (CONFLICT on CG-001/PAT-001), create fails
 * honestly. Optional linkByExactEmail only matches a Meridian row that already
 * has this account's email (demo-controlled; not proof of identity).
 */
export async function POST(request: Request) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;

  const row = findUserById(user.id);
  if (!row) {
    return privateJson({ error: "Account not found." }, { status: 404 });
  }

  const sdk = createPlatformSDKFromEnv();
  if (!sdk) {
    return privateJson(
      { error: "MERIDIAN_API_KEY required", code: "MISSING_API_KEY" },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Partial<ProfileFields> & {
    linkByExactEmail?: boolean;
  };

  const fields: ProfileFields = {
    firstName: (body.firstName || row.first_name).trim(),
    lastName: (body.lastName || row.last_name).trim(),
    preferredName: body.preferredName?.trim() || undefined,
    preferredLanguage:
      body.preferredLanguage === "Spanish" ||
      body.preferredLanguage === "English"
        ? body.preferredLanguage
        : row.preferred_language,
    phoneNumber: body.phoneNumber?.trim() || undefined,
  };

  if (!fields.firstName || !fields.lastName) {
    return privateJson(
      { error: "First Name and Last Name are required." },
      { status: 400 },
    );
  }

  try {
    if (row.account_type === "patient") {
      const linked = body.linkByExactEmail
        ? await linkPatientByExactEmail(sdk, row.email, fields)
        : await createPatient(sdk, row.email, fields);

      const updated = updateUserProfile(user.id, {
        firstName: fields.firstName,
        lastName: fields.lastName,
        preferredName: fields.preferredName || null,
        preferredLanguage: fields.preferredLanguage,
        meridianPatientId: linked.id,
        meridianPatientBusinessId: linked.businessId,
        onboarded: true,
      });

      return privateJson({
        profile: updated ? toPublicUser(updated) : null,
        meridian: { object: "patient", ...linked },
        redirectTo: "/portal/patient",
      });
    }

    const linked = body.linkByExactEmail
      ? await linkCaregiverByExactEmail(sdk, row.email, fields)
      : await createCaregiver(sdk, row.email, fields);

    const updated = updateUserProfile(user.id, {
      firstName: fields.firstName,
      lastName: fields.lastName,
      preferredName: fields.preferredName || null,
      preferredLanguage: fields.preferredLanguage,
      meridianCaregiverId: linked.id,
      meridianCaregiverBusinessId: linked.businessId,
      onboarded: true,
    });

    return privateJson({
      profile: updated ? toPublicUser(updated) : null,
      meridian: { object: "caregiver", ...linked },
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof PlatformSDKError) {
      const stuck = /already exists/i.test(err.detail || err.message);
      return privateJson(
        {
          error: err.detail || err.message,
          code: stuck ? "MERIDIAN_ID_SEQUENCE_STUCK" : err.code,
          traceId: err.traceId,
          hint: stuck
            ? "Meridian cannot allocate a new business ID (stuck on *-001). In Meridian Data Studio, create a Family Caregiver/Patient with this exact account email, then use “Link Meridian profile by email” — or advance the ID sequence and retry create."
            : undefined,
        },
        { status: err.status },
      );
    }
    return privateJson(
      { error: err instanceof Error ? err.message : "Onboarding failed" },
      { status: 500 },
    );
  }
}

async function readBackSaved(
  sdk: PlatformSDK,
  objectName: string,
  id: string,
) {
  const { records } = await sdk.listRecords(objectName, { limit: 200 });
  const saved = (records as Record<string, unknown>[]).find(
    (r) => String(r.id) === id,
  );
  if (!saved) {
    throw new PlatformSDKError({
      status: 502,
      code: "READBACK_FAILED",
      detail: `${objectName} write could not be read back from Meridian.`,
    });
  }
  return saved;
}

async function createCaregiver(
  sdk: PlatformSDK,
  email: string,
  fields: ProfileFields,
) {
  const created = await sdk.createRecord(
    MERIDIAN_OBJECTS.caregiver,
    {
      firstName: fields.firstName,
      lastName: fields.lastName,
      preferredName: fields.preferredName,
      preferredLanguage: fields.preferredLanguage,
      emailAddress: email,
      phoneNumber: fields.phoneNumber,
      caregiverType: "Family Caregiver",
      status: "Active",
      portalAccessStatus: "Active",
    },
    `CareCircle onboarding: create family caregiver for ${email}`,
  );
  const id = recordEnvelopeId(created as Record<string, unknown>);
  const saved = await readBackSaved(sdk, MERIDIAN_OBJECTS.caregiver, id);
  const flat = flattenRecord(saved);
  return {
    id,
    businessId: pickString(flat, ["caregiverId"]),
    mode: "created" as const,
    readBack: true,
  };
}

async function createPatient(
  sdk: PlatformSDK,
  email: string,
  fields: ProfileFields,
) {
  const created = await sdk.createRecord(
    MERIDIAN_OBJECTS.patient,
    {
      firstName: fields.firstName,
      lastName: fields.lastName,
      preferredName: fields.preferredName,
      preferredLanguage: fields.preferredLanguage,
      emailAddress: email,
      phoneNumber: fields.phoneNumber,
      careStatus: "Routine Care",
      portalAccessStatus: "Active",
    },
    `CareCircle onboarding: create patient for ${email}`,
  );
  const id = recordEnvelopeId(created as Record<string, unknown>);
  const saved = await readBackSaved(sdk, MERIDIAN_OBJECTS.patient, id);
  const flat = flattenRecord(saved);
  return {
    id,
    businessId: pickString(flat, ["patientId"]),
    mode: "created" as const,
    readBack: true,
  };
}

async function linkCaregiverByExactEmail(
  sdk: PlatformSDK,
  email: string,
  fields: ProfileFields,
) {
  const { records } = await sdk.listRecords(MERIDIAN_OBJECTS.caregiver, {
    limit: 200,
  });
  const match = (records as Record<string, unknown>[]).find((row) => {
    const flat = flattenRecord(row);
    const rowEmail = pickString(flat, ["emailAddress", "email"]);
    const type = pickString(flat, ["caregiverType"]) || "";
    return (
      !!rowEmail &&
      rowEmail.toLowerCase() === email.toLowerCase() &&
      /family caregiver/i.test(type)
    );
  });
  if (!match) {
    throw new PlatformSDKError({
      status: 404,
      code: "EMAIL_PROFILE_NOT_FOUND",
      detail: `No Family Caregiver in Meridian has email ${email}. Create one in Meridian Data Studio with this exact email, then retry link.`,
    });
  }
  const id = recordEnvelopeId(match);
  await sdk.updateRecord(
    MERIDIAN_OBJECTS.caregiver,
    id,
    {
      firstName: fields.firstName,
      lastName: fields.lastName,
      preferredLanguage: fields.preferredLanguage,
      phoneNumber: fields.phoneNumber,
      // Keep Family Caregiver — never elevate.
      caregiverType: "Family Caregiver",
      status: "Active",
    },
    `CareCircle onboarding: link+update caregiver for ${email}`,
  );
  const saved = await readBackSaved(sdk, MERIDIAN_OBJECTS.caregiver, id);
  const flat = flattenRecord(saved);
  return {
    id,
    businessId: pickString(flat, ["caregiverId"]),
    mode: "linked_by_exact_email" as const,
    readBack: true,
  };
}

async function linkPatientByExactEmail(
  sdk: PlatformSDK,
  email: string,
  fields: ProfileFields,
) {
  const { records } = await sdk.listRecords(MERIDIAN_OBJECTS.patient, {
    limit: 200,
  });
  const match = (records as Record<string, unknown>[]).find((row) => {
    const flat = flattenRecord(row);
    const rowEmail = pickString(flat, ["emailAddress", "email"]);
    return !!rowEmail && rowEmail.toLowerCase() === email.toLowerCase();
  });
  if (!match) {
    throw new PlatformSDKError({
      status: 404,
      code: "EMAIL_PROFILE_NOT_FOUND",
      detail: `No Patient in Meridian has email ${email}. Create one in Meridian Data Studio with this exact email, then retry link.`,
    });
  }
  const id = recordEnvelopeId(match);
  await sdk.updateRecord(
    MERIDIAN_OBJECTS.patient,
    id,
    {
      firstName: fields.firstName,
      lastName: fields.lastName,
      preferredLanguage: fields.preferredLanguage,
      phoneNumber: fields.phoneNumber,
      careStatus: "Routine Care",
    },
    `CareCircle onboarding: link+update patient for ${email}`,
  );
  const saved = await readBackSaved(sdk, MERIDIAN_OBJECTS.patient, id);
  const flat = flattenRecord(saved);
  return {
    id,
    businessId: pickString(flat, ["patientId"]),
    mode: "linked_by_exact_email" as const,
    readBack: true,
  };
}
