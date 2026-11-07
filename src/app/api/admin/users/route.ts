import { requireAdminUser, privateJson } from "@/lib/auth";
import { listUsers, toPublicUser, updateUserProfile, findUserById } from "@/lib/auth/db";
import type { AccountType } from "@/lib/account/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdminUser(request);
  if (admin instanceof Response) return admin;

  const users = listUsers().map((row) => ({
    ...toPublicUser(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
  return privateJson({ users });
}

/** Admin can update account role metadata — never create Admin via this without care. */
export async function PATCH(request: Request) {
  const admin = await requireAdminUser(request);
  if (admin instanceof Response) return admin;

  const body = (await request.json().catch(() => ({}))) as {
    userId?: string;
    accountType?: AccountType;
    onboarded?: boolean;
    firstName?: string;
    lastName?: string;
  };

  const userId = String(body.userId || "");
  const target = findUserById(userId);
  if (!target) {
    return privateJson({ error: "User not found." }, { status: 404 });
  }

  // Demoting the last admin is blocked.
  if (
    target.account_type === "admin" &&
    body.accountType &&
    body.accountType !== "admin"
  ) {
    const admins = listUsers().filter((u) => u.account_type === "admin");
    if (admins.length <= 1) {
      return privateJson(
        { error: "Cannot demote the last Admin account." },
        { status: 400 },
      );
    }
  }

  // Promoting to admin requires bootstrap — not this endpoint.
  if (body.accountType === "admin" && target.account_type !== "admin") {
    return privateJson(
      {
        error:
          "Promote Admin only via secure bootstrap (CARECIRCLE_ADMIN_BOOTSTRAP_TOKEN).",
      },
      { status: 403 },
    );
  }

  if (
    body.accountType &&
    body.accountType !== "patient" &&
    body.accountType !== "family_caregiver" &&
    body.accountType !== "admin"
  ) {
    return privateJson({ error: "Invalid account type." }, { status: 400 });
  }

  const updated = updateUserProfile(userId, {
    accountType:
      body.accountType === "patient" || body.accountType === "family_caregiver"
        ? body.accountType
        : body.accountType === "admin"
          ? "admin"
          : undefined,
    onboarded: body.onboarded,
    firstName: body.firstName,
    lastName: body.lastName,
  });

  return privateJson({ user: updated ? toPublicUser(updated) : null });
}
