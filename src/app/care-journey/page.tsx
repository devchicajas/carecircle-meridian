import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBanner } from "@/components/care/status-banner";
import { EmptyState } from "@/components/care/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildCareJourney,
  findMariaGonzalez,
  loadCareSnapshot,
} from "@/lib/meridian/care-data";
import { getPageViewer } from "@/lib/viewer";
import { formatDate } from "@/lib/utils";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary, statusLabel } from "@/lib/i18n/dictionary";

export const dynamic = "force-dynamic";

export default async function CareJourneyPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string }>;
}) {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const viewer = await getPageViewer();
  const snapshot = await loadCareSnapshot();
  const params = await searchParams;
  const maria = findMariaGonzalez(snapshot.patients);
  const patientRef =
    params.patient || maria?.businessId || maria?.id || undefined;
  const events = buildCareJourney(snapshot, patientRef);

  return (
    <AppShell
      locale={locale}
      sourceLabel={snapshot.source === "meridian" ? "Meridian" : "Unavailable"}
            viewerName={viewer.verified ? viewer.name : undefined}
      showLogout={viewer.verified}
    >
      <div className="space-y-6 animate-fadeUp">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
            {t.careJourney}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            {locale === "es"
              ? "Línea de tiempo de coordinación"
              : "Coordination timeline"}
          </h1>
          <p className="mt-2 max-w-2xl text-ink-600">
            {locale === "es"
              ? "Eventos datados reales desde Meridian (planes, citas, tareas, avisos). Sin historial inventado."
              : "Real dated Meridian records (plans, appointments, tasks, notifications). No fabricated history."}
          </p>
          {patientRef ? (
            <p className="mt-1 text-sm text-ink-500">Patient filter: {patientRef}</p>
          ) : null}
        </div>

        <StatusBanner
          source={snapshot.source}
          connected={snapshot.connected}
          warnings={snapshot.warnings}
          authError={snapshot.authError}
          loadingError={snapshot.loadingError}
          patientObject={snapshot.patientObject}
          taskObject={snapshot.taskObject}
        />

        {events.length === 0 ? (
          <EmptyState
            title="No dated journey events"
            titleEs="Sin eventos datados"
            detail="Records need dates in Meridian to appear on the timeline."
          />
        ) : (
          <div className="relative space-y-4 before:absolute before:left-4 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-strawberry-200 sm:before:left-6">
            {events.map((event) => (
              <Card key={event.id} className="relative ml-8 sm:ml-12">
                <div className="absolute -left-8 top-6 h-3 w-3 rounded-full bg-matcha-500 ring-4 ring-cream sm:-left-10" />
                <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ink-400">
                      {formatDate(event.date)}
                    </p>
                    <CardTitle className="mt-1 text-base">{event.title}</CardTitle>
                  </div>
                  <Badge variant="outline">
                    {statusLabel(event.status, locale)}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-ink-600">
                  <p>{event.description}</p>
                  {event.caregiver ? <p>Caregiver: {event.caregiver}</p> : null}
                  {event.href ? (
                    <Link
                      href={event.href}
                      className="text-strawberry-700 underline"
                    >
                      {locale === "es" ? "Ver registro" : "Open related view"}
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
