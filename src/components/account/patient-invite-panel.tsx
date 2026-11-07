"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PatientInvitePanel() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<{ code: string; expiresAt: string } | null>(
    null,
  );

  async function createInvite() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not create invite");
      setInvite(data.invite);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create invite");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-ink-100 bg-cream/60 p-4">
      <h3 className="font-semibold text-ink-900">
        Caregiver connection invite
      </h3>
      <p className="text-sm text-ink-600">
        Generate a one-time invite code for a trusted family caregiver. They
        redeem it under Add a Loved One → Connect existing. Membership starts
        as Inactive until a coordinator activates it.
      </p>
      <Button type="button" onClick={createInvite} disabled={pending} size="sm">
        {pending ? "Creating…" : "Generate invite code"}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {invite ? (
        <div className="rounded-xl bg-white p-3 text-sm">
          <p>
            Code: <strong className="tracking-widest">{invite.code}</strong>
          </p>
          <p className="text-ink-500">Expires: {invite.expiresAt}</p>
        </div>
      ) : null}
    </div>
  );
}
