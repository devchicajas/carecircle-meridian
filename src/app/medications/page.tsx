import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBanner } from "@/components/care/status-banner";
import { EmptyState } from "@/components/care/empty-state";
import { CreateMedicationForm } from "@/components/care/create-medication-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { resolvePatientLabel } from "@/lib/meridian/care-data";
import { loadAuthorizedCareView } from "@/lib/meridian/authorized-care";
import { canMutateCareRecords } from "@/lib/care/permissions";
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

  const canCreate = canMutateCareRecords(profile.accountType);
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
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
            Medications · Medicamentos
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            Recorded medication list
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-500">
            Display-only recorded information for authorized patients. Not
            clinical guidance. Showing {view.medications.length} record
            {view.medications.length === 1 ? "" : "s"}.
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
            title="Could not load medications"
            titleEs="No se pudieron cargar medicamentos"
            detail={view.authError?.detail || view.loadingError}
          />
        ) : (
          <>
            {canCreate ? (
              patientOptions.length === 0 ? (
                <EmptyState
                  title="No authorized patient"
                  titleEs="Sin paciente autorizado"
                  detail="Link an Active Care Circle membership before recording medications."
                />
              ) : (
                <CreateMedicationForm patients={patientOptions} />
              )
            ) : (
              <p className="rounded-2xl bg-cream p-3 text-sm text-ink-600">
                Patient accounts can view recorded medications. Family Caregivers
                can add or edit records for authorized loved ones.
              </p>
            )}

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
                          <Link
                            href={`/medications/${encodeURIComponent(m.id)}`}
                            className="font-semibold text-ink-900 hover:underline"
                          >
                            {m.name}
                          </Link>
                          <div className="text-sm text-ink-500">
                            {resolvePatientLabel(
                              view.rawSnapshot.patients,
                              m.patientRef,
                            ) || m.patientRef}
                          </div>
                          <div className="text-xs text-ink-400">
                            {m.businessId || m.id}
                          </div>
                        </div>
                        <Badge variant="matcha">{m.status}</Badge>
                      </div>
                      <div className="text-sm text-ink-600">
                        {[m.frequency, m.instructions]
                          .filter(Boolean)
                          .join(" · ") || "—"}
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
          </>
        )}
      </div>
    </AppShell>
  );
}
