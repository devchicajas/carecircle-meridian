import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { findUserById, toPublicUser } from "@/lib/auth/db";
import type { AccountType } from "@/lib/account/types";

export type AppSessionUser = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  preferredLanguage: "English" | "Spanish";
  accountType: AccountType;
  role: AccountType;
  onboarded: boolean;
  meridianPatientId?: string;
  meridianPatientBusinessId?: string;
  meridianCaregiverId?: string;
  meridianCaregiverBusinessId?: string;
};

/** Require a signed-in CareCircle user (Auth.js credentials session). */
export async function requireAppUser(_request?: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      {
        error: "Authentication required. Please log in.",
        code: "UNAUTHENTICATED",
      },
      { status: 401 },
    );
  }
  const row = findUserById(session.user.id);
  if (!row) {
    return NextResponse.json(
      { error: "Account not found.", code: "USER_NOT_FOUND" },
      { status: 401 },
    );
  }
  const pub = toPublicUser(row);
  const user: AppSessionUser = {
    id: pub.id,
    email: pub.email,
    name: `${pub.firstName} ${pub.lastName}`.trim(),
    firstName: pub.firstName,
    lastName: pub.lastName,
    preferredLanguage: pub.preferredLanguage,
    accountType: pub.accountType,
    role: pub.role,
    onboarded: pub.onboarded,
    meridianPatientId: pub.meridianPatientId,
    meridianPatientBusinessId: pub.meridianPatientBusinessId,
    meridianCaregiverId: pub.meridianCaregiverId,
    meridianCaregiverBusinessId: pub.meridianCaregiverBusinessId,
  };
  return user;
}

export async function requireAdminUser(request?: Request) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;
  if (user.accountType !== "admin") {
    return NextResponse.json(
      {
        error: "Admin access required.",
        errorEs: "Se requiere acceso de administrador.",
        code: "ADMIN_REQUIRED",
      },
      { status: 403 },
    );
  }
  return user;
}

export function privateJson(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(data, { ...init, headers });
}

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const row = findUserById(session.user.id);
  return row ? toPublicUser(row) : null;
}
