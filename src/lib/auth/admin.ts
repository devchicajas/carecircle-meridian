import { timingSafeEqual } from "node:crypto";
import {
  countUsersByAccountType,
  findUserByEmail,
  insertUser,
  updateUserProfile,
  toPublicUser,
} from "@/lib/auth/db";
import { hashPassword, validateEmailFormat, validatePasswordPolicy } from "@/lib/auth/password";
import { randomUUID } from "node:crypto";

export function getAdminBootstrapToken() {
  return process.env.CARECIRCLE_ADMIN_BOOTSTRAP_TOKEN?.trim() || "";
}

export function assertBootstrapToken(provided: string | null | undefined) {
  const expected = getAdminBootstrapToken();
  if (!expected) {
    throw new Error(
      "CARECIRCLE_ADMIN_BOOTSTRAP_TOKEN is not configured on the server.",
    );
  }
  const a = Buffer.from(String(provided || ""));
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Invalid admin bootstrap token.");
  }
}

/**
 * Create or promote an Admin account. Never exposed through public signup.
 * Requires CARECIRCLE_ADMIN_BOOTSTRAP_TOKEN.
 */
export async function provisionAdminAccount(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  preferredLanguage?: "English" | "Spanish";
  bootstrapToken: string;
}) {
  assertBootstrapToken(input.bootstrapToken);

  const email = input.email.trim().toLowerCase();
  const emailError = validateEmailFormat(email);
  if (emailError) throw new Error(emailError);
  const passwordError = validatePasswordPolicy(input.password);
  if (passwordError) throw new Error(passwordError);
  if (!input.firstName.trim() || !input.lastName.trim()) {
    throw new Error("First Name and Last Name are required.");
  }

  const existing = findUserByEmail(email);
  if (existing) {
    const passwordHash = await hashPassword(input.password);
    const updated = updateUserProfile(existing.id, {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      preferredLanguage:
        input.preferredLanguage || existing.preferred_language,
      accountType: "admin",
      onboarded: true,
      passwordHash,
    });
    return {
      user: toPublicUser(updated!),
      created: false as const,
      promoted: existing.account_type !== "admin",
    };
  }

  const passwordHash = await hashPassword(input.password);
  const user = insertUser({
    id: randomUUID(),
    email,
    passwordHash,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    preferredLanguage: input.preferredLanguage || "English",
    accountType: "admin",
    onboarded: true,
  });
  return { user: toPublicUser(user), created: true as const };
}

export function adminAccountCount() {
  return countUsersByAccountType("admin");
}
