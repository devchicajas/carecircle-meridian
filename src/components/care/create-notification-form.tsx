"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Option = { value: string; label: string };

export function CreateNotificationForm({
  patients,
  caregivers,
}: {
  patients: Option[];
  caregivers: Option[];
}) {
  const [patient, setPatient] = useState(patients[0]?.value ?? "");
  const [recipientCaregiver, setRecipientCaregiver] = useState(
    caregivers[0]?.value ?? "",
  );
  const [message, setMessage] = useState(
    "Demo: please confirm the upcoming care task (synthetic).",
  );
  const [notificationType, setNotificationType] = useState("Task Assignment");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient,
          recipientCaregiver,
          message,
          notificationType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.code || "Create failed");
      }
      setSuccess(
        `Created ${data.notification?.businessId || data.notification?.id}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send alert · Enviar aviso</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-ink-500">Patient</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={patient}
              onChange={(e) => setPatient(e.target.value)}
            >
              {patients.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-ink-500">Recipient caregiver</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={recipientCaregiver}
              onChange={(e) => setRecipientCaregiver(e.target.value)}
            >
              {caregivers.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-ink-500">Type</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={notificationType}
              onChange={(e) => setNotificationType(e.target.value)}
            >
              {[
                "Appointment Reminder",
                "Task Assignment",
                "Task Overdue",
                "Task Completed",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="text-ink-500">Message</span>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} required />
          </label>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending || !patients.length}>
              {pending ? "Sending…" : "Create in Meridian"}
            </Button>
            {success ? <p className="text-sm text-matcha-700">{success}</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
