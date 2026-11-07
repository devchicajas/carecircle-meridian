import { AppShell } from "@/components/layout/app-shell";
import { StatusBanner } from "@/components/care/status-banner";
import { EmptyState } from "@/components/care/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  loadCareSnapshot,
  resolvePatientLabel,
} from "@/lib/meridian/care-data";
import { getPageViewer } from "@/lib/viewer";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MedicationsPage() {
  const viewer = await getPageViewer();
  const snapshot = await loadCareSnapshot();

  return (
    <AppShell
      sourceLabel={snapshot.source === "meridian" ? "Meridian" : "Unavailable"}
            viewerName={viewer.verified ? viewer.name : undefined}
      showLogout={viewer.verified}
    >
      <div className="space-y-6 animate-fadeUp">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
            Medications · Medicamentos
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            Recorded medication list
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-500">
            Display-only recorded information. Not clinical guidance.
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

        {snapshot.medications.length === 0 ? (
          <EmptyState
            title="No medications returned"
            titleEs="Sin medicamentos"
            detail="Meridian object: medication"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {snapshot.medications.map((m) => (
              <Card key={m.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-ink-900">{m.name}</div>
                      <div className="text-sm text-ink-500">
                        {resolvePatientLabel(snapshot.patients, m.patientRef) ||
                          m.patientRef}
                      </div>
                    </div>
                    <Badge variant="matcha">{m.status}</Badge>
                  </div>
                  <div className="text-sm text-ink-600">
                    {[m.frequency, m.instructions].filter(Boolean).join(" · ") ||
                      "—"}
                  </div>
                  <div className="text-xs text-ink-500">
                    Refill: {formatDate(m.refillDate)}
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
