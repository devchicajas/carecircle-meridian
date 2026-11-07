import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { EditCarePlanForm } from "@/components/care/edit-care-plan-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  resolveCaregiverLabel,
  resolvePatientLabel,
} from "@/lib/meridian/care-data";
import {
  activeCareCoordinators,
  loadAuthorizedCareView,
} from "@/lib/meridian/authorized-care";
import { canMutateCareRecords } from "@/lib/care/permissions";
import { getSessionUser } from "@/lib/auth";
import { getPageViewer } from "@/lib/viewer";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CarePlanDetailPage({
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

  const carePlan = view.carePlans.find(
    (p) => p.id === decoded || p.businessId === decoded,
  );
  if (!carePlan) notFound();

  const canEdit = canMutateCareRecords(profile.accountType);
  const coordinators = activeCareCoordinators(view).map((c) => ({
    value: c.businessId || c.id,
    label: `${c.name}${c.businessId ? ` (${c.businessId})` : ""}`,
  }));
  // Ensure current coordinator remains selectable even if inactive later
  if (
    carePlan.assignedCoordinator &&
    !coordinators.some((c) => c.value === carePlan.assignedCoordinator)
  ) {
    coordinators.unshift({
      value: carePlan.assignedCoordinator,
      label:
        resolveCaregiverLabel(
          view.rawSnapshot.caregivers,
          carePlan.assignedCoordinator,
        ) || carePlan.assignedCoordinator,
    });
  }

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
              <Link href="/care-plans">← Care Plans</Link>
            </Button>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
              Care Plan detail
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink-900">
              {resolvePatientLabel(
                view.rawSnapshot.patients,
                carePlan.patientRef,
              ) || carePlan.patientRef}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {carePlan.businessId || carePlan.id}
            </p>
          </div>
          <Badge variant="matcha">{carePlan.status}</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Plan fields</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <p>
              <strong>Care Plan ID:</strong> {carePlan.businessId || "—"}
            </p>
            <p>
              <strong>Patient:</strong>{" "}
              {resolvePatientLabel(
                view.rawSnapshot.patients,
                carePlan.patientRef,
              ) || carePlan.patientRef}
            </p>
            <p className="sm:col-span-2">
              <strong>Recovery Goals:</strong> {carePlan.recoveryGoals || "—"}
            </p>
            <p>
              <strong>Assigned Coordinator:</strong>{" "}
              {resolveCaregiverLabel(
                view.rawSnapshot.caregivers,
                carePlan.assignedCoordinator,
              ) ||
                carePlan.assignedCoordinator ||
                "—"}
            </p>
            <p>
              <strong>Status:</strong> {carePlan.status}
            </p>
            <p>
              <strong>Start Date:</strong> {formatDate(carePlan.startDate)}
            </p>
            <p>
              <strong>Review Date:</strong> {formatDate(carePlan.reviewDate)}
            </p>
            <p>
              <strong>Discharge Date:</strong>{" "}
              {formatDate(carePlan.dischargeDate)}
            </p>
          </CardContent>
        </Card>

        {canEdit ? (
          <EditCarePlanForm carePlan={carePlan} coordinators={coordinators} />
        ) : (
          <p className="text-sm text-ink-500">
            Your Patient account can view this plan. Updates are managed by the
            care team.
          </p>
        )}
      </div>
    </AppShell>
  );
}
