import { requireAppUser, privateJson } from "@/lib/auth";
import { updateCareTaskStatus } from "@/lib/meridian/care-data";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  const { id } = await context.params;
  try {
    const body = (await request.json()) as { status?: string };
    if (!body.status || typeof body.status !== "string") {
      return privateJson({ error: "status is required" }, { status: 400 });
    }

    const task = await updateCareTaskStatus(
      decodeURIComponent(id),
      body.status,
    );
    return privateJson({ task });
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
