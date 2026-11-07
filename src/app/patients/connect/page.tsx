"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConnectExistingPatientPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [relationshipType, setRelationshipType] = useState("Family Member");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "redeem",
          code,
          relationshipType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Invite could not be redeemed.");
      setNote(data.note || "Connection requested.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Redeem failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <AppShell accountType="family_caregiver" accountRole="Family Caregiver" showLogout>
      <div className="mx-auto max-w-xl space-y-6 animate-fadeUp">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-matcha-700">
            Connect existing · Conectar existente
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-ink-900">
            Redeem a patient invite
          </h1>
          <p className="mt-2 text-ink-600">
            Enter the invite code from the patient. Invalid codes return a
            generic error — CareCircle will not confirm whether a patient
            record exists.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invite code</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-3">
              <label className="block space-y-1 text-sm">
                <span>Code</span>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABCD1234"
                  required
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span>Relationship</span>
                <select
                  className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                >
                  {[
                    "Parent",
                    "Child",
                    "Spouse",
                    "Sibling",
                    "Family Member",
                    "Friend",
                    "Other",
                  ].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              {error ? (
                <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
              {note ? (
                <p className="rounded-2xl bg-matcha-50 p-3 text-sm text-matcha-900">
                  {note}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Submitting…" : "Request connection"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Button asChild variant="ghost">
          <Link href="/patients/add">Back</Link>
        </Button>
      </div>
    </AppShell>
  );
}
