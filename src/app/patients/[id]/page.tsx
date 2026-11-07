import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  HeartPulse,
  Phone,
  StickyNote,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBanner } from "@/components/care/status-banner";
import { TaskRow } from "@/components/care/task-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPatientById } from "@/lib/meridian/care-data";
import { formatDate, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { snapshot, patient, tasks } = await getPatientById(
    decodeURIComponent(id),
  );

  if (!patient) notFound();

  return (
    <AppShell sourceLabel={snapshot.source === "meridian" ? "Meridian" : "Demo"}>
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
                {patient.age ? (
                  <Badge variant="outline">{patient.age} years</Badge>
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
                {patient.city ? (
                  <InfoChip
                    icon={<HeartPulse className="h-4 w-4" />}
                    label="Location / Ubicación"
                    value={patient.city}
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

          <Card>
            <CardHeader>
              <CardTitle>Linked care records · Registros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-ink-600">
                Showing care tasks linked by patient id/name from the exposed
                Meridian schema
                {snapshot.taskObject ? (
                  <>
                    {" "}
                    (<code>{snapshot.taskObject}</code>)
                  </>
                ) : (
                  ". No task object exposed yet."
                )}
                .
              </p>
              {tasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-ink-200 p-6 text-sm text-ink-500">
                  No linked care tasks found for this patient.
                </div>
              ) : (
                tasks.map((task) => <TaskRow key={task.id} task={task} />)
              )}
            </CardContent>
          </Card>
        </section>

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
