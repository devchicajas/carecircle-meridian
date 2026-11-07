import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { EditMedicationForm } from "@/components/care/edit-medication-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolvePatientLabel } from "@/lib/meridian/care-data";
import { loadAuthorizedCareView } from "@/lib/meridian/authorized-care";
import { canMutateCareRecords } from "@/lib/care/permissions";
import { getSessionUser } from "@/lib/auth";
import { getPageViewer } from "@/lib/viewer";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MedicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getSessionUser();
  if (!profile) redirect("/login");
  const viewer = await getPageViewer();
  const { id } = await params;
  const decoded = decodeURIComponent(id);

  const view = await loadAuthorizedCareView({
    id: profile.id,
    accountType: profile.accountType,
    meridianPatientId: profile.meridianPatientId,
    meridianPatientBusinessId: profile.meridianPatientBusinessId,
    meridianCaregiverId: profile.meridianCaregiverId,
    meridianCaregiverBusinessId: profile.meridianCaregiverBusinessId,
  });

  const medication = view.medications.find(
    (m) => m.id === decoded || m.businessId === decoded,
  );
  if (!medication) notFound();
  const canEdit = canMutateCareRecords(profile.accountType);

  return (
    <AppShell
      sourceLabel={view.source === "meridian" ? "Meridian" : "Unavailable"}
      viewerName={viewer.verified ? viewer.name : undefined}
      showLogout
      accountType={viewer.accountType}
      accountRole={
        view.scope === "patient" ? "Patient" : "Family Caregiver"
      }
    >
      <div className="space-y-6 animate-fadeUp">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
              <Link href="/medications">← Medications</Link>
            </Button>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
              Medication detail
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink-900">
              {medication.name}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {medication.businessId || medication.id}
            </p>
            <p className="mt-2 text-xs text-ink-500">
              Recorded information only — not medical advice.
            </p>
          </div>
          <Badge variant="matcha">{medication.status}</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Medication fields</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <p>
              <strong>Medication ID:</strong> {medication.businessId || "—"}
            </p>
            <p>
              <strong>Patient:</strong>{" "}
              {resolvePatientLabel(
                view.rawSnapshot.patients,
                medication.patientRef,
              ) || medication.patientRef}
            </p>
            <p className="sm:col-span-2">
              <strong>Medication Name:</strong> {medication.name}
            </p>
            <p className="sm:col-span-2">
              <strong>Instructions:</strong> {medication.instructions || "—"}
            </p>
            <p>
              <strong>Frequency:</strong> {medication.frequency || "—"}
            </p>
            <p>
              <strong>Refill Date:</strong> {formatDate(medication.refillDate)}
            </p>
            <p>
              <strong>Status:</strong> {medication.status}
            </p>
          </CardContent>
        </Card>

        {canEdit ? (
          <EditMedicationForm medication={medication} />
        ) : (
          <p className="text-sm text-ink-500">
            Read-only for your Patient account.
          </p>
        )}
      </div>
    </AppShell>
  );
}
