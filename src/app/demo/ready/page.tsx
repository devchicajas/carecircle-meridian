import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAccountProfile } from "@/lib/account/session";
import {
  findMariaGonzalez,
  loadCareSnapshot,
} from "@/lib/meridian/care-data";
import { getServerLocale } from "@/lib/i18n/locale";
import { getPageViewer } from "@/lib/viewer";
import { ArrowRight, CheckCircle2, Clapperboard } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DemoReadyPage() {
  const locale = await getServerLocale();
  const viewer = await getPageViewer();
  const profile = await getAccountProfile();
  const snapshot = await loadCareSnapshot();
  const maria = findMariaGonzalez(snapshot.patients);

  if (!profile?.onboarded) redirect("/signup");

  const meridianId =
    profile.meridianCaregiverBusinessId ||
    profile.meridianPatientBusinessId ||
    "—";

  return (
    <AppShell
      locale={locale}
      sourceLabel={snapshot.source === "meridian" ? "Meridian" : "Unavailable"}
      viewerName={
        viewer.verified
          ? viewer.simulated
            ? `${viewer.name} (simulated)`
            : viewer.name
          : undefined
      }
    >
      <div className="mx-auto max-w-3xl space-y-6 animate-fadeUp">
        <div className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-white via-matcha-50 to-strawberry-50 p-8 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-matcha-700">
                <CheckCircle2 className="h-4 w-4" />
                {locale === "es"
                  ? "Cuenta demo lista"
                  : "Dummy account ready"}
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-ink-900">
                {locale === "es" ? "Hola" : "Welcome"}, {profile.firstName}!
              </h1>
              <p className="mt-2 text-ink-600">
                {locale === "es"
                  ? "Tu perfil CareCircle está vinculado a Meridian. Esto es un MVP de simulación con datos ficticios."
                  : "Your CareCircle profile is linked to Meridian. This is a simulation MVP with fictional data."}
              </p>
            </div>
            <LogoutButton label={locale === "es" ? "Salir" : "Log out"} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="matcha">Live Meridian</Badge>
            <Badge variant="outline">{profile.accountType}</Badge>
            <Badge variant="outline">{meridianId}</Badge>
            <Badge variant="outline">{profile.preferredLanguage}</Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clapperboard className="h-5 w-5 text-strawberry-600" />
              {locale === "es"
                ? "Guion de video (60 segundos)"
                : "60-second video shot list"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-ink-700">
            <p>
              <strong>0–10s:</strong>{" "}
              {locale === "es"
                ? "Problema: la coordinación familiar del cuidado se pierde en chats y hojas de cálculo."
                : "Problem: family care coordination gets lost across chats and spreadsheets."}
            </p>
            <p>
              <strong>10–25s:</strong>{" "}
              {locale === "es"
                ? "Muestra signup → cuenta dummy → badge Live Meridian."
                : "Show signup → dummy account → Live Meridian badge."}
            </p>
            <p>
              <strong>25–45s:</strong>{" "}
              {locale === "es"
                ? "Abre María González → plan, cita, tarea en Meridian."
                : "Open María González → plan, appointment, task from Meridian."}
            </p>
            <p>
              <strong>45–60s:</strong>{" "}
              {locale === "es"
                ? "Completa una tarea + cambia a español."
                : "Complete a task + switch to Spanish."}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild size="lg">
            <Link href="/">
              {locale === "es" ? "Panel de cuidados" : "Care dashboard"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          {maria ? (
            <Button asChild size="lg" variant="soft">
              <Link href={`/patients/${encodeURIComponent(maria.id)}`}>
                Open María González
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/tasks">
              {locale === "es" ? "Tareas Meridian" : "Meridian tasks"}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/care-journey?patient=PAT-001">
              {locale === "es" ? "Seguimiento" : "Care journey"}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/demo">Full 60s guide</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/account">
              {locale === "es" ? "Mi cuenta" : "My account"}
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
