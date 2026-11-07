import { compare, hash } from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(password: string) {
  return hash(password, ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export function validatePasswordPolicy(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (password.length > 128) {
    return "Password must be at most 128 characters.";
  }
  return null;
}

/** Demo environment: any RFC-like email including example.com is allowed. */
export function validateEmailFormat(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Email is required.";
  // Practical email shape; explicitly allows example.com and other reserved domains.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address (e.g. jasmin@example.com).";
  }
  if (trimmed.length > 254) return "Email is too long.";
  return null;
}
