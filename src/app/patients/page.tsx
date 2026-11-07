import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PatientDirectory } from "@/components/care/patient-directory";
import { StatusBanner } from "@/components/care/status-banner";
import { EmptyState } from "@/components/care/empty-state";
import { Button } from "@/components/ui/button";
import { loadAuthorizedCareView } from "@/lib/meridian/authorized-care";
import { getSessionUser } from "@/lib/auth";
import { getPageViewer } from "@/lib/viewer";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
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

  const isCaregiver = view.scope === "family_caregiver";
  if (view.scope === "patient") {
    const self = view.patients[0];
    if (self) redirect(`/patients/${encodeURIComponent(self.id)}`);
  }

  return (
    <AppShell
      sourceLabel={view.source === "meridian" ? "Meridian" : "Unavailable"}
      viewerName={viewer.verified ? viewer.name : undefined}
      showLogout={viewer.verified}
      accountType={viewer.accountType}
      accountRole={isCaregiver ? "Family Caregiver" : "Patient"}
    >
      <div className="space-y-6 animate-fadeUp">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-matcha-700">
              My Loved Ones · Mis seres queridos
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">
              People you are authorized to support
            </h1>
            <p className="mt-2 max-w-2xl text-ink-600">
              Only patients with an <strong>Active</strong> Care Circle
              membership for your caregiver profile appear here.
            </p>
          </div>
          {isCaregiver ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/care-circle">Care Circle</Link>
              </Button>
              <Button asChild>
                <Link href="/patients/add">Add a loved one</Link>
              </Button>
            </div>
          ) : null}
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
            title="Could not load loved ones"
            titleEs="No se pudieron cargar"
            detail={view.authError?.detail || view.loadingError}
          />
        ) : view.patients.length === 0 ? (
          <EmptyState
            title="No authorized loved ones yet"
            titleEs="Sin seres queridos autorizados"
            detail="Create a new patient profile or redeem a connection invite. Loved ones appear after an Active Care Circle membership is in place."
          />
        ) : (
          <PatientDirectory patients={view.patients} framing="lovedOnes" />
        )}
      </div>
    </AppShell>
  );
}
