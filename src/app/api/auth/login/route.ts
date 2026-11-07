import { NextResponse } from "next/server";
import { findUserByEmail, toPublicUser } from "@/lib/auth/db";
import {
  validateEmailFormat,
  verifyPassword,
} from "@/lib/auth/password";

export const dynamic = "force-dynamic";

/**
 * Validate email/password before the client establishes an Auth.js session.
 * Keeps error messages generic (no provider/storage details in the UI).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  const email = String(body.email || "").trim();
  const password = String(body.password || "");

  if (validateEmailFormat(email) || !password) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const user = findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const pub = toPublicUser(user);
  const redirectTo = !pub.onboarded
    ? "/onboarding"
    : pub.accountType === "patient"
      ? "/portal/patient"
      : "/";
  return NextResponse.json({
    ok: true,
    redirectTo,
    user: {
      id: pub.id,
      email: pub.email,
      firstName: pub.firstName,
      lastName: pub.lastName,
      onboarded: pub.onboarded,
      accountType: pub.accountType,
    },
  });
}
