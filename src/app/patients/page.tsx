import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PatientDirectory } from "@/components/care/patient-directory";
import { StatusBanner } from "@/components/care/status-banner";
import { Button } from "@/components/ui/button";
import { loadCareSnapshot } from "@/lib/meridian/care-data";
import { getPageViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const viewer = await getPageViewer();
  const snapshot = await loadCareSnapshot();

  return (
    <AppShell
      sourceLabel={snapshot.source === "meridian" ? "Meridian" : "Unavailable"}
      viewerName={
        viewer.verified
          ? viewer.simulated
            ? `${viewer.name} (simulated)`
            : viewer.name
          : undefined
      }
    >
      <div className="space-y-6 animate-fadeUp">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-matcha-700">
              Patient Directory · Directorio de Pacientes
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">
              Live Meridian patients
            </h1>
            <p className="mt-2 max-w-2xl text-ink-600">
              Search by name and filter by case status. Profiles open linked care
              records from the same Meridian tenant.
            </p>
          </div>
          <Button asChild>
            <Link href="/patients/new">New patient / Nuevo</Link>
          </Button>
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

        <PatientDirectory patients={snapshot.patients} />
      </div>
    </AppShell>
  );
}
