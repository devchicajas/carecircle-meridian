"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Option = { value: string; label: string };

export function CreateAppointmentForm({ patients }: { patients: Option[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    patient: patients[0]?.value || "",
    appointmentDateTime: "",
    appointmentType: "Follow-Up",
    provider: "",
    location: "",
    status: "Scheduled",
    notes: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`);
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
        <CardTitle>Create Appointment · Crear cita</CardTitle>
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
            <span>Date & Time *</span>
            <Input
              type="datetime-local"
              required
              value={form.appointmentDateTime}
              onChange={(e) =>
                setForm({ ...form, appointmentDateTime: e.target.value })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Type</span>
            <Input
              value={form.appointmentType}
              onChange={(e) =>
                setForm({ ...form, appointmentType: e.target.value })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Provider</span>
            <Input
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span>Location</span>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
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
