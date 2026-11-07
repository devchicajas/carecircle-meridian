import type { AccountType } from "@/lib/account/types";

/** CareCircle product policy on top of Meridian (API key is shared). */
export function canMutateCareRecords(accountType: AccountType | undefined) {
  return accountType === "family_caregiver";
}

export function canCompleteCareTasks(accountType: AccountType | undefined) {
  return (
    accountType === "family_caregiver" || accountType === "patient"
  );
}
