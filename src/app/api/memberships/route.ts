import { requireAppUser, privateJson } from "@/lib/auth";
import {
  createMembershipRecord,
  loadCareSnapshot,
} from "@/lib/meridian/care-data";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;
  const snapshot = await loadCareSnapshot();
  return privateJson({
    source: snapshot.source,
    memberships: snapshot.memberships,
  });
}

export async function POST(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;
  try {
    const body = await request.json();
    if (!body.patient || !body.caregiver) {
      return privateJson(
        { error: "patient and caregiver are required" },
        { status: 400 },
      );
    }
    // Browser cannot self-activate membership to Coordinator/Admin privilege.
    // Default new memberships to Pending unless explicitly Pending/Inactive.
    const membershipStatus =
      body.membershipStatus === "Inactive" ? "Inactive" : "Pending";
    const membership = await createMembershipRecord({
      ...body,
      membershipStatus,
    });
    return privateJson(
      {
        membership,
        note: "New memberships are created as Pending. Only Coordinators/Admins may activate in Meridian.",
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof PlatformSDKError) {
      return privateJson(
        { error: err.detail || err.message, code: err.code },
        { status: err.status },
      );
    }
    return privateJson(
      { error: err instanceof Error ? err.message : "Create failed" },
      { status: 500 },
    );
  }
}
