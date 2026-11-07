import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  HeartPulse,
  Languages,
  Mail,
  Phone,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBanner } from "@/components/care/status-banner";
import { TaskRow } from "@/components/care/task-row";
import { EmptyState } from "@/components/care/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPatientById,
  resolveCaregiverLabel,
} from "@/lib/meridian/care-data";
import { getPageViewer } from "@/lib/viewer";
import { formatDate, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await getPageViewer();
  const { id } = await params;
  const {
    snapshot,
    patient,
    tasks,
    caregivers,
    memberships,
    carePlans,
    appointments,
    medications,
    notifications,
  } = await getPatientById(decodeURIComponent(id));

  if (!patient) notFound();

  const journey = [
    ...appointments.map((a) => ({
      at: a.dateTime,
      label: `Appointment · ${a.type || "Visit"}`,
      detail: a.provider || a.location || a.status,
    })),
    ...tasks.map((t) => ({
      at: t.dueAt || t.completedOn,
      label: `Task · ${t.title}`,
      detail: t.status,
    })),
    ...carePlans.map((p) => ({
      at: p.startDate,
      label: `Care plan · ${p.status}`,
      detail: p.recoveryGoals?.slice(0, 120),
    })),
  ]
    .filter((e) => e.at)
    .sort((a, b) => String(a.at).localeCompare(String(b.at)));

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
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/patients">
            <ArrowLeft className="h-4 w-4" />
            Back to directory / Volver
          </Link>
        </Button>

        <StatusBanner
          source={snapshot.source}
          connected={snapshot.connected}
          warnings={snapshot.warnings}
          authError={snapshot.authError}
          loadingError={snapshot.loadingError}
          patientObject={snapshot.patientObject}
          taskObject={snapshot.taskObject}
        />

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-strawberry-400 via-strawberry-300 to-matcha-400" />
            <CardContent className="-mt-10 space-y-5 p-6">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-white bg-ink-900 text-xl font-semibold text-white shadow-soft">
                  {initials(patient.name)}
                </div>
                <div className="pb-1">
                  <h1 className="text-3xl font-semibold tracking-tight text-ink-900">
                    {patient.name}
                  </h1>
                  <p className="text-sm text-ink-500">
                    {patient.businessId} · Patient profile · Perfil
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="matcha">{patient.status}</Badge>
                {patient.language ? (
                  <Badge variant="outline">{patient.language}</Badge>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {patient.phone ? (
                  <InfoChip
                    icon={<Phone className="h-4 w-4" />}
                    label="Phone / Teléfono"
                    value={patient.phone}
                  />
                ) : null}
                {patient.email ? (
                  <InfoChip
                    icon={<Mail className="h-4 w-4" />}
                    label="Email"
                    value={patient.email}
                  />
                ) : null}
                {patient.language ? (
                  <InfoChip
                    icon={<Languages className="h-4 w-4" />}
                    label="Language / Idioma"
                    value={patient.language}
                  />
                ) : null}
                {patient.careStartDate ? (
                  <InfoChip
                    icon={<CalendarClock className="h-4 w-4" />}
                    label="Care start / Inicio"
                    value={formatDate(patient.careStartDate)}
                  />
                ) : null}
                {patient.dateOfBirth ? (
                  <InfoChip
                    icon={<HeartPulse className="h-4 w-4" />}
                    label="Date of birth"
                    value={formatDate(patient.dateOfBirth)}
                  />
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <LinkedSection title="Care Circle · Círculo">
              {memberships.length === 0 ? (
                <p className="text-sm text-ink-500">No memberships linked.</p>
              ) : (
                memberships.map((m) => (
                  <div key={m.id} className="rounded-2xl bg-white/70 p-3 text-sm">
                    <div className="font-medium">
                      {resolveCaregiverLabel(
                        caregivers.length ? caregivers : snapshot.caregivers,
                        m.caregiverRef,
                      ) || m.caregiverRef}
                    </div>
                    <div className="text-ink-500">
                      {m.relationshipType || "Member"} · {m.status}
                    </div>
                  </div>
                ))
              )}
            </LinkedSection>

            <LinkedSection title="Care tasks · Tareas">
              {tasks.length === 0 ? (
                <EmptyState title="No linked tasks" titleEs="Sin tareas" />
              ) : (
                tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={{
                      ...task,
                      patientName: patient.name,
                      assignee: resolveCaregiverLabel(
                        snapshot.caregivers,
                        task.assigneeRef,
                      ),
                    }}
                  />
                ))
              )}
            </LinkedSection>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <LinkedSection title="Care plans · Planes">
            {carePlans.length === 0 ? (
              <p className="text-sm text-ink-500">None linked.</p>
            ) : (
              carePlans.map((plan) => (
                <div key={plan.id} className="rounded-2xl bg-white/70 p-3 text-sm">
                  <div className="font-medium">{plan.status}</div>
                  <div className="text-ink-500">
                    {plan.assignedCoordinator || "Unassigned"}
                  </div>
                  {plan.recoveryGoals ? (
                    <p className="mt-2 text-xs text-ink-600">
                      {plan.recoveryGoals}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </LinkedSection>
          <LinkedSection title="Appointments · Citas">
            {appointments.length === 0 ? (
              <p className="text-sm text-ink-500">None linked.</p>
            ) : (
              appointments.map((a) => (
                <div key={a.id} className="rounded-2xl bg-white/70 p-3 text-sm">
                  <div className="font-medium">{a.type || "Appointment"}</div>
                  <div className="text-ink-500">
                    {a.provider || "—"} · {formatDate(a.dateTime)}
                  </div>
                </div>
              ))
            )}
          </LinkedSection>
          <LinkedSection title="Medications · Medicamentos">
            {medications.length === 0 ? (
              <p className="text-sm text-ink-500">None linked.</p>
            ) : (
              medications.map((m) => (
                <div key={m.id} className="rounded-2xl bg-white/70 p-3 text-sm">
                  <div className="font-medium">{m.name}</div>
                  <div className="text-ink-500">
                    {[m.frequency, m.instructions].filter(Boolean).join(" · ") ||
                      "—"}
                  </div>
                </div>
              ))
            )}
          </LinkedSection>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Care Journey · Trayectoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {journey.length === 0 ? (
              <p className="text-sm text-ink-500">
                No dated care events available yet.
              </p>
            ) : (
              journey.map((event, idx) => (
                <div
                  key={`${event.label}-${idx}`}
                  className="flex gap-4 rounded-2xl border border-ink-50 bg-white/70 p-4"
                >
                  <div className="w-28 shrink-0 text-xs font-medium text-matcha-700">
                    {formatDate(event.at)}
                  </div>
                  <div>
                    <div className="font-medium text-ink-900">{event.label}</div>
                    {event.detail ? (
                      <div className="text-sm text-ink-500">{event.detail}</div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {notifications.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Related alerts · Avisos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="rounded-2xl border border-ink-50 p-3 text-sm"
                >
                  <div className="font-medium">{n.message}</div>
                  <div className="text-xs text-ink-500">{n.status}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}

function LinkedSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

function InfoChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-50 bg-white/80 p-3">
      <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-ink-400">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium text-ink-800">{value}</div>
    </div>
  );
}
