export type AccountType = "patient" | "family_caregiver";

/** Elevated roles require invitation — never self-granted from the browser. */
export type ElevatedRole = "care_coordinator" | "admin";

export type CareCircleRole =
  | AccountType
  | ElevatedRole
  | "unlinked"
  | "demo_persona";

export type AccountProfile = {
  /** Cursor Identity `sub` (immutable). */
  identitySub: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  preferredName?: string;
  preferredLanguage: "English" | "Spanish";
  accountType: AccountType;
  /** Resolved Meridian Patient envelope id when linked. */
  meridianPatientId?: string;
  meridianPatientBusinessId?: string;
  /** Resolved Meridian Caregiver envelope id when linked. */
  meridianCaregiverId?: string;
  meridianCaregiverBusinessId?: string;
  /** Effective CareCircle role for UI navigation (not Meridian RBAC). */
  role: CareCircleRole;
  onboarded: boolean;
  termsAcceptedAt?: string;
  updatedAt: string;
};
