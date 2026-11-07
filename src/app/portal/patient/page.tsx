import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/care/metric-card";
import { TaskRow } from "@/components/care/task-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import {
  resolveCaregiverLabel,
  resolvePatientLabel,
} from "@/lib/meridian/care-data";
import { loadAuthorizedCareView } from "@/lib/meridian/authorized-care";
import { getPageViewer } from "@/lib/viewer";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { CalendarDays, ClipboardList, HeartPulse, Bell } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PatientPortalPage() {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const viewer = await getPageViewer();
  const profile = await getSessionUser();
  if (!profile) redirect("/login");
  if (profile.accountType !== "patient") redirect("/");

  const view = await loadAuthorizedCareView({
    id: profile.id,
    accountType: profile.accountType,
    meridianPatientId: profile.meridianPatientId,
    meridianPatientBusinessId: profile.meridianPatientBusinessId,
    meridianCaregiverId: profile.meridianCaregiverId,
    meridianCaregiverBusinessId: profile.meridianCaregiverBusinessId,
  });

  const patient = view.patients[0];
  const tasks = view.tasks.slice(0, 5).map((task) => ({
    ...task,
    patientName: resolvePatientLabel(view.rawSnapshot.patients, task.patientRef),
    assignee: resolveCaregiverLabel(
      view.rawSnapshot.caregivers,
      task.assigneeRef,
    ),
  }));
  const journeyPatient =
    patient?.businessId || patient?.id || profile.meridianPatientBusinessId;

  return (
    <AppShell
      locale={locale}
      sourceLabel={view.source === "meridian" ? "Meridian" : "Unavailable"}
      viewerName={viewer.verified ? viewer.name : undefined}
      showLogout
      accountType="patient"
      accountRole="Patient"
    >
      <div className="space-y-6 animate-fadeUp">
        <div className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-white via-strawberry-50 to-matcha-50 p-8 shadow-card">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
            {locale === "es" ? "Portal del paciente" : "Patient portal"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            {locale === "es" ? "Hola" : "Hello"},{" "}
            {patient?.name || profile.firstName || "—"}
          </h1>
          <p className="mt-2 text-ink-600">
            Care status: <strong>{patient?.status || "—"}</strong>
          </p>
          {!profile.meridianPatientId ? (
            <p className="mt-2 text-xs text-ink-500">
              {locale === "es"
                ? "Completa el onboarding de paciente para ver tus registros Meridian."
                : "Complete patient onboarding to see your Meridian records."}
            </p>
          ) : null}
        </div>

        {view.authError || view.loadingError ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {view.authError?.detail ||
              view.loadingError ||
              "Could not load Meridian care data."}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Active Care Plan"
              labelEs="Plan activo"
              value={view.metrics.activeCarePlans}
              icon={HeartPulse}
              tone="matcha"
            />
            <MetricCard
              label="Appointments"
              labelEs="Citas"
              value={view.appointments.length}
              icon={CalendarDays}
              tone="strawberry"
            />
            <MetricCard
              label="Tasks"
              labelEs="Tareas"
              value={view.tasks.length}
              icon={ClipboardList}
              tone="matcha"
            />
            <MetricCard
              label="Care Circle"
              labelEs="Círculo"
              value={view.memberships.length}
              icon={Bell}
              tone="strawberry"
            />
          </div>
        )}

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
            <Link
              href={
                journeyPatient
                  ? `/care-journey?patient=${encodeURIComponent(journeyPatient)}`
                  : "/care-journey"
              }
            >
              {t.careJourney}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/account">{t.account}</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.myTasks}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-ink-500">No authorized tasks yet</p>
            ) : (
              tasks.map((task) => <TaskRow key={task.id} task={task} />)
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
