import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ClipboardCheck,
  HeartPulse,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/care/metric-card";
import { PatientCard } from "@/components/care/patient-card";
import { StatusBanner } from "@/components/care/status-banner";
import { TaskRow } from "@/components/care/task-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  findMariaGonzalez,
  loadCareSnapshot,
} from "@/lib/meridian/care-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const snapshot = await loadCareSnapshot();
  const maria = findMariaGonzalez(snapshot.patients);
  const spotlightTasks = snapshot.tasks.slice(0, 3);
  const spotlightPatients = snapshot.patients.slice(0, 3);

  return (
    <AppShell sourceLabel={snapshot.source === "meridian" ? "Meridian" : "Demo"}>
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
              Review patient health at a glance, open María González&apos;s profile,
              and move through related care tasks — powered by your Meridian tenant
              as the source of truth.
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
                Tenant: carecircle-ci-rculo-de-cuidado-5fbd81
              </p>
            </CardContent>
          </Card>
        </section>

        <StatusBanner
          source={snapshot.source}
          connected={snapshot.connected}
          warnings={snapshot.warnings}
          patientObject={snapshot.patientObject}
          taskObject={snapshot.taskObject}
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Patients"
            labelEs="Pacientes"
            value={snapshot.metrics.patients}
            hint="From Meridian records"
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
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>
                Patients · Pacientes
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/patients">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              {spotlightPatients.length === 0 ? (
                <p className="text-sm text-ink-500">
                  No patient records returned by Meridian yet.
                </p>
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
                <p className="text-sm text-ink-500">
                  No care-task object exposed or no rows returned.
                </p>
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
