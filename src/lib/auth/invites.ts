/** @deprecated Prefer `@/lib/auth/connections` — kept for import compatibility. */
export {
  createPatientInvite,
  findInviteByCode,
  listInvitesForPatient as listActiveInvitesForPatient,
  markInviteRedeemed,
  revokeInvite,
  classifyInvite,
} from "@/lib/auth/connections";
