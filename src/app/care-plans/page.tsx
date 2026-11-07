import { AppShell } from "@/components/layout/app-shell";
import { StatusBanner } from "@/components/care/status-banner";
import { EmptyState } from "@/components/care/empty-state";
import { CreateCarePlanForm } from "@/components/care/create-care-plan-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolvePatientLabel } from "@/lib/meridian/care-data";
import {
  activeCareCoordinators,
  loadAuthorizedCareView,
} from "@/lib/meridian/authorized-care";
import { getSessionUser } from "@/lib/auth";
import { getPageViewer } from "@/lib/viewer";
import { formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CarePlansPage() {
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

  const coordinators = activeCareCoordinators(view);
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
            Care Plans · Planes de Cuidado
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            {view.scope === "patient"
              ? "My care plans"
              : "Loved ones' care plans"}
          </h1>
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

        {patientOptions.length === 0 ? (
          <EmptyState
            title="No authorized patient for a care plan"
            titleEs="Sin paciente autorizado"
            detail={
              view.scope === "family_caregiver"
                ? "An Active Care Circle membership is required before creating a care plan."
                : "Link your patient profile first."
            }
          />
        ) : coordinators.length === 0 ? (
          <EmptyState
            title="No Active Care Coordinator available"
            titleEs="Sin coordinador activo"
            detail="Care plans require an Active Care Coordinator in Meridian. Ask a tenant admin to create or activate a Care Coordinator caregiver, then retry. Ordinary family caregivers cannot be assigned as coordinators."
          />
        ) : (
          <CreateCarePlanForm
            patients={patientOptions}
            coordinators={coordinators.map((c) => ({
              value: c.businessId || c.id,
              label: `${c.name}${c.businessId ? ` (${c.businessId})` : ""}`,
            }))}
          />
        )}

        {view.carePlans.length === 0 ? (
          <EmptyState
            title="No care plans for your account"
            titleEs="Sin planes para tu cuenta"
            detail="Authorized Meridian care plans will appear here."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {view.carePlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base">
                    {resolvePatientLabel(
                      view.rawSnapshot.patients,
                      plan.patientRef,
                    ) ||
                      plan.patientRef ||
                      plan.businessId}
                  </CardTitle>
                  <Badge variant="matcha">{plan.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-ink-600">
                  <p>{plan.recoveryGoals || "—"}</p>
                  <p>
                    Start {formatDate(plan.startDate)} · Review{" "}
                    {formatDate(plan.reviewDate)}
                  </p>
                  <p>Coordinator: {plan.assignedCoordinator || "—"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
