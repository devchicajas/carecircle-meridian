import { requireAppUser, privateJson } from "@/lib/auth";
import { createAppointmentRecord } from "@/lib/meridian/care-data";
import {
  assertAuthorizedPatientAccess,
  loadAuthorizedCareView,
} from "@/lib/meridian/authorized-care";
import { PlatformSDKError } from "@/lib/sdk/platformSDK";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;
  const view = await loadAuthorizedCareView(identity);
  return privateJson({
    source: view.source,
    connected: view.connected,
    warnings: view.warnings,
    authError: view.authError,
    loadingError: view.loadingError,
    appointments: view.appointments,
  });
}

export async function POST(request: Request) {
  const identity = await requireAppUser(request);
  if (identity instanceof Response) return identity;

  try {
    const body = (await request.json()) as {
      patient?: string;
      appointmentType?: string;
      provider?: string;
      appointmentDateTime?: string;
      location?: string;
      status?: string;
      notes?: string;
    };
    if (!body.patient) {
      return privateJson({ error: "patient is required" }, { status: 400 });
    }
    if (!body.appointmentDateTime?.trim()) {
      return privateJson(
        { error: "appointmentDateTime is required" },
        { status: 400 },
      );
    }
    await assertAuthorizedPatientAccess(identity, body.patient);
    const appointment = await createAppointmentRecord({
      patient: body.patient,
      appointmentType: body.appointmentType || "Follow-Up",
      provider: body.provider,
      appointmentDateTime: body.appointmentDateTime,
      location: body.location,
      status: body.status,
      notes: body.notes,
    });
    return privateJson({ appointment }, { status: 201 });
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
