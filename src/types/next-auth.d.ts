import type { DefaultSession } from "next-auth";
import type { AccountType } from "@/lib/account/types";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
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
  }

  interface User {
    firstName?: string;
    lastName?: string;
    preferredLanguage?: "English" | "Spanish";
    accountType?: AccountType;
    role?: AccountType;
    onboarded?: boolean;
    meridianPatientId?: string;
    meridianPatientBusinessId?: string;
    meridianCaregiverId?: string;
    meridianCaregiverBusinessId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    firstName?: string;
    lastName?: string;
    preferredLanguage?: "English" | "Spanish";
    accountType?: AccountType;
    role?: AccountType;
    onboarded?: boolean;
    meridianPatientId?: string;
    meridianPatientBusinessId?: string;
    meridianCaregiverId?: string;
    meridianCaregiverBusinessId?: string;
  }
}
