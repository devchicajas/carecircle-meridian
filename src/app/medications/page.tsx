import { AppShell } from "@/components/layout/app-shell";
import { StatusBanner } from "@/components/care/status-banner";
import { EmptyState } from "@/components/care/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { resolvePatientLabel } from "@/lib/meridian/care-data";
import { loadAuthorizedCareView } from "@/lib/meridian/authorized-care";
import { getSessionUser } from "@/lib/auth";
import { getPageViewer } from "@/lib/viewer";
import { formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MedicationsPage() {
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
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
            Medications · Medicamentos
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            Recorded medication list
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-500">
            Display-only recorded information for authorized patients. Not
            clinical guidance.
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

        {view.medications.length === 0 ? (
          <EmptyState
            title="No medications for your account"
            titleEs="Sin medicamentos para tu cuenta"
            detail="Authorized Meridian medication rows will appear here."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {view.medications.map((m) => (
              <Card key={m.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-ink-900">{m.name}</div>
                      <div className="text-sm text-ink-500">
                        {resolvePatientLabel(
                          view.rawSnapshot.patients,
                          m.patientRef,
                        ) || m.patientRef}
                      </div>
                    </div>
                    <Badge variant="matcha">{m.status}</Badge>
                  </div>
                  <div className="text-sm text-ink-600">
                    {[m.frequency, m.instructions].filter(Boolean).join(" · ") ||
                      "—"}
                  </div>
                  {m.refillDate ? (
                    <div className="text-xs text-ink-500">
                      Refill {formatDate(m.refillDate)}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
