import { requireAppUser, privateJson } from "@/lib/auth";
import { createCareTask } from "@/lib/meridian/care-data";
import {
  assertAuthorizedPatientAccess,
  loadAuthorizedCareView,
} from "@/lib/meridian/authorized-care";
import { canMutateCareRecords } from "@/lib/care/permissions";
import { TaskConsistencyError } from "@/lib/meridian/task-consistency";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  const view = await loadAuthorizedCareView(identity);
  return privateJson({
    source: view.source,
    connected: view.connected,
    taskObject: view.taskObject,
    warnings: view.warnings,
    authError: view.authError,
    loadingError: view.loadingError,
    tasks: view.tasks,
    viewer: { id: identity.id, name: identity.name, email: identity.email },
  });
}

export async function POST(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;
  if (!canMutateCareRecords(identity.accountType)) {
    return privateJson(
      { error: "Your account cannot create care tasks." },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as {
      patient?: string;
      description?: string;
      priority?: string;
      status?: string;
      dueDate?: string;
      assignedCaregiver?: string;
      carePlan?: string;
      escalated?: boolean;
    };

    if (
      !body.patient ||
      !body.description ||
      !body.carePlan ||
      !body.assignedCaregiver ||
      !body.dueDate ||
      !body.priority ||
      !body.status
    ) {
      return privateJson(
        {
          error:
            "patient, carePlan, assignedCaregiver, description, dueDate, priority, and status are required",
        },
        { status: 400 },
      );
    }

    await assertAuthorizedPatientAccess(identity, body.patient);

    const task = await createCareTask({
      patient: body.patient,
      description: body.description,
      priority: body.priority,
      status: body.status,
      dueDate: body.dueDate,
      assignedCaregiver: body.assignedCaregiver,
      carePlan: body.carePlan,
    });

    return privateJson(
      {
        task,
        validation:
          "CareCircle server verified Patient–Care Plan consistency before write (not Meridian-global).",
      },
      { status: 201 },
    );
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
      { error: err instanceof Error ? err.message : "Create failed" },
      { status: 500 },
    );
  }
}
