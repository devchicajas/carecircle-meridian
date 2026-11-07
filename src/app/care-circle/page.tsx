import { AppShell } from "@/components/layout/app-shell";
import { StatusBanner } from "@/components/care/status-banner";
import { EmptyState } from "@/components/care/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  loadCareSnapshot,
  resolveCaregiverLabel,
  resolvePatientLabel,
} from "@/lib/meridian/care-data";
import { getPageViewer } from "@/lib/viewer";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CareCirclePage() {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const viewer = await getPageViewer();
  const snapshot = await loadCareSnapshot();

  return (
    <AppShell
      locale={locale}
      sourceLabel={snapshot.source === "meridian" ? "Meridian" : "Unavailable"}
            viewerName={viewer.verified ? viewer.name : undefined}
      showLogout={viewer.verified}
    >
      <div className="space-y-6 animate-fadeUp">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-matcha-700">
            {t.careCircle}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            {locale === "es"
              ? "Membresías del círculo"
              : "Care circle memberships"}
          </h1>
          <p className="mt-2 text-ink-600">
            Meridian field: <code>membershipStatus</code>. New memberships
            created through CareCircle default to Pending (activation is
            Coordinator/Admin in Meridian).
          </p>
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

        {snapshot.memberships.length === 0 ? (
          <EmptyState
            title="No memberships"
            titleEs="Sin membresías"
            detail="Meridian object: careCircleMembership"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {snapshot.memberships.map((m) => (
              <Card key={m.id}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base">
                    {m.businessId || m.id}
                  </CardTitle>
                  <Badge
                    variant={/active/i.test(m.status) ? "matcha" : "outline"}
                  >
                    {m.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-ink-600">
                  <p>
                    Patient:{" "}
                    {resolvePatientLabel(snapshot.patients, m.patientRef) ||
                      m.patientRef}
                  </p>
                  <p>
                    Caregiver:{" "}
                    {resolveCaregiverLabel(
                      snapshot.caregivers,
                      m.caregiverRef,
                    ) || m.caregiverRef}
                  </p>
                  <p>Relationship: {m.relationshipType || "—"}</p>
                  <p>
                    {formatDate(m.startDate)} → {formatDate(m.endDate) || "—"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
