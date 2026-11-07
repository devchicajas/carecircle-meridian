import { AppShell } from "@/components/layout/app-shell";
import { StatusBanner } from "@/components/care/status-banner";
import { TaskRow } from "@/components/care/task-row";
import { EmptyState } from "@/components/care/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadCareSnapshot } from "@/lib/meridian/care-data";
import { getPageViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
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
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
            Care Tasks · Tareas de Cuidado
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">
            Assigned work across the circle
          </h1>
          <p className="mt-2 max-w-2xl text-ink-600">
            Read-only Meridian <code>careTask</code> records. Status updates stay
            disabled until PATCH is exposed and authorized.
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

        <Card>
          <CardHeader>
            <CardTitle>
              {snapshot.tasks.length} task
              {snapshot.tasks.length === 1 ? "" : "s"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {snapshot.tasks.length === 0 ? (
              <EmptyState
                title="No care tasks returned"
                titleEs="Sin tareas"
                detail="Confirm careTask is exposed and contains fictional demo rows."
              />
            ) : (
              snapshot.tasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
