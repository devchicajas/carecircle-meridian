import { requireAppUser, privateJson } from "@/lib/auth";
import {
  ACCOUNT_COOKIE,
  accountCookieOptions,
  encodeAccountCookie,
  getAccountProfile,
} from "@/lib/account/session";
import type { AccountProfile, AccountType } from "@/lib/account/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  const profile = await getAccountProfile();
  return privateJson({
    identity: {
      sub: identity.sub,
      email: identity.email,
      emailVerified: identity.emailVerified,
      name: identity.name,
      verified: identity.verified,
      simulated: identity.simulated,
      kind: identity.kind,
    },
    profile:
      profile && profile.identitySub === identity.sub ? profile : null,
    authMode: "cursor-identity",
    note:
      "Meridian has no external member signup/login API. CareCircle sessions use Cursor Identity on published private/team apps. Bind Auth0/Clerk secrets for email/password if required.",
  });
}

export async function PUT(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  if (
    identity.kind === "person" &&
    !identity.emailVerified &&
    !identity.simulated
  ) {
    return privateJson(
      {
        error: "Email verification required before updating account profile.",
        errorEs:
          "Se requiere verificar el correo antes de actualizar el perfil.",
        code: "EMAIL_UNVERIFIED",
      },
      { status: 403 },
    );
  }

  const body = (await request.json()) as Partial<AccountProfile>;
  const existing = await getAccountProfile();

  if (existing && existing.identitySub !== identity.sub) {
    return privateJson(
      { error: "Account profile does not match signed-in identity." },
      { status: 403 },
    );
  }

  const firstName = (body.firstName || existing?.firstName || "").trim();
  const lastName = (body.lastName || existing?.lastName || "").trim();
  if (!firstName || !lastName) {
    return privateJson(
      { error: "First Name and Last Name are required." },
      { status: 400 },
    );
  }

  let accountType: AccountType =
    existing?.accountType || "family_caregiver";
  if (body.accountType === "patient" || body.accountType === "family_caregiver") {
    accountType = body.accountType;
  }

  let preferredLanguage: "English" | "Spanish" =
    existing?.preferredLanguage || "English";
  if (
    body.preferredLanguage === "English" ||
    body.preferredLanguage === "Spanish"
  ) {
    preferredLanguage = body.preferredLanguage;
  }

  const profile: AccountProfile = {
    identitySub: identity.sub,
    email: identity.email || existing?.email || "",
    emailVerified: Boolean(identity.emailVerified || identity.simulated),
    firstName,
    lastName,
    preferredName: body.preferredName ?? existing?.preferredName,
    preferredLanguage,
    accountType,
    meridianPatientId: existing?.meridianPatientId,
    meridianPatientBusinessId: existing?.meridianPatientBusinessId,
    meridianCaregiverId: existing?.meridianCaregiverId,
    meridianCaregiverBusinessId: existing?.meridianCaregiverBusinessId,
    role: existing?.onboarded ? existing.role : accountType,
    onboarded: existing?.onboarded ?? false,
    termsAcceptedAt: body.termsAcceptedAt || existing?.termsAcceptedAt,
    updatedAt: new Date().toISOString(),
  };

  const res = privateJson({ profile });
  res.cookies.set(
    ACCOUNT_COOKIE,
    encodeAccountCookie(profile),
    accountCookieOptions(),
  );
  return res;
}

export async function DELETE(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;
  const res = privateJson({ cleared: true });
  res.cookies.set(ACCOUNT_COOKIE, "", {
    ...accountCookieOptions(),
    maxAge: 0,
  });
  return res;
}
