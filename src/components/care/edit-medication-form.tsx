"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Medication } from "@/lib/meridian/care-data";

export function EditMedicationForm({ medication }: { medication: Medication }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    medicationName: medication.name || "",
    instructions: medication.instructions || "",
    frequency: medication.frequency || "",
    refillDate: medication.refillDate?.slice(0, 10) || "",
    status: medication.status || "Active",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(
        `/api/medications/${encodeURIComponent(medication.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            medicationName: form.medicationName,
            instructions: form.instructions || undefined,
            frequency: form.frequency || undefined,
            refillDate: form.refillDate || undefined,
            status: form.status,
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
        <CardTitle>Edit medication · Editar medicamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
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
