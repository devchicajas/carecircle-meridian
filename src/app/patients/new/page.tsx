import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { CreatePatientForm } from "@/components/care/create-patient-form";
import { Button } from "@/components/ui/button";
import { loadCareSnapshot } from "@/lib/meridian/care-data";
import { getPageViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function NewPatientPage() {
  const viewer = await getPageViewer();
  const snapshot = await loadCareSnapshot();

  return (
    <AppShell
      sourceLabel={snapshot.source === "meridian" ? "Meridian" : "Unavailable"}
      viewerName={viewer.verified ? viewer.name : undefined}
      showLogout={viewer.verified}
      accountType={viewer.accountType}
    >
      <div className="space-y-6 animate-fadeUp">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-matcha-700">
              Add loved one · Agregar ser querido
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink-900">
              Create a care profile for someone you support
            </h1>
            <p className="mt-2 max-w-2xl text-ink-600">
              This creates a Meridian patient record you can then link through
              Care Circle — it is not a clinic patient directory.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/patients">Back to loved ones</Link>
          </Button>
        </div>
        <CreatePatientForm />
      </div>
    </AppShell>
  );
}
