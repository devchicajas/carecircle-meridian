import { NextResponse } from "next/server";
import { findUserByEmail, toPublicUser } from "@/lib/auth/db";
import {
  validateEmailFormat,
  verifyPassword,
} from "@/lib/auth/password";
import { postLoginPath } from "@/lib/account/types";

export const dynamic = "force-dynamic";

/**
 * Validate email/password before the client establishes an Auth.js session.
 * Returns specific codes so the UI can show helpful (non-leaky-enough) guidance.
 * Unknown emails and wrong passwords both stay 401 but with distinct codes for UX.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  const emailError = validateEmailFormat(email);
  if (emailError) {
    return NextResponse.json(
      {
        error: emailError,
        errorEs: "Introduce un correo válido.",
        code: "INVALID_EMAIL",
      },
      { status: 400 },
    );
  }
  if (!password) {
    return NextResponse.json(
      {
        error: "Enter your password.",
        errorEs: "Introduce tu contraseña.",
        code: "MISSING_PASSWORD",
      },
      { status: 400 },
    );
  }

  const user = findUserByEmail(email);
  if (!user) {
    return NextResponse.json(
      {
        error:
          "No CareCircle account matches that email. Check the spelling or sign up.",
        errorEs:
          "Ninguna cuenta de CareCircle coincide con ese correo. Revisa la escritura o regístrate.",
        code: "ACCOUNT_NOT_FOUND",
      },
      { status: 401 },
    );
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return NextResponse.json(
      {
        error:
          "That password does not match this account. Try again, or use Forgot password if you need a reset.",
        errorEs:
          "Esa contraseña no coincide con esta cuenta. Inténtalo de nuevo o usa Olvidé mi contraseña.",
        code: "WRONG_PASSWORD",
      },
      { status: 401 },
    );
  }

  const pub = toPublicUser(user);
  const redirectTo = postLoginPath({
    accountType: pub.accountType,
    onboarded: pub.onboarded,
  });
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
