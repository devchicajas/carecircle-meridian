"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Option = { value: string; label: string };

const STATUS_OPTIONS = ["Active", "On Hold", "Completed"];

export function CreateCarePlanForm({
  patients,
  coordinators,
  locale = "en",
}: {
  patients: Option[];
  coordinators: Option[];
  locale?: "en" | "es";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    patient: patients[0]?.value || "",
    recoveryGoals: "",
    startDate: "",
    reviewDate: "",
    dischargeDate: "",
    assignedCoordinator: coordinators[0]?.value || "",
    status: "Active",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/care-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          reviewDate: form.reviewDate || undefined,
          dischargeDate: form.dischargeDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`);
      const id = data.carePlan?.id;
      if (id) router.push(`/care-plans/${encodeURIComponent(id)}`);
      else router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setPending(false);
    }
  }

  const canSubmit =
    !!form.patient &&
    !!form.recoveryGoals.trim() &&
    !!form.assignedCoordinator &&
    !!form.startDate &&
    !!form.status &&
    coordinators.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {locale === "es" ? "Crear plan de cuidados" : "Create Care Plan"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>Patient / Paciente *</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={form.patient}
              onChange={(e) => setForm({ ...form, patient: e.target.value })}
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
            <span>Assigned Coordinator *</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={form.assignedCoordinator}
              onChange={(e) =>
                setForm({ ...form, assignedCoordinator: e.target.value })
              }
              required
              disabled={!coordinators.length}
            >
              <option value="">
                {coordinators.length
                  ? "Select Active Care Coordinator"
                  : "No eligible coordinator"}
              </option>
              {coordinators.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span>Recovery Goals / Metas *</span>
            <Input
              required
              value={form.recoveryGoals}
              onChange={(e) =>
                setForm({ ...form, recoveryGoals: e.target.value })
              }
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
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Start Date *</span>
            <Input
              type="date"
              required
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
          <div className="sm:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={pending || !canSubmit}>
              {pending ? "Saving…" : "Create in Meridian"}
            </Button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
