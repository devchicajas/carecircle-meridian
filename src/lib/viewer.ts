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
  };
}
