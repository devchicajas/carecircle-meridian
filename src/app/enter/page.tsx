import { AppShell } from "@/components/layout/app-shell";
import { DemoPersonaPicker, type DemoPersona } from "@/components/care/demo-persona-picker";
import {
  loadCareSnapshot,
  resolvePatientLabel,
} from "@/lib/meridian/care-data";

export const dynamic = "force-dynamic";

export default async function EnterPage() {
  const snapshot = await loadCareSnapshot();

  const personas: DemoPersona[] = snapshot.caregivers.map((c) => {
    const membership = snapshot.memberships.find(
      (m) => m.caregiverRef === c.businessId || m.caregiverRef === c.id,
    );
    const patient = snapshot.patients.find(
      (p) =>
        p.businessId === membership?.patientRef ||
        p.id === membership?.patientRef,
    );
    return {
      id: c.id,
      caregiverBusinessId: c.businessId || c.id,
      name: c.name,
      role: c.role || "Caregiver",
      language: c.language,
      focusPatientId: patient?.id,
      focusPatientName:
        patient?.name ||
        resolvePatientLabel(snapshot.patients, membership?.patientRef),
    };
  });

  return (
    <AppShell
      sourceLabel={snapshot.source === "meridian" ? "Meridian" : "Unavailable"}
    >
      <div className="mx-auto max-w-4xl space-y-6 animate-fadeUp">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
            Demo accounts · Cuentas demo
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            Choose who you are for the walkthrough
          </h1>
          <p className="mt-2 text-ink-600">
            Pick a fictional caregiver persona seeded in Meridian. Then edit
            María&apos;s profile, complete tasks, and send alerts — all against
            live Meridian records.
          </p>
        </div>
        <DemoPersonaPicker personas={personas} />
      </div>
    </AppShell>
  );
}
