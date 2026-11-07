import { AppShell } from "@/components/layout/app-shell";
import { StatusBanner } from "@/components/care/status-banner";
import { EmptyState } from "@/components/care/empty-state";
import { InviteCaregiverPanel } from "@/components/care/invite-caregiver-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  resolveCaregiverLabel,
  resolvePatientLabel,
} from "@/lib/meridian/care-data";
import { loadAuthorizedCareView } from "@/lib/meridian/authorized-care";
import { listConnectionRequestsForCaregiver } from "@/lib/auth/connections";
import { getSessionUser } from "@/lib/auth";
import { getPageViewer } from "@/lib/viewer";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { formatDate, isActiveStatus } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CareCirclePage() {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const viewer = await getPageViewer();
  const profile = await getSessionUser();
  if (!profile) redirect("/login");

  const view = await loadAuthorizedCareView({
    id: profile.id,
    accountType: profile.accountType,
    meridianPatientId: profile.meridianPatientId,
    meridianPatientBusinessId: profile.meridianPatientBusinessId,
    meridianCaregiverId: profile.meridianCaregiverId,
    meridianCaregiverBusinessId: profile.meridianCaregiverBusinessId,
  });

  const caregiverRequests =
    profile.accountType === "family_caregiver"
      ? listConnectionRequestsForCaregiver(profile.id)
      : [];

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
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-matcha-700">
            {t.careCircle}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            {locale === "es"
              ? "Membresías autorizadas"
              : "Your Care Circle memberships"}
          </h1>
          <p className="mt-2 text-ink-600">
            Meridian <code>membershipStatus</code> supports{" "}
            <strong>Active</strong> and <strong>Inactive</strong> only.
            Inactive means a connection request is waiting for
            coordinator/admin activation. Active memberships unlock My Loved
            Ones.
          </p>
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

        {profile.accountType === "patient" ? (
          <InviteCaregiverPanel locale={locale} />
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/patients/connect">Connect to existing patient</Link>
            </Button>
            {caregiverRequests.some((r) => r.status === "pending_approval") ? (
              <Badge variant="outline">
                {locale === "es"
                  ? "Solicitud en espera de aprobación"
                  : "Request awaiting approval"}
              </Badge>
            ) : null}
          </div>
        )}

        {view.authError || view.loadingError ? (
          <EmptyState
            title="Could not load Care Circle"
            titleEs="No se pudo cargar el círculo"
            detail={view.authError?.detail || view.loadingError}
          />
        ) : view.memberships.length === 0 ? (
          <EmptyState
            title="No memberships for your account"
            titleEs="Sin membresías para tu cuenta"
            detail={
              view.scope === "family_caregiver"
                ? "Add a loved one or redeem a patient invite to create an Inactive membership request."
                : "Share an invite code from Account so a caregiver can request connection."
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {view.memberships.map((m) => (
              <Card key={m.id}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base">
                    {m.businessId || m.id}
                  </CardTitle>
                  <Badge
                    variant={isActiveStatus(m.status) ? "matcha" : "outline"}
                  >
                    {m.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-ink-600">
                  <p>
                    Patient:{" "}
                    {resolvePatientLabel(
                      view.rawSnapshot.patients,
                      m.patientRef,
                    ) || m.patientRef}
                  </p>
                  <p>
                    Caregiver:{" "}
                    {resolveCaregiverLabel(
                      view.rawSnapshot.caregivers,
                      m.caregiverRef,
                    ) || m.caregiverRef}
                  </p>
                  <p>Relationship: {m.relationshipType || "—"}</p>
                  <p>
                    {formatDate(m.startDate)} → {formatDate(m.endDate) || "—"}
                  </p>
                  {!isActiveStatus(m.status) ? (
                    <p className="text-amber-800">
                      Waiting for Active status before loved-one access unlocks.
                    </p>
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
