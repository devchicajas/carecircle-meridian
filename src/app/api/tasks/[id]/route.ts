import { requireAppUser, privateJson } from "@/lib/auth";
import { updateCareTask } from "@/lib/meridian/care-data";
import { TaskConsistencyError } from "@/lib/meridian/task-consistency";
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
    const body = (await request.json()) as {
      status?: string;
      patient?: string;
      carePlan?: string | null;
      description?: string;
      priority?: string;
      dueDate?: string;
      assignedCaregiver?: string;
    };

    if (
      body.status === undefined &&
      body.patient === undefined &&
      body.carePlan === undefined &&
      body.description === undefined &&
      body.priority === undefined &&
      body.dueDate === undefined &&
      body.assignedCaregiver === undefined
    ) {
      return privateJson(
        { error: "At least one updatable field is required" },
        { status: 400 },
      );
    }

    const task = await updateCareTask(decodeURIComponent(id), body);
    return privateJson({
      task,
      validation:
        "CareCircle server revalidated Patient–Care Plan consistency for the resulting task (not Meridian-global).",
    });
  } catch (err) {
    if (err instanceof TaskConsistencyError) {
      return privateJson(
        {
          error: err.error,
          errorEs: err.errorEs,
          code: err.code,
          enforcedBy: "carecircle-nextjs",
        },
        { status: err.status },
      );
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
