import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { EditTaskForm } from "@/components/care/edit-task-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  resolveCaregiverLabel,
  resolvePatientLabel,
} from "@/lib/meridian/care-data";
import { loadAuthorizedCareView } from "@/lib/meridian/authorized-care";
import { canMutateCareRecords } from "@/lib/care/permissions";
import { getSessionUser } from "@/lib/auth";
import { getPageViewer } from "@/lib/viewer";
import { formatDate, isActiveStatus } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({
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

  const task = view.tasks.find(
    (t) => t.id === decoded || t.businessId === decoded,
  );
  if (!task) notFound();

  const canEdit = canMutateCareRecords(profile.accountType);
  const patientOptions = view.patients.map((p) => ({
    value: p.businessId || p.id,
    label: `${p.name}${p.businessId ? ` (${p.businessId})` : ""}`,
  }));
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
        c.id === profile.meridianCaregiverId ||
        c.businessId === profile.meridianCaregiverBusinessId ||
        c.businessId === task.assigneeRef ||
        c.id === task.assigneeRef,
    )
    .map((c) => ({
      value: c.businessId || c.id,
      label: `${c.name}${c.businessId ? ` (${c.businessId})` : ""}`,
    }));
  const carePlanOptions = view.carePlans.map((p) => ({
    value: p.businessId || p.id,
    label: `${p.businessId || p.id} · ${p.status}`,
    patientRef: p.patientRef,
  }));

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
              <Link href="/tasks">← Care Tasks</Link>
            </Button>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
              Care Task detail
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink-900">
              {task.title}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {task.businessId || task.id}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="matcha">{task.status}</Badge>
            {task.priority ? <Badge variant="outline">{task.priority}</Badge> : null}
            {task.escalated ? (
              <Badge variant="default">Escalated</Badge>
            ) : null}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Task fields</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <p>
              <strong>Task ID:</strong> {task.businessId || "—"}
            </p>
            <p>
              <strong>Patient:</strong>{" "}
              {resolvePatientLabel(
                view.rawSnapshot.patients,
                task.patientRef,
              ) || task.patientRef}
            </p>
            <p>
              <strong>Care Plan:</strong> {task.carePlanRef || "—"}
            </p>
            <p>
              <strong>Assigned Caregiver:</strong>{" "}
              {resolveCaregiverLabel(
                view.rawSnapshot.caregivers,
                task.assigneeRef,
              ) ||
                task.assigneeRef ||
                "—"}
            </p>
            <p className="sm:col-span-2">
              <strong>Description:</strong> {task.title}
            </p>
            <p>
              <strong>Due Date:</strong> {formatDate(task.dueAt)}
            </p>
            <p>
              <strong>Priority:</strong> {task.priority || "—"}
            </p>
            <p>
              <strong>Status:</strong> {task.status}
            </p>
            <p>
              <strong>Completed On:</strong> {formatDate(task.completedOn)}
            </p>
            <p>
              <strong>Escalated:</strong> {task.escalated ? "Yes" : "No"}
            </p>
          </CardContent>
        </Card>

        {canEdit ? (
          <EditTaskForm
            task={task}
            patients={patientOptions}
            caregivers={caregiverOptions}
            carePlans={carePlanOptions}
          />
        ) : (
          <p className="text-sm text-ink-500">
            You can mark tasks complete from the task list when permitted.
            Full edits are reserved for Family Caregivers.
          </p>
        )}
      </div>
    </AppShell>
  );
}
