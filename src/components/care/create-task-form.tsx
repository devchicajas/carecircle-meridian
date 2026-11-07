"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Option = { value: string; label: string };

export function CreateTaskForm({
  patients,
  caregivers,
  carePlans,
}: {
  patients: Option[];
  caregivers: Option[];
  carePlans: Option[];
}) {
  const router = useRouter();
  const [patient, setPatient] = useState(patients[0]?.value ?? "");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [assignedCaregiver, setAssignedCaregiver] = useState(
    caregivers[0]?.value ?? "",
  );
  const [carePlan, setCarePlan] = useState(carePlans[0]?.value ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient,
          description,
          priority,
          dueDate: dueDate || undefined,
          assignedCaregiver: assignedCaregiver || undefined,
          carePlan: carePlan || undefined,
          status: "Pending",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.error || data?.code || `Create failed (${res.status})`,
        );
      }
      setDescription("");
      setSuccess(
        `Created task ${data.task?.businessId || data.task?.id || ""}`.trim(),
      );
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
        <CardTitle>Create care task · Crear tarea</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-ink-500">Patient / Paciente</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={patient}
              onChange={(e) => setPatient(e.target.value)}
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
            <span className="text-ink-500">Priority / Prioridad</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {["Low", "Medium", "High"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="text-ink-500">Description / Descripción</span>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Confirm transportation for follow-up visit"
              required
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-ink-500">Due date / Fecha</span>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-ink-500">Caregiver / Cuidador</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={assignedCaregiver}
              onChange={(e) => setAssignedCaregiver(e.target.value)}
            >
              <option value="">Unassigned</option>
              {caregivers.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="text-ink-500">Care plan / Plan</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={carePlan}
              onChange={(e) => setCarePlan(e.target.value)}
            >
              <option value="">None</option>
              {carePlans.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending || !patients.length}>
              {pending ? "Saving…" : "Create in Meridian"}
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
