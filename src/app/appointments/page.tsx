import { AppShell } from "@/components/layout/app-shell";
import { StatusBanner } from "@/components/care/status-banner";
import { EmptyState } from "@/components/care/empty-state";
import { CreateAppointmentForm } from "@/components/care/create-appointment-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  loadCareSnapshot,
  resolvePatientLabel,
} from "@/lib/meridian/care-data";
import { getPageViewer } from "@/lib/viewer";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const viewer = await getPageViewer();
  const snapshot = await loadCareSnapshot();

  return (
    <AppShell
      sourceLabel={snapshot.source === "meridian" ? "Meridian" : "Unavailable"}
            viewerName={viewer.verified ? viewer.name : undefined}
      showLogout={viewer.verified}
    >
      <div className="space-y-6 animate-fadeUp">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-matcha-700">
            Appointments · Citas
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            Appointment agenda
          </h1>
        </div>

        <StatusBanner
          source={snapshot.source}
          connected={snapshot.connected}
          warnings={snapshot.warnings}
          authError={snapshot.authError}
          loadingError={snapshot.loadingError}
          patientObject={snapshot.patientObject}
          taskObject={snapshot.taskObject}
        />

        <CreateAppointmentForm
          patients={snapshot.patients.map((p) => ({
            value: p.businessId || p.id,
            label: `${p.name}${p.businessId ? ` (${p.businessId})` : ""}`,
          }))}
        />

        {snapshot.appointments.length === 0 ? (
          <EmptyState
            title="No appointments returned"
            titleEs="Sin citas"
            detail="Meridian object: appointment"
          />
        ) : (
          <div className="space-y-3">
            {snapshot.appointments.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-semibold text-ink-900">
                      {a.type || "Appointment"} ·{" "}
                      {resolvePatientLabel(snapshot.patients, a.patientRef) ||
                        a.patientRef}
                    </div>
                    <div className="text-sm text-ink-500">
                      {a.provider || "Provider TBD"} · {formatDate(a.dateTime)}
                      {a.location ? ` · ${a.location}` : ""}
                    </div>
                  </div>
                  <Badge variant="outline">{a.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
