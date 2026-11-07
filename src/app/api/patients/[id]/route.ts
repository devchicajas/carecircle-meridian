import { requireAppUser, privateJson } from "@/lib/auth";
import { getPatientById } from "@/lib/meridian/care-data";
import { updatePatientProfile } from "@/lib/meridian/mutations";
import { assertAuthorizedPatientAccess } from "@/lib/meridian/authorized-care";
import { canMutateCareRecords } from "@/lib/care/permissions";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  const { id } = await context.params;
  const decoded = decodeURIComponent(id);

  try {
    await assertAuthorizedPatientAccess(identity, decoded);
  } catch (err) {
    if (err instanceof PlatformSDKError && err.status === 403) {
      // Do not reveal whether an unauthorized private patient exists.
      return privateJson({ error: "Patient not found" }, { status: 404 });
    }
    if (err instanceof PlatformSDKError) {
      return privateJson(
        { error: err.detail || err.message, code: err.code },
        { status: err.status },
      );
    }
    throw err;
  }

  const result = await getPatientById(decoded);
  if (!result.patient) {
    return privateJson({ error: "Patient not found" }, { status: 404 });
  }
  return privateJson({
    ...result,
    viewer: { id: identity.id, name: identity.name, email: identity.email },
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  if (!canMutateCareRecords(identity.accountType)) {
    return privateJson(
      { error: "Only family caregivers can update patient profiles here." },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  const decoded = decodeURIComponent(id);

  try {
    await assertAuthorizedPatientAccess(identity, decoded);
    const body = (await request.json()) as Record<string, unknown>;
    const patient = await updatePatientProfile(decoded, body);
    return privateJson({ patient });
  } catch (err) {
    if (err instanceof PlatformSDKError && err.status === 403) {
      return privateJson({ error: "Patient not found" }, { status: 404 });
    }
    if (err instanceof PlatformSDKError) {
      return privateJson(
        {
          error: err.detail || err.message,
          code: err.code,
          traceId: err.traceId,
        },
        { status: err.status },
      );
    }
    return privateJson(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 },
    );
  }
}
