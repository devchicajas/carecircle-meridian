import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { findUserByEmail, findUserById, toPublicUser } from "@/lib/auth/db";
import { validateEmailFormat, verifyPassword } from "@/lib/auth/password";

/**
 * CareCircle demo auth:
 * - Credentials provider with bcrypt hashes in a local SQLite auth DB
 * - Email is a login identifier only (example.com allowed)
 * - Email verification is intentionally disabled for this controlled synthetic demo
 * - Meridian remains the source of truth for care records (not passwords)
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  providers: [
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").trim();
        const password = String(credentials?.password || "");
        if (validateEmailFormat(email)) return null;
        if (!password) return null;
        const user = findUserByEmail(email);
        if (!user) return null;
        const ok = await verifyPassword(password, user.password_hash);
        if (!ok) return null;
        const pub = toPublicUser(user);
        return {
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
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      const userId = (user?.id as string | undefined) || (token.sub as string | undefined);
      if (!userId) return token;

      // Always refresh profile + Meridian links from SQLite so invite re-link
      // and onboarding updates apply without forcing a full re-login.
      const row = findUserById(userId);
      if (row) {
        const pub = toPublicUser(row);
        token.sub = pub.id;
        token.email = pub.email;
        token.name = `${pub.firstName} ${pub.lastName}`.trim();
        token.firstName = pub.firstName;
        token.lastName = pub.lastName;
        token.preferredLanguage = pub.preferredLanguage;
        token.accountType = pub.accountType;
        token.role = pub.role;
        token.onboarded = pub.onboarded;
        token.meridianPatientId = pub.meridianPatientId;
        token.meridianPatientBusinessId = pub.meridianPatientBusinessId;
        token.meridianCaregiverId = pub.meridianCaregiverId;
        token.meridianCaregiverBusinessId = pub.meridianCaregiverBusinessId;
      } else if (user) {
        // Fall back to authorize() payload on first sign-in if row missing.
        Object.assign(token, user);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.email = (token.email as string) || "";
        session.user.name = (token.name as string) || "";
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.preferredLanguage = token.preferredLanguage as
          | "English"
          | "Spanish";
        session.user.accountType = token.accountType as
          | "patient"
          | "family_caregiver";
        session.user.role = token.role as "patient" | "family_caregiver";
        session.user.onboarded = Boolean(token.onboarded);
        session.user.meridianPatientId = token.meridianPatientId as
          | string
          | undefined;
        session.user.meridianPatientBusinessId =
          token.meridianPatientBusinessId as string | undefined;
        session.user.meridianCaregiverId = token.meridianCaregiverId as
          | string
          | undefined;
        session.user.meridianCaregiverBusinessId =
          token.meridianCaregiverBusinessId as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
