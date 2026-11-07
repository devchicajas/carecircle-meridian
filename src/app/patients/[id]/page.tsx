import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  HeartPulse,
  Languages,
  Mail,
  Phone,
  StickyNote,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBanner } from "@/components/care/status-banner";
import { TaskRow } from "@/components/care/task-row";
import { EmptyState } from "@/components/care/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPatientById } from "@/lib/meridian/care-data";
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
    carePlans,
    appointments,
    medications,
    notifications,
  } = await getPatientById(decodeURIComponent(id));

  if (!patient) notFound();

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
                    Patient profile · Perfil del paciente
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="matcha">{patient.status}</Badge>
                {patient.language ? (
                  <Badge variant="outline">{patient.language}</Badge>
                ) : null}
                {patient.condition ? (
                  <Badge variant="default">{patient.condition}</Badge>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {patient.caregiver ? (
                  <InfoChip
                    icon={<UserRound className="h-4 w-4" />}
                    label="Caregiver / Cuidador"
                    value={patient.caregiver}
                  />
                ) : null}
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
                {patient.emergencyContactName ? (
                  <InfoChip
                    icon={<HeartPulse className="h-4 w-4" />}
                    label="Emergency contact"
                    value={`${patient.emergencyContactName}${patient.emergencyContactPhone ? ` · ${patient.emergencyContactPhone}` : ""}`}
                  />
                ) : null}
                {patient.updatedAt ? (
                  <InfoChip
                    icon={<CalendarClock className="h-4 w-4" />}
                    label="Updated / Actualizado"
                    value={formatDate(patient.updatedAt)}
                  />
                ) : null}
              </div>

              {patient.notes ? (
                <div className="rounded-2xl bg-matcha-50 p-4 text-sm text-matcha-900">
                  <div className="mb-1 flex items-center gap-2 font-medium">
                    <StickyNote className="h-4 w-4" />
                    Care notes · Notas
                  </div>
                  {patient.notes}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <LinkedSection title="Care tasks · Tareas">
              {tasks.length === 0 ? (
                <EmptyState title="No linked tasks" titleEs="Sin tareas" />
              ) : (
                tasks.map((task) => <TaskRow key={task.id} task={task} />)
              )}
            </LinkedSection>
            <LinkedSection title="Caregivers · Cuidadores">
              {caregivers.length === 0 ? (
                <p className="text-sm text-ink-500">No linked caregivers.</p>
              ) : (
                caregivers.map((c) => (
                  <p key={c.id} className="text-sm text-ink-700">
                    {c.name}
                    {c.role ? ` · ${c.role}` : ""}
                    {c.relationship ? ` · ${c.relationship}` : ""}
                  </p>
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
                    {[m.dosage, m.frequency].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
              ))
            )}
          </LinkedSection>
        </section>

        {notifications.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Related alerts · Avisos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {notifications.map((n) => (
                <div key={n.id} className="rounded-2xl border border-ink-50 p-3 text-sm">
                  <div className="font-medium">{n.message}</div>
                  <div className="text-xs text-ink-500">{n.status}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {snapshot.source === "meridian" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Raw Meridian fields</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-2xl bg-ink-950 p-4 text-xs text-matcha-100">
                {JSON.stringify(patient.raw, null, 2)}
              </pre>
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
