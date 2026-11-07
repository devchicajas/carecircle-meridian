import { AppShell } from "@/components/layout/app-shell";
import { StatusBanner } from "@/components/care/status-banner";
import { EmptyState } from "@/components/care/empty-state";
import { CreateCarePlanForm } from "@/components/care/create-care-plan-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  loadCareSnapshot,
  resolvePatientLabel,
} from "@/lib/meridian/care-data";
import { getPageViewer } from "@/lib/viewer";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CarePlansPage() {
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
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
            Care Plans · Planes de Cuidado
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            Long-term care coordination
          </h1>
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

        <CreateCarePlanForm
          patients={snapshot.patients.map((p) => ({
            value: p.businessId || p.id,
            label: `${p.name}${p.businessId ? ` (${p.businessId})` : ""}`,
          }))}
          coordinators={snapshot.caregivers
            .filter(
              (c) =>
                /care coordinator/i.test(c.role || "") &&
                /active/i.test(c.status),
            )
            .map((c) => ({
              value: c.businessId || c.id,
              label: `${c.name}${c.businessId ? ` (${c.businessId})` : ""}`,
            }))}
        />

        {snapshot.carePlans.length === 0 ? (
          <EmptyState
            title="No care plans returned"
            titleEs="Sin planes"
            detail="Meridian object: carePlan"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {snapshot.carePlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base">
                    {resolvePatientLabel(snapshot.patients, plan.patientRef) ||
                      plan.patientRef ||
                      plan.businessId}
                  </CardTitle>
                  <Badge variant="matcha">{plan.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-ink-600">
                  <p>Coordinator: {plan.assignedCoordinator || "—"}</p>
                  <p>Start: {formatDate(plan.startDate)}</p>
                  <p>Review: {formatDate(plan.reviewDate)}</p>
                  {plan.recoveryGoals ? (
                    <p className="rounded-2xl bg-matcha-50 p-3 text-matcha-900">
                      {plan.recoveryGoals}
                    </p>
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
