import { requireAppUser, privateJson } from "@/lib/auth";
import { updateUserProfile, findUserById, toPublicUser } from "@/lib/auth/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;

  const row = findUserById(user.id);
  return privateJson({
    profile: row ? toPublicUser(row) : null,
    authMode: "credentials",
    note:
      "Email verification disabled for this controlled synthetic demo. Email is a login identifier only.",
  });
}

export async function PUT(request: Request) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;

  const body = (await request.json().catch(() => ({}))) as {
    firstName?: string;
    lastName?: string;
    preferredName?: string;
    preferredLanguage?: "English" | "Spanish";
  };

  const firstName = (body.firstName || user.firstName || "").trim();
  const lastName = (body.lastName || user.lastName || "").trim();
  if (!firstName || !lastName) {
    return privateJson(
      { error: "First Name and Last Name are required." },
      { status: 400 },
    );
  }

  const preferredLanguage =
    body.preferredLanguage === "Spanish" ||
    body.preferredLanguage === "English"
      ? body.preferredLanguage
      : user.preferredLanguage;

  const updated = updateUserProfile(user.id, {
    firstName,
    lastName,
    preferredName: body.preferredName?.trim() || null,
    preferredLanguage,
  });

  return privateJson({ profile: updated ? toPublicUser(updated) : null });
}
