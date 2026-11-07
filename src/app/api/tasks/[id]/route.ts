import { requireAppUser, privateJson } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Read-only mode: Meridian write verbs are not enabled for this integration yet. */
export async function PATCH(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  return privateJson(
    {
      error:
        "CareCircle is read-only until Meridian exposes PATCH on careTask for an authorized key.",
      code: "WRITE_NOT_ENABLED",
      writeOpsNeeded: ["PATCH /api/ext/v1/objects/careTask/{id}"],
    },
    { status: 403 },
  );
}
