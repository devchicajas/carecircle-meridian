"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ConnectPatientForm({ locale = "en" }: { locale?: "en" | "es" }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [relationshipType, setRelationshipType] = useState("Family Member");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorEs, setErrorEs] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setErrorEs(null);
    setNote(null);
    setStatus(null);
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
      if (!res.ok) {
        setErrorEs(data?.errorEs || null);
        throw new Error(data?.error || "Invite could not be redeemed.");
      }
      setStatus(data.status || (data.alreadyConnected ? "approved" : "pending_approval"));
      setNote(
        data.error ||
          data.note ||
          (locale === "es"
            ? "Solicitud enviada."
            : "Request submitted."),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Redeem failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {locale === "es"
            ? "Canjear invitación del paciente"
            : "Redeem a patient invite"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-ink-600">
          Enter the invite code from the patient. This does not grant access
          until the connection is approved and Meridian membership is Active.
        </p>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span>Code</span>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD1234"
              required
              autoComplete="off"
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
            <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
              <p>{error}</p>
              {errorEs ? <p>{errorEs}</p> : null}
            </div>
          ) : null}
          {note ? (
            <div className="rounded-2xl bg-matcha-50 p-3 text-sm text-matcha-900">
              <p>{note}</p>
              {status ? (
                <p className="mt-1 text-xs uppercase tracking-wide">
                  Status: {status}
                </p>
              ) : null}
            </div>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? "Submitting…"
              : locale === "es"
                ? "Solicitar conexión"
                : "Request connection"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
