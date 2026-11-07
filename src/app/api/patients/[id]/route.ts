import { requireAppUser, privateJson } from "@/lib/auth";
import { getPatientById } from "@/lib/meridian/care-data";
import { updatePatientProfile } from "@/lib/meridian/mutations";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  const { id } = await context.params;
  const result = await getPatientById(decodeURIComponent(id));
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

  const { id } = await context.params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const patient = await updatePatientProfile(decodeURIComponent(id), body);
    return privateJson({ patient });
  } catch (err) {
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
