"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ConnectionRow = {
  id: string;
  status: string;
  relationship_type: string;
  created_at: string;
  meridian_membership_business_id?: string | null;
  patient?: { email: string; name: string; meridianPatientBusinessId?: string | null } | null;
  caregiver?: {
    email: string;
    name: string;
    meridianCaregiverBusinessId?: string | null;
  } | null;
};

type UserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accountType: string;
  onboarded: boolean;
  meridianPatientBusinessId?: string;
  meridianCaregiverBusinessId?: string;
};

type MeridianSummary = {
  patients: Array<{ id: string; businessId?: string; name: string; status: string }>;
  caregivers: Array<{ id: string; businessId?: string; name: string; status: string; role?: string }>;
  memberships: Array<{
    id: string;
    businessId?: string;
    status: string;
    patientRef?: string;
    caregiverRef?: string;
    relationshipType?: string;
  }>;
  carePlans: Array<{ id: string; businessId?: string; status: string; patientRef?: string }>;
  connected?: boolean;
  loadingError?: string;
};

export function AdminDashboard({ locale = "en" }: { locale?: "en" | "es" }) {
  const [requests, setRequests] = useState<ConnectionRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [meridian, setMeridian] = useState<MeridianSummary | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [membershipFilter, setMembershipFilter] = useState("");

  const load = useCallback(async () => {
    setError(null);
    const [cRes, uRes, mRes] = await Promise.all([
      fetch("/api/admin/connections?status=pending_approval"),
      fetch("/api/admin/users"),
      fetch("/api/admin/meridian"),
    ]);
    const cData = await cRes.json();
    const uData = await uRes.json();
    const mData = await mRes.json();
    if (!cRes.ok) throw new Error(cData?.error || "Could not load connections");
    if (!uRes.ok) throw new Error(uData?.error || "Could not load users");
    if (!mRes.ok) throw new Error(mData?.error || "Could not load Meridian");
    setRequests(cData.requests || []);
    setUsers(uData.users || []);
    setMeridian(mData);
  }, []);

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof Error ? err.message : "Load failed"),
    );
  }, [load]);

  async function decide(id: string, decision: "approve" | "reject") {
    setPending(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch(`/api/connections/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.detail || "Decision failed");
      }
      setNote(
        decision === "approve"
          ? locale === "es"
            ? "Aprobado. Membresía Meridian Active verificada."
            : "Approved. Meridian Active membership verified."
          : locale === "es"
            ? "Solicitud rechazada."
            : "Request rejected.",
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decision failed");
    } finally {
      setPending(false);
    }
  }

  async function setMembershipStatus(
    membershipId: string,
    membershipStatus: "Active" | "Inactive",
  ) {
    setPending(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/admin/meridian", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, membershipStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Meridian update failed");
      setNote(
        `Membership ${data.membership?.businessId || membershipId} → ${data.membership?.status}`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  async function demoteOrUpdateUser(
    userId: string,
    accountType: "patient" | "family_caregiver",
  ) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, accountType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Update failed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  const filteredMemberships =
    meridian?.memberships.filter((m) => {
      if (!membershipFilter.trim()) return true;
      const q = membershipFilter.toLowerCase();
      return (
        m.businessId?.toLowerCase().includes(q) ||
        m.patientRef?.toLowerCase().includes(q) ||
        m.caregiverRef?.toLowerCase().includes(q) ||
        m.status?.toLowerCase().includes(q)
      );
    }) || [];

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {note ? (
        <p className="rounded-2xl border border-matcha-200 bg-matcha-50 p-3 text-sm text-matcha-900">
          {note}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "es"
              ? "Solicitudes de conexión pendientes"
              : "Pending Care Circle connection requests"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.length === 0 ? (
            <p className="text-sm text-ink-500">
              {locale === "es"
                ? "No hay solicitudes pendientes."
                : "No pending requests."}
            </p>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-50 bg-white/80 p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {req.caregiver?.name || "Caregiver"} →{" "}
                    {req.patient?.name || "Patient"}
                  </p>
                  <p className="text-xs text-ink-500">
                    {req.caregiver?.email} · {req.patient?.email} ·{" "}
                    {req.relationship_type}
                  </p>
                  <p className="text-xs text-ink-400">
                    {new Date(req.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Awaiting approval</Badge>
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => decide(req.id, "approve")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => decide(req.id, "reject")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>
            {locale === "es" ? "Cuentas CareCircle" : "CareCircle accounts"}
          </CardTitle>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => load()}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-ink-50 p-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {u.firstName} {u.lastName}{" "}
                  <span className="text-ink-400">({u.email})</span>
                </p>
                <p className="text-xs text-ink-500">
                  {u.accountType}
                  {u.onboarded ? " · onboarded" : " · needs onboarding"}
                  {u.meridianPatientBusinessId
                    ? ` · ${u.meridianPatientBusinessId}`
                    : ""}
                  {u.meridianCaregiverBusinessId
                    ? ` · ${u.meridianCaregiverBusinessId}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={
                    u.accountType === "admin"
                      ? "matcha"
                      : u.accountType === "patient"
                        ? "default"
                        : "outline"
                  }
                >
                  {u.accountType}
                </Badge>
                {u.accountType === "admin" ? null : (
                  <>
                    {u.accountType !== "patient" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => demoteOrUpdateUser(u.id, "patient")}
                      >
                        Set Patient
                      </Button>
                    ) : null}
                    {u.accountType !== "family_caregiver" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          demoteOrUpdateUser(u.id, "family_caregiver")
                        }
                      >
                        Set Caregiver
                      </Button>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Patients ({meridian?.patients.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 space-y-2 overflow-auto text-sm">
            {(meridian?.patients || []).slice(0, 40).map((p) => (
              <div key={p.id} className="rounded-xl border border-ink-50 p-2">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-ink-500">
                  {p.businessId || p.id} · {p.status}
                </p>
                <Link
                  className="text-xs text-strawberry-700 underline"
                  href={`/patients/${encodeURIComponent(p.id)}`}
                >
                  Open
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              Caregivers ({meridian?.caregivers.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 space-y-2 overflow-auto text-sm">
            {(meridian?.caregivers || []).slice(0, 40).map((c) => (
              <div key={c.id} className="rounded-xl border border-ink-50 p-2">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-ink-500">
                  {c.businessId || c.id} · {c.role || "—"} · {c.status}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              Care Plans ({meridian?.carePlans.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 space-y-2 overflow-auto text-sm">
            {(meridian?.carePlans || []).slice(0, 40).map((p) => (
              <div key={p.id} className="rounded-xl border border-ink-50 p-2">
                <p className="font-medium">{p.businessId || p.id}</p>
                <p className="text-xs text-ink-500">
                  {p.patientRef} · {p.status}
                </p>
                <Link
                  className="text-xs text-strawberry-700 underline"
                  href={`/care-plans/${encodeURIComponent(p.id)}`}
                >
                  Manage
                </Link>
              </div>
            ))}
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href="/care-plans">All care plans</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Care Circle Memberships ({meridian?.memberships.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Filter by patient, caregiver, status…"
            value={membershipFilter}
            onChange={(e) => setMembershipFilter(e.target.value)}
          />
          <div className="max-h-80 space-y-2 overflow-auto">
            {filteredMemberships.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-ink-50 p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{m.businessId || m.id}</p>
                  <p className="text-xs text-ink-500">
                    {m.patientRef} · {m.caregiverRef} ·{" "}
                    {m.relationshipType || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      /^active$/i.test(m.status || "") ? "matcha" : "outline"
                    }
                  >
                    {m.status}
                  </Badge>
                  {/^active$/i.test(m.status || "") ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => setMembershipStatus(m.id, "Inactive")}
                    >
                      Set Inactive
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() => setMembershipStatus(m.id, "Active")}
                    >
                      Set Active
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
