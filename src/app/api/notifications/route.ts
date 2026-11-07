import { requireAppUser, privateJson } from "@/lib/auth";
import { loadCareSnapshot } from "@/lib/meridian/care-data";
import { createNotification } from "@/lib/meridian/mutations";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;
  const snapshot = await loadCareSnapshot();
  return privateJson({
    source: snapshot.source,
    connected: snapshot.connected,
    notifications: snapshot.notifications,
    warnings: snapshot.warnings,
    authError: snapshot.authError,
    note:
      "If Meridian row-scope hides notifications from this API key, creates may still succeed and return the new record.",
  });
}

export async function POST(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;
  try {
    const body = (await request.json()) as {
      patient?: string;
      recipientCaregiver?: string;
      message?: string;
      notificationType?: string;
      relatedTask?: string;
      relatedAppointment?: string;
    };
    if (!body.patient || !body.recipientCaregiver || !body.message) {
      return privateJson(
        {
          error: "patient, recipientCaregiver, and message are required",
        },
        { status: 400 },
      );
    }
    const notification = await createNotification({
      patient: body.patient,
      recipientCaregiver: body.recipientCaregiver,
      message: body.message,
      notificationType: body.notificationType || "Task Assignment",
      relatedTask: body.relatedTask,
      relatedAppointment: body.relatedAppointment,
    });
    return privateJson({ notification }, { status: 201 });
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
      { error: err instanceof Error ? err.message : "Create failed" },
      { status: 500 },
    );
  }
}
