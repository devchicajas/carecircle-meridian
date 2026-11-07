import { AppShell } from "@/components/layout/app-shell";
import { StatusBanner } from "@/components/care/status-banner";
import { TaskRow } from "@/components/care/task-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadCareSnapshot } from "@/lib/meridian/care-data";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const snapshot = await loadCareSnapshot();

  return (
    <AppShell sourceLabel={snapshot.source === "meridian" ? "Meridian" : "Demo"}>
      <div className="space-y-6 animate-fadeUp">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
            Care Tasks · Tareas de Cuidado
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900">
            Assigned work across the circle
          </h1>
          <p className="mt-2 max-w-2xl text-ink-600">
            Status updates are enabled only when Meridian exposes a PATCH
            operation for the task object and this runtime has an authorized key.
          </p>
        </div>

        <StatusBanner
          source={snapshot.source}
          connected={snapshot.connected}
          warnings={snapshot.warnings}
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
              <p className="text-sm text-ink-500">
                {snapshot.taskObject
                  ? "Task object is exposed but returned no rows."
                  : "No care-task object is currently exposed in Meridian OpenAPI."}
              </p>
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
