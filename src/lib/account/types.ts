export type AccountType = "patient" | "family_caregiver";

/** Elevated roles require invitation — never self-granted from the browser. */
export type ElevatedRole = "care_coordinator" | "admin";

export type CareCircleRole = AccountType | ElevatedRole | "unlinked";
