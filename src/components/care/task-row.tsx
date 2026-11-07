"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, CircleDashed, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CareTask } from "@/lib/meridian/care-data";
import { formatDate } from "@/lib/utils";

type TaskView = CareTask & {
  patientName?: string;
  assignee?: string;
};

export function TaskRow({ task }: { task: TaskView }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = !/complete|done|closed|cancel/i.test(task.status);

  async function markComplete() {
    if (!task.canUpdateStatus) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${encodeURIComponent(task.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" }),
      });
      const data = await res.json();
      if (!res.ok) {
        const en = data?.error || data?.code || "Update failed";
        const es = data?.errorEs ? ` · ${data.errorEs}` : "";
        throw new Error(`${en}${es}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-ink-50 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          {open ? (
            <CircleDashed className="h-4 w-4 shrink-0 text-strawberry-500" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-matcha-600" />
          )}
          <a
            href={`/tasks/${encodeURIComponent(task.id)}`}
            className="truncate font-medium text-ink-900 hover:underline"
          >
            {task.title}
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-6 text-xs text-ink-500">
          {task.patientName ? <span>{task.patientName}</span> : null}
          {task.dueAt ? <span>· Due {formatDate(task.dueAt)}</span> : null}
          {task.assignee ? <span>· {task.assignee}</span> : null}
          {task.businessId ? <span>· {task.businessId}</span> : null}
          {task.escalated ? <span className="text-strawberry-600">· Escalated</span> : null}
        </div>
        {error ? <p className="pl-6 text-xs text-red-600">{error}</p> : null}
      </div>

      <div className="flex items-center gap-2 pl-6 sm:pl-0">
        <Badge variant={open ? "default" : "matcha"}>{task.status}</Badge>
        {task.priority ? <Badge variant="outline">{task.priority}</Badge> : null}
        {task.canUpdateStatus && open ? (
          <Button
            size="sm"
            variant="soft"
            onClick={markComplete}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Complete"
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
