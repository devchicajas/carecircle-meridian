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
 * Save Patient / Family Caregiver profile to Meridian for the signed-in user.
 * Tries create first; if Meridian ID sequence conflicts, links the Family
 * Caregiver/Patient row that already has this account's exact email and PATCHes it.
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
      { error: "Unable to reach care records right now." },
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
      { error: "First name and last name are required." },
      { status: 400 },
    );
  }

  try {
    const isPatient = row.account_type === "patient";
    let linked: {
      id: string;
      businessId?: string;
      mode: "created" | "linked_by_exact_email" | "claimed_unlinked_family_caregiver";
      readBack: boolean;
    };

    if (body.linkByExactEmail) {
      linked = isPatient
        ? await linkPatientByExactEmail(sdk, row.email, fields)
        : await linkCaregiverByExactEmail(sdk, row.email, fields);
    } else {
      try {
        linked = isPatient
          ? await createPatient(sdk, row.email, fields)
          : await createCaregiver(sdk, row.email, fields);
      } catch (err) {
        // Meridian still colliding on *-001 — fall back to exact-email link,
        // then claim an unlinked Family Caregiver slot if needed.
        const conflict =
          err instanceof PlatformSDKError &&
          (err.status === 409 || /already exists/i.test(err.detail || err.message));
        if (!conflict) throw err;
        try {
          linked = isPatient
            ? await linkPatientByExactEmail(sdk, row.email, fields)
            : await linkCaregiverByExactEmail(sdk, row.email, fields);
        } catch (linkErr) {
          if (
            !isPatient &&
            linkErr instanceof PlatformSDKError &&
            linkErr.code === "EMAIL_PROFILE_NOT_FOUND"
          ) {
            linked = await claimUnlinkedFamilyCaregiver(sdk, row.email, fields);
          } else {
            throw linkErr;
          }
        }
      }
    }

    const updated = updateUserProfile(user.id, {
      firstName: fields.firstName,
      lastName: fields.lastName,
      preferredName: fields.preferredName || null,
      preferredLanguage: fields.preferredLanguage,
      ...(isPatient
        ? {
            meridianPatientId: linked.id,
            meridianPatientBusinessId: linked.businessId,
          }
        : {
            meridianCaregiverId: linked.id,
            meridianCaregiverBusinessId: linked.businessId,
          }),
      onboarded: true,
    });

    return privateJson({
      profile: updated ? toPublicUser(updated) : null,
      meridian: {
        object: isPatient ? "patient" : "caregiver",
        ...linked,
      },
      redirectTo: isPatient ? "/portal/patient" : "/",
    });
  } catch (err) {
    if (err instanceof PlatformSDKError) {
      const friendly =
        err.code === "EMAIL_PROFILE_NOT_FOUND"
          ? err.detail
          : /already exists/i.test(err.detail || "")
            ? "Your profile could not be created yet. Make sure a Family Caregiver in Meridian uses this same email, then try again."
            : err.detail || err.message;
      return privateJson(
        {
          error: friendly,
          code: err.code,
        },
        { status: err.status >= 400 && err.status < 600 ? err.status : 500 },
      );
    }
    return privateJson(
      { error: err instanceof Error ? err.message : "Could not save profile." },
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
      detail: "Profile save could not be confirmed. Please try again.",
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
      portalAccessStatus: "Linked",
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
      portalAccessStatus: "Linked",
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

async function findCaregiverByExactEmail(
  sdk: PlatformSDK,
  email: string,
) {
  const { records } = await sdk.listRecords(MERIDIAN_OBJECTS.caregiver, {
    limit: 200,
  });
  const matches = (records as Record<string, unknown>[]).filter((row) => {
    const flat = flattenRecord(row);
    const rowEmail = pickString(flat, ["emailAddress", "email"]);
    return !!rowEmail && rowEmail.toLowerCase() === email.toLowerCase();
  });
  // Prefer Family Caregiver rows when several share the same email.
  return (
    matches.find((row) =>
      /family caregiver/i.test(
        pickString(flattenRecord(row), ["caregiverType"]) || "",
      ),
    ) || matches[0] || null
  );
}

async function patchCaregiverProfile(
  sdk: PlatformSDK,
  id: string,
  email: string,
  fields: ProfileFields,
  reason: string,
) {
  await sdk.updateRecord(
    MERIDIAN_OBJECTS.caregiver,
    id,
    {
      firstName: fields.firstName,
      lastName: fields.lastName,
      preferredName: fields.preferredName,
      preferredLanguage: fields.preferredLanguage,
      phoneNumber: fields.phoneNumber,
      emailAddress: email,
      caregiverType: "Family Caregiver",
      status: "Active",
      portalAccessStatus: "Linked",
    },
    reason,
  );
  const saved = await readBackSaved(sdk, MERIDIAN_OBJECTS.caregiver, id);
  const flat = flattenRecord(saved);
  return {
    id,
    businessId: pickString(flat, ["caregiverId"]),
    readBack: true as const,
  };
}

async function linkCaregiverByExactEmail(
  sdk: PlatformSDK,
  email: string,
  fields: ProfileFields,
) {
  const match = await findCaregiverByExactEmail(sdk, email);
  if (!match) {
    throw new PlatformSDKError({
      status: 404,
      code: "EMAIL_PROFILE_NOT_FOUND",
      detail:
        "No matching caregiver profile was found for this email yet. Add this email on your Family Caregiver record in Meridian, then save again.",
    });
  }
  const id = recordEnvelopeId(match);
  const patched = await patchCaregiverProfile(
    sdk,
    id,
    email,
    fields,
    `CareCircle onboarding: update caregiver for ${email}`,
  );
  return {
    ...patched,
    mode: "linked_by_exact_email" as const,
  };
}

/**
 * Meridian caregiverId sequence is stuck on CG-001 and refuses new creates.
 * Reuse an existing Family Caregiver that is not portal-Linked yet (seed rows).
 */
async function claimUnlinkedFamilyCaregiver(
  sdk: PlatformSDK,
  email: string,
  fields: ProfileFields,
) {
  const { records } = await sdk.listRecords(MERIDIAN_OBJECTS.caregiver, {
    limit: 200,
  });
  const candidates = (records as Record<string, unknown>[])
    .map((row) => {
      const flat = flattenRecord(row);
      return { row, flat, id: recordEnvelopeId(row) };
    })
    .filter(({ flat }) => {
      const type = pickString(flat, ["caregiverType"]) || "";
      if (!/family caregiver/i.test(type)) return false;
      const portal = (pickString(flat, ["portalAccessStatus"]) || "").trim();
      if (/^linked$/i.test(portal)) return false;
      return true;
    })
    .sort((a, b) => {
      const aId = pickString(a.flat, ["caregiverId"]) || "";
      const bId = pickString(b.flat, ["caregiverId"]) || "";
      return aId.localeCompare(bId, undefined, { numeric: true });
    });

  const pick = candidates[0];
  if (!pick) {
    throw new PlatformSDKError({
      status: 409,
      code: "CAREGIVER_ID_SEQUENCE_STUCK",
      detail:
        "Meridian still cannot allocate a new caregiver ID, and no unlinked Family Caregiver is available to claim. In Meridian Object Designer, advance the caregiverId sequence past existing CG-* values, then retry.",
    });
  }

  const patched = await patchCaregiverProfile(
    sdk,
    pick.id,
    email,
    fields,
    `CareCircle onboarding: claim unlinked family caregiver for ${email}`,
  );
  return {
    ...patched,
    mode: "claimed_unlinked_family_caregiver" as const,
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
      detail:
        "No matching patient profile was found for this email yet. Add this email on your Patient record in Meridian, then save again.",
    });
  }
  const id = recordEnvelopeId(match);
  await sdk.updateRecord(
    MERIDIAN_OBJECTS.patient,
    id,
    {
      firstName: fields.firstName,
      lastName: fields.lastName,
      preferredName: fields.preferredName,
      preferredLanguage: fields.preferredLanguage,
      phoneNumber: fields.phoneNumber,
      emailAddress: email,
      careStatus: "Routine Care",
      portalAccessStatus: "Linked",
    },
    `CareCircle onboarding: update patient for ${email}`,
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
