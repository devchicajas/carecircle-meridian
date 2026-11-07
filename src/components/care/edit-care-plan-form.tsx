"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CarePlan } from "@/lib/meridian/care-data";

type Option = { value: string; label: string };

export function EditCarePlanForm({
  carePlan,
  coordinators,
}: {
  carePlan: CarePlan;
  coordinators: Option[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    recoveryGoals: carePlan.recoveryGoals || "",
    status: carePlan.status || "Active",
    startDate: carePlan.startDate?.slice(0, 10) || "",
    reviewDate: carePlan.reviewDate?.slice(0, 10) || "",
    dischargeDate: carePlan.dischargeDate?.slice(0, 10) || "",
    assignedCoordinator: carePlan.assignedCoordinator || "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(
        `/api/care-plans/${encodeURIComponent(carePlan.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recoveryGoals: form.recoveryGoals,
            status: form.status,
            startDate: form.startDate || undefined,
            reviewDate: form.reviewDate || undefined,
            dischargeDate: form.dischargeDate || undefined,
            assignedCoordinator: form.assignedCoordinator || undefined,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`);
      setSuccess("Saved in Meridian");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Care Plan · Editar plan</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm sm:col-span-2">
            <span>Recovery Goals *</span>
            <Input
              required
              value={form.recoveryGoals}
              onChange={(e) =>
                setForm({ ...form, recoveryGoals: e.target.value })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Assigned Coordinator *</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={form.assignedCoordinator}
              onChange={(e) =>
                setForm({ ...form, assignedCoordinator: e.target.value })
              }
              required
            >
              {coordinators.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Status *</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              required
            >
              {["Active", "On Hold", "Completed"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Start Date</span>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Review Date</span>
            <Input
              type="date"
              value={form.reviewDate}
              onChange={(e) => setForm({ ...form, reviewDate: e.target.value })}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Discharge Date</span>
            <Input
              type="date"
              value={form.dischargeDate}
              onChange={(e) =>
                setForm({ ...form, dischargeDate: e.target.value })
              }
            />
          </label>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? (
              <p className="text-sm text-matcha-700">{success}</p>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
