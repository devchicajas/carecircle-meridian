export type AccountType = "patient" | "family_caregiver" | "admin";

/** Elevated roles require invitation — never self-granted from the browser. */
export type ElevatedRole = "care_coordinator" | "admin";

export type CareCircleRole = AccountType | ElevatedRole | "unlinked";

export function isAdminAccount(
  accountType: AccountType | string | undefined | null,
) {
  return accountType === "admin";
}

export function postLoginPath(input: {
  accountType: AccountType | string;
  onboarded: boolean;
}) {
  if (input.accountType === "admin") return "/admin";
  if (!input.onboarded) return "/onboarding";
  if (input.accountType === "patient") return "/portal/patient";
  return "/";
}
