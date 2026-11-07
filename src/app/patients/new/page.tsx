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
    >
      <div className="space-y-6 animate-fadeUp">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-matcha-700">
              Intake · Alta
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink-900">
              Create patient profile
            </h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/patients">Back to directory</Link>
          </Button>
        </div>
        <CreatePatientForm />
      </div>
    </AppShell>
  );
}
