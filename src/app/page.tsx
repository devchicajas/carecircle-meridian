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
  resolveCaregiverLabel,
  resolvePatientLabel,
} from "@/lib/meridian/care-data";
import { loadAuthorizedCareView } from "@/lib/meridian/authorized-care";
import { getSessionUser } from "@/lib/auth";
import { getPageViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const viewer = await getPageViewer();
  const profile = await getSessionUser();
  const view = await loadAuthorizedCareView(
    profile
      ? {
          id: profile.id,
          accountType: profile.accountType,
          meridianPatientId: profile.meridianPatientId,
          meridianPatientBusinessId: profile.meridianPatientBusinessId,
          meridianCaregiverId: profile.meridianCaregiverId,
          meridianCaregiverBusinessId: profile.meridianCaregiverBusinessId,
        }
      : null,
  );

  const isCaregiver = view.scope === "family_caregiver";
  const isPatient = view.scope === "patient";
  const metricsFailed = Boolean(view.authError || view.loadingError);

  const spotlightTasks = view.tasks.slice(0, 3).map((task) => ({
    ...task,
    patientName: resolvePatientLabel(view.rawSnapshot.patients, task.patientRef),
    assignee: resolveCaregiverLabel(
      view.rawSnapshot.caregivers,
      task.assigneeRef,
    ),
  }));
  const spotlightPeople = view.patients.slice(0, 3);

  return (
    <AppShell
      sourceLabel={view.source === "meridian" ? "Meridian" : "Unavailable"}
      viewerName={viewer.verified ? viewer.name : undefined}
      showLogout={viewer.verified}
      accountType={viewer.accountType}
      accountRole={
        isPatient
          ? "Patient"
          : isCaregiver
            ? "Family Caregiver"
            : undefined
      }
    >
      <div className="space-y-8 animate-fadeUp">
        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-white via-strawberry-50 to-matcha-50 p-8 shadow-card">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
              {isPatient
                ? "Patient home · Inicio del paciente"
                : isCaregiver
                  ? "Caregiver home · Inicio del cuidador"
                  : "CareCircle · Círculo de Cuidado"}
            </p>
            <h1 className="mt-3 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              {viewer.verified
                ? `Welcome, ${viewer.name}`
                : "Better Care, Together."}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-ink-600">
              {isCaregiver
                ? "Follow only the people you are authorized to support through Care Circle."
                : isPatient
                  ? "Your appointments, care plans, and tasks — only your own Meridian records."
                  : "Sign in to see care records authorized for your account."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {viewer.verified ? (
                <Button asChild size="lg">
                  <Link href={isPatient ? "/appointments" : "/patients"}>
                    {isPatient ? "My appointments" : "My loved ones"}
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
              ) : (
                <Button asChild variant="outline" size="lg">
                  <Link href="/tasks">Care tasks</Link>
                </Button>
              )}
            </div>
          </div>

          <Card className="bg-ink-900 text-white">
            <CardHeader>
              <CardTitle className="text-white">Your account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-white/80">
              {viewer.verified ? (
                <>
                  <p>
                    Role:{" "}
                    <strong>
                      {isPatient
                        ? "Patient"
                        : isCaregiver
                          ? "Family Caregiver"
                          : "Signed in"}
                    </strong>
                  </p>
                  <p>
                    Linked Meridian ID:{" "}
                    {isPatient
                      ? profile?.meridianPatientBusinessId ||
                        profile?.meridianPatientId ||
                        "Not linked"
                      : profile?.meridianCaregiverBusinessId ||
                        profile?.meridianCaregiverId ||
                        "Not linked"}
                  </p>
                  <p>
                    Authorized{" "}
                    {isPatient ? "appointments" : "loved ones"}:{" "}
                    {isPatient
                      ? view.metrics.upcomingAppointments
                      : view.patients.length}
                  </p>
                </>
              ) : (
                <>
                  <p>1. Sign up with email + password</p>
                  <p>2. Create or claim your Meridian profile</p>
                  <p>3. View only your authorized care records</p>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        <StatusBanner
          source={view.source}
          connected={view.connected}
          warnings={view.warnings}
          authError={view.authError}
          loadingError={view.loadingError}
          patientObject={view.patientObject}
          taskObject={view.taskObject}
        />

        {metricsFailed ? (
          <EmptyState
            title="Could not load dashboard metrics"
            titleEs="No se pudieron cargar las métricas"
            detail={
              view.authError?.detail ||
              view.loadingError ||
              "Meridian request failed. Counts are hidden so a failed load is not shown as zero."
            }
          />
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label={isCaregiver ? "Loved ones" : "My care profile"}
              labelEs={isCaregiver ? "Seres queridos" : "Mi perfil"}
              value={view.metrics.patients}
              hint={
                isCaregiver
                  ? "Active Care Circle only"
                  : "Your linked patient"
              }
              icon={Heart}
              tone="strawberry"
            />
            <MetricCard
              label="Active Care Plans"
              labelEs="Planes activos"
              value={view.metrics.activeCarePlans}
              icon={HeartPulse}
              tone="matcha"
            />
            <MetricCard
              label="Upcoming Appointments"
              labelEs="Próximas citas"
              value={view.metrics.upcomingAppointments}
              icon={CalendarDays}
              tone="ink"
            />
            <MetricCard
              label="Pending Tasks"
              labelEs="Tareas pendientes"
              value={view.metrics.pendingTasks}
              icon={ClipboardList}
              tone="strawberry"
            />
            <MetricCard
              label="Overdue Tasks"
              labelEs="Vencidas"
              value={view.metrics.overdueTasks}
              icon={Activity}
              tone="ink"
            />
            <MetricCard
              label="Unread Notifications"
              labelEs="Avisos"
              value={view.metrics.unreadNotifications}
              icon={Bell}
              tone="matcha"
            />
            <MetricCard
              label="Open tasks"
              labelEs="Abiertas"
              value={view.metrics.openTasks}
              icon={ClipboardCheck}
              tone="matcha"
            />
            <MetricCard
              label="Completed"
              labelEs="Completadas"
              value={view.metrics.completedTasks}
              icon={ClipboardCheck}
              tone="strawberry"
            />
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>
                {isCaregiver
                  ? "My loved ones · Seres queridos"
                  : isPatient
                    ? "My profile · Mi perfil"
                    : "Care records"}
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
                  title="Sign in to see your care data"
                  titleEs="Inicia sesión"
                  detail="Authorized Meridian records appear after login."
                />
              ) : spotlightPeople.length === 0 ? (
                <EmptyState
                  title={
                    isCaregiver
                      ? "No authorized loved ones yet"
                      : "No linked patient profile"
                  }
                  titleEs={
                    isCaregiver
                      ? "Sin seres queridos autorizados"
                      : "Sin perfil vinculado"
                  }
                  detail={
                    isCaregiver
                      ? "Add a loved one or wait for an Active Care Circle membership."
                      : "Complete patient onboarding or claim your existing profile."
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
                  title="No authorized care tasks"
                  titleEs="Sin tareas autorizadas"
                  detail="Tasks for your authorized patients will appear here."
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
