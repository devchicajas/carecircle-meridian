"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Patient } from "@/lib/meridian/care-data";

export function EditPatientForm({ patient }: { patient: Patient }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(patient.firstName || "");
  const [lastName, setLastName] = useState(patient.lastName || "");
  const [preferredName, setPreferredName] = useState("");
  const [language, setLanguage] = useState(patient.language || "English");
  const [status, setStatus] = useState(patient.status || "Routine Care");
  const [email, setEmail] = useState(patient.email || "");
  const [phone, setPhone] = useState(patient.phone || "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/patients/${encodeURIComponent(patient.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          preferredName: preferredName || undefined,
          preferredLanguage: language,
          careStatus: status,
          emailAddress: email || undefined,
          phoneNumber: phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.code || "Update failed");
      }
      setSuccess("Saved to Meridian");
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
        <CardTitle>Edit profile · Editar perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-ink-500">First name</span>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-ink-500">Last name</span>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-ink-500">Preferred name</span>
            <Input value={preferredName} onChange={(e) => setPreferredName(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-ink-500">Language / Idioma</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {["English", "Spanish"].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-ink-500">Care status</span>
            <Input value={status} onChange={(e) => setStatus(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-ink-500">Phone</span>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="text-ink-500">Email</span>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save to Meridian"}
            </Button>
            {success ? <p className="text-sm text-matcha-700">{success}</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
