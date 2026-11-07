"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Option = { value: string; label: string };

export function CreateMedicationForm({ patients }: { patients: Option[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    patient: patients[0]?.value || "",
    medicationName: "",
    instructions: "",
    frequency: "",
    refillDate: "",
    status: "Active",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          instructions: form.instructions || undefined,
          frequency: form.frequency || undefined,
          refillDate: form.refillDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`);
      const id = data.medication?.id;
      if (id) router.push(`/medications/${encodeURIComponent(id)}`);
      else router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record medication · Registrar medicamento</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-ink-500">
          Recorded information only — not clinical guidance or dosing advice.
        </p>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>Patient *</span>
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
            <span>Status *</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              required
            >
              {["Active", "On Hold", "Discontinued", "Completed"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span>Medication Name *</span>
            <Input
              required
              value={form.medicationName}
              onChange={(e) =>
                setForm({ ...form, medicationName: e.target.value })
              }
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span>Instructions</span>
            <Input
              value={form.instructions}
              onChange={(e) =>
                setForm({ ...form, instructions: e.target.value })
              }
              placeholder="As recorded by the care team"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Frequency</span>
            <Input
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Refill Date</span>
            <Input
              type="date"
              value={form.refillDate}
              onChange={(e) => setForm({ ...form, refillDate: e.target.value })}
            />
          </label>
          <div className="sm:col-span-2 flex items-center gap-3">
            <Button
              type="submit"
              disabled={
                pending ||
                !form.patient ||
                !form.medicationName.trim() ||
                !form.status
              }
            >
              {pending ? "Saving…" : "Create in Meridian"}
            </Button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
