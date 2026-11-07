"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Option = { value: string; label: string };

export function CreateCarePlanForm({
  patients,
  coordinators,
}: {
  patients: Option[];
  coordinators: Option[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    patient: patients[0]?.value || "",
    recoveryGoals: "",
    startDate: "",
    reviewDate: "",
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
          startDate: form.startDate || undefined,
          reviewDate: form.reviewDate || undefined,
          assignedCoordinator: form.assignedCoordinator || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`);
      setForm({ ...form, recoveryGoals: "" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Care Plan · Crear plan</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>Patient</span>
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
            <span>Coordinator (Active Care Coordinator)</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={form.assignedCoordinator}
              onChange={(e) =>
                setForm({ ...form, assignedCoordinator: e.target.value })
              }
            >
              <option value="">None</option>
              {coordinators.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
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
          <div className="sm:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={pending || !patients.length}>
              {pending ? "Saving…" : "Create in Meridian"}
            </Button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
