import { AppShell } from "@/components/layout/app-shell";
import { StatusBanner } from "@/components/care/status-banner";
import { EmptyState } from "@/components/care/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { loadCareSnapshot } from "@/lib/meridian/care-data";
import { getPageViewer } from "@/lib/viewer";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CaregiversPage() {
  const viewer = await getPageViewer();
  const snapshot = await loadCareSnapshot();

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
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-matcha-700">
            Caregivers · Cuidadores
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            Care team directory
          </h1>
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

        {snapshot.caregivers.length === 0 ? (
          <EmptyState
            title="No caregivers returned"
            titleEs="Sin cuidadores"
            detail="Meridian object: caregiver"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {snapshot.caregivers.map((c) => (
              <Card key={c.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-matcha-100 text-sm font-semibold text-matcha-800">
                      {initials(c.name)}
                    </div>
                    <div>
                      <div className="font-semibold text-ink-900">{c.name}</div>
                      <div className="text-xs text-ink-500">
                        {c.role || "Caregiver"}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.relationship ? (
                      <Badge variant="outline">{c.relationship}</Badge>
                    ) : null}
                    {c.language ? (
                      <Badge variant="matcha">{c.language}</Badge>
                    ) : null}
                  </div>
                  <div className="text-sm text-ink-600">
                    {c.patientName ? `Patient: ${c.patientName}` : "Unassigned"}
                    {c.phone ? ` · ${c.phone}` : ""}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
