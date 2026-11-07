import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBanner } from "@/components/care/status-banner";
import { EmptyState } from "@/components/care/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCareJourney } from "@/lib/meridian/care-data";
import {
  assertAuthorizedPatientAccess,
  loadAuthorizedCareView,
} from "@/lib/meridian/authorized-care";
import { getSessionUser } from "@/lib/auth";
import { getPageViewer } from "@/lib/viewer";
import { formatDate } from "@/lib/utils";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary, statusLabel } from "@/lib/i18n/dictionary";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CareJourneyPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string }>;
}) {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const viewer = await getPageViewer();
  const profile = await getSessionUser();
  if (!profile) redirect("/login");

  const params = await searchParams;
  const view = await loadAuthorizedCareView({
    id: profile.id,
    accountType: profile.accountType,
    meridianPatientId: profile.meridianPatientId,
    meridianPatientBusinessId: profile.meridianPatientBusinessId,
    meridianCaregiverId: profile.meridianCaregiverId,
    meridianCaregiverBusinessId: profile.meridianCaregiverBusinessId,
  });

  let patientRef =
    params.patient ||
    view.patients[0]?.businessId ||
    view.patients[0]?.id ||
    undefined;

  if (patientRef) {
    try {
      await assertAuthorizedPatientAccess(
        {
          id: profile.id,
          accountType: profile.accountType,
          meridianPatientId: profile.meridianPatientId,
          meridianPatientBusinessId: profile.meridianPatientBusinessId,
          meridianCaregiverId: profile.meridianCaregiverId,
          meridianCaregiverBusinessId: profile.meridianCaregiverBusinessId,
        },
        patientRef,
      );
    } catch {
      patientRef = view.patients[0]?.businessId || view.patients[0]?.id;
    }
  }

  // Build journey from the authorized (already filtered) snapshot shape.
  const scopedSnapshot = {
    ...view.rawSnapshot,
    patients: view.patients,
    caregivers: view.caregivers,
    memberships: view.memberships,
    carePlans: view.carePlans,
    appointments: view.appointments,
    medications: view.medications,
    tasks: view.tasks,
    notifications: view.notifications,
  };
  const events = buildCareJourney(scopedSnapshot, patientRef);

  // De-dupe by id in case of repeated merges
  const seen = new Set<string>();
  const uniqueEvents = events.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  return (
    <AppShell
      locale={locale}
      sourceLabel={view.source === "meridian" ? "Meridian" : "Unavailable"}
      viewerName={viewer.verified ? viewer.name : undefined}
      showLogout={viewer.verified}
      accountType={viewer.accountType}
      accountRole={
        view.scope === "patient" ? "Patient" : "Family Caregiver"
      }
    >
      <div className="space-y-6 animate-fadeUp">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
            {t.careJourney}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            {locale === "es"
              ? "Línea de tiempo de coordinación"
              : "Your care timeline"}
          </h1>
          <p className="mt-2 max-w-2xl text-ink-600">
            {locale === "es"
              ? "Solo eventos autorizados de Meridian para tu cuenta."
              : "Only Meridian events you are authorized to see."}
          </p>
          {view.scope === "family_caregiver" && view.patients.length > 1 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {view.patients.map((p) => {
                const ref = p.businessId || p.id;
                return (
                  <Link
                    key={p.id}
                    href={`/care-journey?patient=${encodeURIComponent(ref)}`}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      patientRef === ref
                        ? "bg-ink-900 text-white"
                        : "bg-white text-ink-600"
                    }`}
                  >
                    {p.name}
                  </Link>
                );
              })}
            </div>
          ) : patientRef ? (
            <p className="mt-1 text-sm text-ink-500">
              {view.patients[0]?.name || patientRef}
            </p>
          ) : null}
        </div>

        <StatusBanner
          source={view.source}
          connected={view.connected}
          warnings={view.warnings}
          authError={view.authError}
          loadingError={view.loadingError}
          patientObject={view.patientObject}
          taskObject={view.taskObject}
        />

        {uniqueEvents.length === 0 ? (
          <EmptyState
            title="No authorized timeline events"
            titleEs="Sin eventos autorizados"
            detail="Dated Meridian records for your authorized patients appear here."
          />
        ) : (
          <div className="relative space-y-4 before:absolute before:left-4 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-strawberry-200 sm:before:left-6">
            {uniqueEvents.map((event) => (
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
                      Open related record
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
