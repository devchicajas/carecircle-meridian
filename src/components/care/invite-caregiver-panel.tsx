"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type InviteRow = {
  id: string;
  code?: string;
  maskedCode?: string;
  status: string;
  relationshipHint?: string | null;
  expiresAt: string;
  createdAt: string;
};

type RequestRow = {
  id: string;
  caregiver_user_id: string;
  relationship_type: string;
  status: string;
  created_at: string;
  meridian_membership_business_id?: string | null;
};

export function InviteCaregiverPanel({ locale = "en" }: { locale?: "en" | "es" }) {
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [hint, setHint] = useState("Family Member");

  async function load() {
    const res = await fetch("/api/invites");
    const data = await res.json();
    if (res.ok) {
      setInvites(data.invites || []);
      setRequests(data.requests || []);
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function createInvite() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          relationshipHint: hint,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not create invite");
      setCreatedCode(data.invite?.code || null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create invite");
    } finally {
      setPending(false);
    }
  }

  async function revoke(inviteId: string) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", inviteId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not revoke");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke");
    } finally {
      setPending(false);
    }
  }

  async function decide(requestId: string, decision: "approve" | "reject") {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/connections/${encodeURIComponent(requestId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.detail || "Decision failed");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decision failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "es" ? "Invitar cuidador" : "Invite a caregiver"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-ink-600">
            Generate a single-use code. The caregiver redeems it under My Loved
            Ones → Connect existing. Access stays pending until you (or a Care
            Coordinator) approve — Meridian membership becomes Active only after
            approval.
          </p>
          <label className="block space-y-1 text-sm">
            <span>Suggested relationship</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
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
          <Button type="button" onClick={createInvite} disabled={pending}>
            {pending
              ? "Working…"
              : locale === "es"
                ? "Generar código"
                : "Generate invite code"}
          </Button>
          {createdCode ? (
            <div className="rounded-xl bg-matcha-50 p-3 text-sm">
              <p>
                Code:{" "}
                <strong className="tracking-widest">{createdCode}</strong>
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => navigator.clipboard?.writeText(createdCode)}
              >
                Copy
              </Button>
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending invitations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {invites.length === 0 ? (
            <p className="text-sm text-ink-500">No invitations yet.</p>
          ) : (
            invites.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-ink-50 bg-white/70 p-3 text-sm"
              >
                <div>
                  <p className="font-medium tracking-widest">
                    {inv.code || inv.maskedCode}
                  </p>
                  <p className="text-xs text-ink-500">
                    Expires {new Date(inv.expiresAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{inv.status}</Badge>
                  {inv.status === "active" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => revoke(inv.id)}
                    >
                      Revoke
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connection requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length === 0 ? (
            <p className="text-sm text-ink-500">No connection requests.</p>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-ink-50 bg-white/70 p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{req.relationship_type}</p>
                  <p className="text-xs text-ink-500">
                    {new Date(req.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      req.status === "approved"
                        ? "matcha"
                        : req.status === "rejected"
                          ? "outline"
                          : "default"
                    }
                  >
                    {req.status === "pending_approval"
                      ? "Awaiting approval"
                      : req.status}
                  </Badge>
                  {req.status === "pending_approval" ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending}
                        onClick={() => decide(req.id, "approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => decide(req.id, "reject")}
                      >
                        Reject
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
