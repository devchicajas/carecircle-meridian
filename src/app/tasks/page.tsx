import { AppShell } from "@/components/layout/app-shell";
import { StatusBanner } from "@/components/care/status-banner";
import { TaskRow } from "@/components/care/task-row";
import { EmptyState } from "@/components/care/empty-state";
import { CreateTaskForm } from "@/components/care/create-task-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  resolveCaregiverLabel,
  resolvePatientLabel,
} from "@/lib/meridian/care-data";
import { loadAuthorizedCareView } from "@/lib/meridian/authorized-care";
import { canMutateCareRecords } from "@/lib/care/permissions";
import { getSessionUser } from "@/lib/auth";
import { getPageViewer } from "@/lib/viewer";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { isActiveStatus } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
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

  const tasks = view.tasks.map((task) => ({
    ...task,
    patientName: resolvePatientLabel(view.rawSnapshot.patients, task.patientRef),
    assignee: resolveCaregiverLabel(
      view.rawSnapshot.caregivers,
      task.assigneeRef,
    ),
  }));

  const patientOptions = view.patients.map((p) => ({
    value: p.businessId || p.id,
    label: `${p.name}${p.businessId ? ` (${p.businessId})` : ""}`,
  }));

  // Eligible assignees: caregivers with Active membership to authorized patients
  const eligibleCaregiverRefs = new Set(
    view.memberships
      .filter((m) => isActiveStatus(m.status))
      .map((m) => m.caregiverRef)
      .filter(Boolean) as string[],
  );
  const caregiverOptions = view.rawSnapshot.caregivers
    .filter(
      (c) =>
        eligibleCaregiverRefs.has(c.id) ||
        eligibleCaregiverRefs.has(c.businessId || "") ||
        (view.scope === "family_caregiver" &&
          (c.id === profile.meridianCaregiverId ||
            c.businessId === profile.meridianCaregiverBusinessId)),
    )
    .map((c) => ({
      value: c.businessId || c.id,
      label: `${c.name}${c.businessId ? ` (${c.businessId})` : ""}`,
    }));

  const carePlanOptions = view.carePlans.map((p) => ({
    value: p.businessId || p.id,
    label: `${p.businessId || p.id} · ${p.status} · ${
      resolvePatientLabel(view.rawSnapshot.patients, p.patientRef) ||
      p.patientRef ||
      "Patient?"
    }`,
    patientRef: p.patientRef,
  }));

  const canCreate = canMutateCareRecords(profile.accountType);
  const missingPrereqs =
    patientOptions.length === 0 ||
    carePlanOptions.length === 0 ||
    caregiverOptions.length === 0;

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
            Care Tasks · Tareas de Cuidado
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">
            {view.scope === "patient" ? "My care tasks" : "Authorized care tasks"}
          </h1>
          <p className="mt-2 max-w-2xl text-ink-600">
            Tasks require a Care Plan that belongs to the Patient and an
            Assigned Caregiver with an Active Care Circle membership. Validation
            runs on the CareCircle server before Meridian writes.
          </p>
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

        {canCreate ? (
          missingPrereqs ? (
            <>
              <EmptyState
                title="Task setup incomplete"
                titleEs="Falta configuración"
                detail={
                  patientOptions.length === 0
                    ? "No authorized patient yet. Add/activate a Care Circle membership first."
                    : carePlanOptions.length === 0
                      ? "Create an authorized Care Plan before assigning tasks."
                      : "No eligible Assigned Caregiver with Active membership for your patients."
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/care-circle">Care Circle</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/care-plans">Care Plans</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/patients/add">Add loved one</Link>
                </Button>
              </div>
            </>
          ) : (
            <CreateTaskForm
              patients={patientOptions}
              caregivers={caregiverOptions}
              carePlans={carePlanOptions}
            />
          )
        ) : (
          <p className="rounded-2xl bg-cream p-3 text-sm text-ink-600">
            Patient accounts can view tasks and mark them complete when
            permitted. Creating or fully editing tasks is available to Family
            Caregivers.
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {tasks.length} authorized task{tasks.length === 1 ? "" : "s"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 ? (
              <EmptyState
                title="No authorized tasks"
                titleEs="Sin tareas autorizadas"
                detail="Meridian careTask rows for your account will appear here."
              />
            ) : (
              tasks.map((task) => <TaskRow key={task.id} task={task} />)
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
