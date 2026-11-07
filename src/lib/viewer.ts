import { getSessionUser } from "@/lib/auth";

/** Page-level viewer from CareCircle Auth.js session (not Cursor Dev Viewer). */
export async function getPageViewer() {
  const user = await getSessionUser();
  if (!user) {
    return {
      verified: false as const,
      name: undefined as string | undefined,
      email: undefined as string | undefined,
      simulated: false,
      accountType: undefined as
        | "patient"
        | "family_caregiver"
        | undefined,
      role: undefined as "patient" | "family_caregiver" | undefined,
      onboarded: false,
      meridianCaregiverId: undefined as string | undefined,
      meridianCaregiverBusinessId: undefined as string | undefined,
      meridianPatientId: undefined as string | undefined,
      meridianPatientBusinessId: undefined as string | undefined,
    };
  }
  return {
    verified: true as const,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    simulated: false,
    onboarded: user.onboarded,
    accountType: user.accountType,
    role: user.role,
    meridianCaregiverId: user.meridianCaregiverId,
    meridianCaregiverBusinessId: user.meridianCaregiverBusinessId,
    meridianPatientId: user.meridianPatientId,
    meridianPatientBusinessId: user.meridianPatientBusinessId,
  };
}
