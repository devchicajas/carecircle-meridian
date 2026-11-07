import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { findUserByEmail, insertUser, toPublicUser } from "@/lib/auth/db";
import {
  hashPassword,
  validateEmailFormat,
  validatePasswordPolicy,
} from "@/lib/auth/password";
import type { AccountType } from "@/lib/account/types";

export const dynamic = "force-dynamic";

/**
 * Create a CareCircle account (SQLite + bcrypt) and sign the user in.
 * Email verification is disabled for this controlled synthetic demo.
 * example.com addresses are allowed as login identifiers.
 */
export async function POST(request: Request) {
  if (!process.env.AUTH_SECRET?.trim()) {
    return NextResponse.json(
      {
        error:
          "AUTH_SECRET is not configured. Set it in .env.local for secure sessions.",
        code: "MISSING_AUTH_SECRET",
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
    preferredLanguage?: string;
    accountType?: string;
    termsAccepted?: boolean;
  };

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const confirmPassword = String(body.confirmPassword || "");
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();

  const emailError = validateEmailFormat(email);
  if (emailError) {
    return NextResponse.json({ error: emailError }, { status: 400 });
  }
  const passwordError = validatePasswordPolicy(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Password and confirm password do not match." },
      { status: 400 },
    );
  }
  if (!firstName || !lastName) {
    return NextResponse.json(
      { error: "First Name and Last Name are required." },
      { status: 400 },
    );
  }
  if (!body.termsAccepted) {
    return NextResponse.json(
      { error: "You must accept the demo terms to continue." },
      { status: 400 },
    );
  }

  // Never allow self-serve Coordinator/Admin.
  const accountType: AccountType =
    body.accountType === "patient" ? "patient" : "family_caregiver";
  const preferredLanguage =
    body.preferredLanguage === "Spanish" ? "Spanish" : "English";

  if (findUserByEmail(email)) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please log in." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const user = insertUser({
    id: randomUUID(),
    email,
    passwordHash,
    firstName,
    lastName,
    preferredLanguage,
    accountType,
  });

  return NextResponse.json(
    {
      user: toPublicUser(user),
      redirectTo: "/onboarding",
      signInRequired: true,
    },
    { status: 201 },
  );
}
