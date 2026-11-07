import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { AccountProfile } from "@/lib/account/types";

export const ACCOUNT_COOKIE = "carecircle_account_v1";

function signingSecret() {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.MERIDIAN_API_KEY?.trim() ||
    "carecircle-dev-only-not-for-production"
  );
}

function sign(payload: string) {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

export function encodeAccountCookie(profile: AccountProfile): string {
  const body = Buffer.from(JSON.stringify(profile), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeAccountCookie(raw: string | undefined | null): AccountProfile | null {
  if (!raw) return null;
  const [body, signature] = raw.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const json = Buffer.from(body, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as AccountProfile;
    if (!parsed?.identitySub || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getAccountProfile(): Promise<AccountProfile | null> {
  const jar = await cookies();
  return decodeAccountCookie(jar.get(ACCOUNT_COOKIE)?.value);
}

export function accountCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 30) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: maxAgeSeconds,
  };
}
