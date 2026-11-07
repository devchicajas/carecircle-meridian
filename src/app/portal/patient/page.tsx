import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/care/metric-card";
import { TaskRow } from "@/components/care/task-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAccountProfile } from "@/lib/account/session";
import {
  loadCareSnapshot,
  resolveCaregiverLabel,
  resolvePatientLabel,
} from "@/lib/meridian/care-data";
import { getPageViewer } from "@/lib/viewer";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { CalendarDays, ClipboardList, HeartPulse, Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PatientPortalPage() {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const viewer = await getPageViewer();
  const profile = await getAccountProfile();
  const snapshot = await loadCareSnapshot();

  const patientId =
    profile?.meridianPatientBusinessId ||
    profile?.meridianPatientId ||
    snapshot.patients.find((p) => /mar[ií]a/i.test(p.name))?.businessId;

  const patient = snapshot.patients.find(
    (p) => p.businessId === patientId || p.id === patientId,
  );
  const plans = snapshot.carePlans.filter(
    (p) =>
      p.patientRef === patient?.businessId || p.patientRef === patient?.id,
  );
  const appts = snapshot.appointments.filter(
    (a) =>
      a.patientRef === patient?.businessId || a.patientRef === patient?.id,
  );
  const tasks = snapshot.tasks
    .filter(
      (task) =>
        task.patientRef === patient?.businessId ||
        task.patientRef === patient?.id,
    )
    .slice(0, 5)
    .map((task) => ({
      ...task,
      patientName: resolvePatientLabel(snapshot.patients, task.patientRef),
      assignee: resolveCaregiverLabel(snapshot.caregivers, task.assigneeRef),
    }));
  const memberships = snapshot.memberships.filter(
    (m) =>
      m.patientRef === patient?.businessId || m.patientRef === patient?.id,
  );

  return (
    <AppShell
      locale={locale}
      sourceLabel={snapshot.source === "meridian" ? "Meridian" : "Unavailable"}
      viewerName={viewer.verified ? viewer.name : undefined}
    >
      <div className="space-y-6 animate-fadeUp">
        <div className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-white via-strawberry-50 to-matcha-50 p-8 shadow-card">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
            {locale === "es" ? "Portal del paciente" : "Patient portal"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            {locale === "es" ? "Hola" : "Hello"},{" "}
            {patient?.name || profile?.firstName || "—"}
          </h1>
          <p className="mt-2 text-ink-600">
            Care status: <strong>{patient?.status || "—"}</strong>
          </p>
          {!profile?.meridianPatientId ? (
            <p className="mt-2 text-xs text-ink-500">
              Showing María González demo filter until your Patient record is
              linked via onboarding.
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Active Care Plan"
            labelEs="Plan activo"
            value={plans.filter((p) => /active/i.test(p.status)).length}
            icon={HeartPulse}
            tone="matcha"
          />
          <MetricCard
            label="Appointments"
            labelEs="Citas"
            value={appts.length}
            icon={CalendarDays}
            tone="strawberry"
          />
          <MetricCard
            label="Tasks"
            labelEs="Tareas"
            value={tasks.length}
            icon={ClipboardList}
            tone="matcha"
          />
          <MetricCard
            label="Care Circle"
            labelEs="Círculo"
            value={memberships.length}
            icon={Bell}
            tone="strawberry"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="soft">
            <Link href="/care-plans">{t.carePlan}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/appointments">{t.appointments}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/medications">{t.medications}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/tasks">{t.myTasks}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/care-circle">{t.careCircle}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/care-journey?patient=PAT-001">{t.careJourney}</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.myTasks}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-ink-500">No tasks</p>
            ) : (
              tasks.map((task) => <TaskRow key={task.id} task={task} />)
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
