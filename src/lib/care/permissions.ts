import type { AccountType } from "@/lib/account/types";

/** CareCircle product policy on top of Meridian (API key is shared). */
export function canMutateCareRecords(accountType: AccountType | undefined) {
  return accountType === "family_caregiver" || accountType === "admin";
}

export function canCompleteCareTasks(accountType: AccountType | undefined) {
  return (
    accountType === "family_caregiver" ||
    accountType === "patient" ||
    accountType === "admin"
  );
}

export function canAccessAdmin(accountType: AccountType | undefined) {
  return accountType === "admin";
}
