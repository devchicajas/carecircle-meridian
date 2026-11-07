import { requireAppUser, privateJson } from "@/lib/auth";
import { loadCareSnapshot, updateCareTask } from "@/lib/meridian/care-data";
import { assertAuthorizedPatientAccess } from "@/lib/meridian/authorized-care";
import { canCompleteCareTasks, canMutateCareRecords } from "@/lib/care/permissions";
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
      escalated?: boolean;
    };

    const snapshot = await loadCareSnapshot();
    const existing = snapshot.tasks.find(
      (t) => t.id === decodeURIComponent(id),
    );
    if (!existing?.patientRef) {
      return privateJson({ error: "Care task not found." }, { status: 404 });
    }
    await assertAuthorizedPatientAccess(identity, existing.patientRef);

    const statusOnlyComplete =
      body.status !== undefined &&
      Object.keys(body).every(
        (k) => k === "status" || (body as Record<string, unknown>)[k] === undefined,
      );

    if (statusOnlyComplete) {
      if (!canCompleteCareTasks(identity.accountType)) {
        return privateJson(
          { error: "Your account cannot update task status." },
          { status: 403 },
        );
      }
    } else if (!canMutateCareRecords(identity.accountType)) {
      return privateJson(
        { error: "Your account cannot edit care tasks." },
        { status: 403 },
      );
    }

    if (
      body.status === undefined &&
      body.patient === undefined &&
      body.carePlan === undefined &&
      body.description === undefined &&
      body.priority === undefined &&
      body.dueDate === undefined &&
      body.assignedCaregiver === undefined &&
      body.escalated === undefined
    ) {
      return privateJson(
        { error: "At least one updatable field is required" },
        { status: 400 },
      );
    }

    if (body.patient) {
      await assertAuthorizedPatientAccess(identity, body.patient);
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
