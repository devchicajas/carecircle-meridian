import { AppShell } from "@/components/layout/app-shell";
import { StatusBanner } from "@/components/care/status-banner";
import { EmptyState } from "@/components/care/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { resolvePatientLabel } from "@/lib/meridian/care-data";
import { loadAuthorizedCareView } from "@/lib/meridian/authorized-care";
import { getSessionUser } from "@/lib/auth";
import { getPageViewer } from "@/lib/viewer";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
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

  return (
    <AppShell
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
            Notifications · Avisos
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            Care alerts
          </h1>
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

        {view.notifications.length === 0 ? (
          <EmptyState
            title="No notifications for your account"
            titleEs="Sin avisos para tu cuenta"
            detail="Authorized Meridian notifications will appear here."
          />
        ) : (
          <div className="space-y-3">
            {view.notifications.map((n) => (
              <Card key={n.id}>
                <CardContent className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium text-ink-900">{n.message}</div>
                    <div className="text-sm text-ink-500">
                      {resolvePatientLabel(
                        view.rawSnapshot.patients,
                        n.patientRef,
                      ) || n.patientRef}{" "}
                      · {n.notificationType || "Alert"}
                    </div>
                  </div>
                  <Badge variant="outline">{n.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
