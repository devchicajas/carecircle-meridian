import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  ClipboardCheck,
  HeartPulse,
  Pill,
  Users,
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
  findMariaGonzalez,
  loadCareSnapshot,
} from "@/lib/meridian/care-data";
import { getPageViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const viewer = await getPageViewer();
  const snapshot = await loadCareSnapshot();
  const maria = findMariaGonzalez(snapshot.patients);
  const spotlightTasks = snapshot.tasks.slice(0, 3);
  const spotlightPatients = snapshot.patients.slice(0, 3);

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
      <div className="space-y-8 animate-fadeUp">
        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-white via-strawberry-50 to-matcha-50 p-8 shadow-card">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
              Caregiver Dashboard · Panel del Cuidador
            </p>
            <h1 className="mt-3 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              Calm clarity for every care circle.
            </h1>
            <p className="mt-3 max-w-2xl text-base text-ink-600">
              Live Meridian records power this overview — patients, tasks,
              appointments, and alerts in one bilingual command center.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/patients">
                  Patient directory / Directorio
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {maria ? (
                <Button asChild variant="outline" size="lg">
                  <Link href={`/patients/${encodeURIComponent(maria.id)}`}>
                    Open María González
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          <Card className="bg-ink-900 text-white">
            <CardHeader>
              <CardTitle className="text-white">Demo path</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-white/80">
              <p>1. Dashboard overview</p>
              <p>2. Patient directory with search</p>
              <p>3. María González profile</p>
              <p>4. Related care task</p>
              <p className="pt-2 text-xs text-white/60">
                Tenant: carecircle-ci-rculo-de-cuidado-5fbd81 · read-only
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Patients"
            labelEs="Pacientes"
            value={snapshot.metrics.patients}
            hint="Meridian · patient"
            icon={Users}
            tone="strawberry"
          />
          <MetricCard
            label="Active care"
            labelEs="Cuidado activo"
            value={snapshot.metrics.activePatients}
            icon={HeartPulse}
            tone="matcha"
          />
          <MetricCard
            label="Open tasks"
            labelEs="Tareas abiertas"
            value={snapshot.metrics.openTasks}
            icon={Activity}
            tone="ink"
          />
          <MetricCard
            label="Completed"
            labelEs="Completadas"
            value={snapshot.metrics.completedTasks}
            icon={ClipboardCheck}
            tone="matcha"
          />
          <MetricCard
            label="Appointments"
            labelEs="Citas"
            value={snapshot.metrics.upcomingAppointments}
            icon={CalendarDays}
            tone="strawberry"
          />
          <MetricCard
            label="Medications"
            labelEs="Medicamentos"
            value={snapshot.metrics.medications}
            icon={Pill}
            tone="matcha"
          />
          <MetricCard
            label="Alerts"
            labelEs="Avisos"
            value={snapshot.metrics.unreadNotifications}
            icon={Bell}
            tone="ink"
          />
          <MetricCard
            label="Needs attention"
            labelEs="Urgente"
            value={snapshot.metrics.needsAttention}
            icon={HeartPulse}
            tone="strawberry"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Patients · Pacientes</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/patients">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              {spotlightPatients.length === 0 ? (
                <EmptyState
                  title="No patient records yet"
                  titleEs="Sin pacientes"
                  detail="Waiting for Meridian patient rows from the exposed patient object."
                />
              ) : (
                spotlightPatients.map((patient) => (
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
                  title="No care tasks yet"
                  titleEs="Sin tareas"
                  detail="Waiting for Meridian careTask rows."
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
