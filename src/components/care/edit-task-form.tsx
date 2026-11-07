"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CareTask } from "@/lib/meridian/care-data";

type Option = { value: string; label: string };
type CarePlanOption = Option & { patientRef?: string };

export function EditTaskForm({
  task,
  patients,
  caregivers,
  carePlans,
}: {
  task: CareTask;
  patients: Option[];
  caregivers: Option[];
  carePlans: CarePlanOption[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorEs, setErrorEs] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    patient: task.patientRef || patients[0]?.value || "",
    carePlan: task.carePlanRef || "",
    assignedCaregiver: task.assigneeRef || "",
    description: task.title || "",
    dueDate: task.dueAt?.slice(0, 10) || "",
    priority: task.priority || "Medium",
    status: task.status || "Pending",
    escalated: Boolean(task.escalated),
  });

  const filteredPlans = useMemo(
    () =>
      carePlans.filter(
        (plan) =>
          !plan.patientRef ||
          plan.patientRef === form.patient ||
          plan.patientRef.toLowerCase() === form.patient.toLowerCase(),
      ),
    [carePlans, form.patient],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setErrorEs(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/tasks/${encodeURIComponent(task.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: form.patient,
          carePlan: form.carePlan,
          assignedCaregiver: form.assignedCaregiver,
          description: form.description,
          dueDate: form.dueDate,
          priority: form.priority,
          status: form.status,
          escalated: form.escalated,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorEs(data?.errorEs || null);
        throw new Error(data?.error || data?.code || `Failed (${res.status})`);
      }
      setSuccess("Saved in Meridian");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  const canSubmit =
    !!form.patient &&
    !!form.carePlan &&
    !!form.assignedCaregiver &&
    !!form.description.trim() &&
    !!form.dueDate &&
    !!form.priority &&
    !!form.status;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit care task · Editar tarea</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>Patient *</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={form.patient}
              onChange={(e) => {
                const patient = e.target.value;
                const nextPlans = carePlans.filter(
                  (plan) =>
                    !plan.patientRef ||
                    plan.patientRef === patient ||
                    plan.patientRef.toLowerCase() === patient.toLowerCase(),
                );
                setForm({
                  ...form,
                  patient,
                  carePlan: nextPlans.some((p) => p.value === form.carePlan)
                    ? form.carePlan
                    : nextPlans[0]?.value || "",
                });
              }}
              required
            >
              {patients.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Care Plan *</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={form.carePlan}
              onChange={(e) => setForm({ ...form, carePlan: e.target.value })}
              required
            >
              <option value="">Select care plan</option>
              {filteredPlans.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Assigned Caregiver *</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={form.assignedCaregiver}
              onChange={(e) =>
                setForm({ ...form, assignedCaregiver: e.target.value })
              }
              required
            >
              <option value="">Select caregiver</option>
              {caregivers.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Priority *</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              required
            >
              {["Low", "Medium", "High"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span>Description *</span>
            <Input
              required
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Due Date *</span>
            <Input
              type="date"
              required
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Status *</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              required
            >
              {["Pending", "In Progress", "Completed", "Overdue"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.escalated}
              onChange={(e) =>
                setForm({ ...form, escalated: e.target.checked })
              }
            />
            Escalated
          </label>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending || !canSubmit}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
            {error ? (
              <div className="text-sm text-red-600">
                <p>{error}</p>
                {errorEs ? <p>{errorEs}</p> : null}
              </div>
            ) : null}
            {success ? (
              <p className="text-sm text-matcha-700">{success}</p>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
