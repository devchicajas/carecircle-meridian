"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export function CreatePatientForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [language, setLanguage] = useState("Spanish");
  const [status, setStatus] = useState("Routine Care");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [traceId, setTraceId] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setNote(null);
    setTraceId(null);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          preferredLanguage: language,
          careStatus: status,
          emailAddress: email || undefined,
          phoneNumber: phone || undefined,
          careStartDate: new Date().toISOString().slice(0, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTraceId(data?.traceId || null);
        throw new Error(data?.error || data?.code || "Create failed");
      }
      setNote(
        data?.membershipNote ||
          "Patient saved in Meridian. Care Circle activation may still be required.",
      );
      router.push(`/patients/add?created=${encodeURIComponent(data.patient.id)}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>New loved one profile · Nuevo ser querido</CardTitle>
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
              <span className="text-ink-500">Language</span>
              <select
                className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option>English</option>
                <option>Spanish</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-ink-500">Care status</span>
              <Input value={status} onChange={(e) => setStatus(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-ink-500">Email</span>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-ink-500">Phone</span>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <div className="sm:col-span-2 space-y-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Creating…" : "Create in Meridian"}
              </Button>
              {error ? (
                <p className="text-sm text-red-600">
                  {error}
                  {traceId ? ` · trace ${traceId}` : ""}
                </p>
              ) : null}
              {note ? <p className="text-sm text-matcha-800">{note}</p> : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
