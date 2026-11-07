import { AppShell } from "@/components/layout/app-shell";
import { PatientDirectory } from "@/components/care/patient-directory";
import { StatusBanner } from "@/components/care/status-banner";
import { loadCareSnapshot } from "@/lib/meridian/care-data";

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const snapshot = await loadCareSnapshot();

  return (
    <AppShell sourceLabel={snapshot.source === "meridian" ? "Meridian" : "Demo"}>
      <div className="space-y-6 animate-fadeUp">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-matcha-700">
            Patient Directory · Directorio de Pacientes
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">
            Fictional demo patients from your care circle
          </h1>
          <p className="mt-2 max-w-2xl text-ink-600">
            Search by name and filter by status. Profiles open Meridian-backed
            details when the tenant API key is present.
          </p>
        </div>

        <StatusBanner
          source={snapshot.source}
          connected={snapshot.connected}
          warnings={snapshot.warnings}
          patientObject={snapshot.patientObject}
          taskObject={snapshot.taskObject}
        />

        <PatientDirectory patients={snapshot.patients} />
      </div>
    </AppShell>
  );
}
