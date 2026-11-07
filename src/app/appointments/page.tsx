import { AppShell } from "@/components/layout/app-shell";
import { StatusBanner } from "@/components/care/status-banner";
import { EmptyState } from "@/components/care/empty-state";
import { CreateAppointmentForm } from "@/components/care/create-appointment-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { resolvePatientLabel } from "@/lib/meridian/care-data";
import { loadAuthorizedCareView } from "@/lib/meridian/authorized-care";
import { getSessionUser } from "@/lib/auth";
import { getPageViewer } from "@/lib/viewer";
import { formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const viewer = await getPageViewer();
  const profile = await getSessionUser();
  if (!profile) redirect("/login");

  const view = await loadAuthorizedCareView({
    id: profile.id,
    accountType: profile.accountType,
    meridianPatientId: profile.meridianPatientId,
    meridianPatientBusinessId: profile.meridianPatientBusinessId,
    meridianCaregiverId: profile.meridianCaregiverId,
    meridianCaregiverBusinessId: profile.meridianCaregiverBusinessId,
  });

  const patientOptions = view.patients.map((p) => ({
    value: p.businessId || p.id,
    label: `${p.name}${p.businessId ? ` (${p.businessId})` : ""}`,
  }));

  return (
    <AppShell
      sourceLabel={view.source === "meridian" ? "Meridian" : "Unavailable"}
      viewerName={viewer.verified ? viewer.name : undefined}
      showLogout={viewer.verified}
      accountType={viewer.accountType}
      accountRole={
        view.scope === "patient" ? "Patient" : "Family Caregiver"
      }
    >
      <div className="space-y-6 animate-fadeUp">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-matcha-700">
            Appointments · Citas
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            {view.scope === "patient"
              ? "My appointments"
              : "Loved ones' appointments"}
          </h1>
          <p className="mt-2 text-ink-600">
            Showing {view.appointments.length} authorized appointment
            {view.appointments.length === 1 ? "" : "s"} for your account.
          </p>
        </div>

        <StatusBanner
          source={view.source}
          connected={view.connected}
          warnings={view.warnings}
          authError={view.authError}
          loadingError={view.loadingError}
          patientObject={view.patientObject}
          taskObject={view.taskObject}
        />

        {view.authError || view.loadingError ? (
          <EmptyState
            title="Appointments could not be loaded"
            titleEs="No se pudieron cargar las citas"
            detail={view.authError?.detail || view.loadingError}
          />
        ) : (
          <>
            {patientOptions.length > 0 ? (
              <CreateAppointmentForm patients={patientOptions} />
            ) : (
              <EmptyState
                title="No authorized patient to schedule for"
                titleEs="Sin paciente autorizado"
                detail={
                  view.scope === "family_caregiver"
                    ? "Link an Active Care Circle membership before creating appointments."
                    : "Link your patient profile during onboarding."
                }
              />
            )}

            {view.appointments.length === 0 ? (
              <EmptyState
                title="No appointments for your account"
                titleEs="Sin citas para tu cuenta"
                detail="Authorized Meridian appointments will appear here."
              />
            ) : (
              <div className="space-y-3">
                {view.appointments.map((a) => (
                  <Card key={a.id}>
                    <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold text-ink-900">
                          {a.type || "Appointment"} ·{" "}
                          {resolvePatientLabel(
                            view.rawSnapshot.patients,
                            a.patientRef,
                          ) || a.patientRef}
                        </div>
                        <div className="text-sm text-ink-500">
                          {a.provider || "Provider TBD"} ·{" "}
                          {formatDate(a.dateTime)}
                          {a.location ? ` · ${a.location}` : ""}
                        </div>
                      </div>
                      <Badge variant="outline">{a.status}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
