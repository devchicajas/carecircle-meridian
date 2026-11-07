import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  HeartPulse,
  Heart,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/care/metric-card";
import { PatientCard } from "@/components/care/patient-card";
import { StatusBanner } from "@/components/care/status-banner";
import { TaskRow } from "@/components/care/task-row";
import { EmptyState } from "@/components/care/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  loadCareSnapshot,
  lovedOnesForCaregiver,
  resolveCaregiverLabel,
  resolvePatientLabel,
} from "@/lib/meridian/care-data";
import { getPageViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const viewer = await getPageViewer();
  const snapshot = await loadCareSnapshot();
  const isCaregiver =
    viewer.verified && viewer.accountType === "family_caregiver";
  const isPatient = viewer.verified && viewer.accountType === "patient";

  const lovedOnes = isCaregiver
    ? lovedOnesForCaregiver(snapshot, [
        viewer.meridianCaregiverId,
        viewer.meridianCaregiverBusinessId,
      ])
    : isPatient
      ? snapshot.patients.filter(
          (p) =>
            p.id === viewer.meridianPatientId ||
            p.businessId === viewer.meridianPatientBusinessId,
        )
      : [];

  const lovedOneIds = new Set(lovedOnes.map((p) => p.id));
  const spotlightTasks = snapshot.tasks
    .filter((task) => {
      if (!viewer.verified) return false;
      if (isCaregiver) {
        if (lovedOnes.length === 0) return false;
        return lovedOnes.some(
          (p) =>
            task.patientRef === p.id ||
            task.patientRef === p.businessId ||
            task.patientRef === p.name,
        );
      }
      return true;
    })
    .slice(0, 3)
    .map((task) => ({
      ...task,
      patientName: resolvePatientLabel(snapshot.patients, task.patientRef),
      assignee: resolveCaregiverLabel(snapshot.caregivers, task.assigneeRef),
    }));

  const spotlightPeople = lovedOnes.slice(0, 3);

  return (
    <AppShell
      sourceLabel={snapshot.source === "meridian" ? "Meridian" : "Unavailable"}
      viewerName={viewer.verified ? viewer.name : undefined}
      showLogout={viewer.verified}
      accountType={viewer.accountType}
    >
      <div className="space-y-8 animate-fadeUp">
        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-white via-strawberry-50 to-matcha-50 p-8 shadow-card">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
              {isPatient
                ? "Patient portal · Portal del paciente"
                : "Caregiver home · Inicio del cuidador"}
            </p>
            <h1 className="mt-3 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              Better Care, Together.
            </h1>
            <p className="mt-3 max-w-2xl text-base text-ink-600">
              {isCaregiver
                ? "Follow the people you care for — appointments, tasks, and care plans from your Care Circle."
                : isPatient
                  ? "See your care plan, appointments, and updates in one place."
                  : "Keep your loved ones' appointments, responsibilities, and care plans organized in one place."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {viewer.verified ? (
                <Button asChild size="lg">
                  <Link href={isPatient ? "/portal/patient" : "/patients"}>
                    {isPatient ? "Open my care" : "My loved ones"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link href="/signup">
                    Sign up
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              {!viewer.verified ? (
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">Log in</Link>
                </Button>
              ) : null}
              {viewer.verified ? (
                <Button asChild variant="outline" size="lg">
                  <Link href="/tasks">Care tasks</Link>
                </Button>
              ) : null}
              {viewer.verified && isCaregiver ? (
                <Button asChild variant="soft" size="lg">
                  <Link href="/care-circle">Care Circle</Link>
                </Button>
              ) : null}
            </div>
          </div>

          <Card className="bg-ink-900 text-white">
            <CardHeader>
              <CardTitle className="text-white">
                {isCaregiver ? "Your path" : "Getting started"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-white/80">
              {isCaregiver ? (
                <>
                  <p>1. Finish Family Caregiver onboarding</p>
                  <p>2. Join a Care Circle for someone you support</p>
                  <p>3. Track their tasks, visits, and care plan</p>
                  <p>4. Keep Meridian records in sync</p>
                </>
              ) : (
                <>
                  <p>1. Sign up with email + password</p>
                  <p>2. Complete your CareCircle profile</p>
                  <p>3. Open your dashboard</p>
                  <p>4. Review live Meridian care records</p>
                </>
              )}
              <p className="pt-2 text-xs text-white/60">
                Synthetic data only · Live Meridian backend
              </p>
            </CardContent>
          </Card>
        </section>

        <StatusBanner
          source={snapshot.source}
          connected={snapshot.connected}
          warnings={snapshot.warnings}
          authError={snapshot.authError}
          loadingError={snapshot.loadingError}
          patientObject={snapshot.patientObject}
          taskObject={snapshot.taskObject}
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label={isCaregiver ? "Loved ones I'm supporting" : "My care profile"}
            labelEs={isCaregiver ? "Seres queridos" : "Mi perfil"}
            value={
              viewer.verified
                ? lovedOnes.length
                : snapshot.metrics.patients
            }
            hint={isCaregiver ? "From your Care Circle" : "Meridian · patient"}
            icon={Heart}
            tone="strawberry"
          />
          <MetricCard
            label="Active Care Plans"
            labelEs="Planes activos"
            value={snapshot.metrics.activeCarePlans}
            icon={HeartPulse}
            tone="matcha"
          />
          <MetricCard
            label="Upcoming Appointments"
            labelEs="Próximas citas"
            value={snapshot.metrics.upcomingAppointments}
            icon={CalendarDays}
            tone="ink"
          />
          <MetricCard
            label="Pending Tasks"
            labelEs="Tareas pendientes"
            value={snapshot.metrics.pendingTasks}
            icon={ClipboardList}
            tone="strawberry"
          />
          <MetricCard
            label="Overdue Tasks"
            labelEs="Vencidas"
            value={snapshot.metrics.overdueTasks}
            icon={Activity}
            tone="ink"
          />
          <MetricCard
            label="Unread Notifications"
            labelEs="Avisos"
            value={snapshot.metrics.unreadNotifications}
            icon={Bell}
            tone="matcha"
          />
          <MetricCard
            label="Open tasks"
            labelEs="Abiertas"
            value={snapshot.metrics.openTasks}
            icon={ClipboardCheck}
            tone="matcha"
          />
          <MetricCard
            label="Completed"
            labelEs="Completadas"
            value={snapshot.metrics.completedTasks}
            icon={ClipboardCheck}
            tone="strawberry"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>
                {isCaregiver
                  ? "My loved ones · Seres queridos"
                  : "Care records · Registros"}
              </CardTitle>
              {isCaregiver ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/patients">View all</Link>
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="grid gap-4">
              {!viewer.verified ? (
                <EmptyState
                  title="Sign in to see your circle"
                  titleEs="Inicia sesión"
                  detail="Family caregivers see people linked through Care Circle — not a clinic-wide patient directory."
                />
              ) : spotlightPeople.length === 0 ? (
                <EmptyState
                  title={
                    isCaregiver
                      ? "No loved ones linked yet"
                      : "No care profile linked yet"
                  }
                  titleEs={
                    isCaregiver
                      ? "Sin seres queridos vinculados"
                      : "Sin perfil vinculado"
                  }
                  detail={
                    isCaregiver
                      ? "Join a Care Circle membership for someone you support. CareCircle will not show every patient in the tenant."
                      : "Finish patient onboarding to link your Meridian profile."
                  }
                />
              ) : (
                spotlightPeople.map((patient) => (
                  <PatientCard key={patient.id} patient={patient} />
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Care tasks · Tareas</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/tasks">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {spotlightTasks.length === 0 ? (
                <EmptyState
                  title="No care tasks in your circle yet"
                  titleEs="Sin tareas en tu círculo"
                  detail={
                    isCaregiver && lovedOneIds.size === 0
                      ? "Tasks appear after a loved one is linked in Care Circle."
                      : "Waiting for Meridian careTask rows for your circle."
                  }
                />
              ) : (
                spotlightTasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
