"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Option = { value: string; label: string };

export function CreateDemoAccountForm({
  locale,
  caregivers,
  patients,
}: {
  locale: "en" | "es";
  caregivers: Option[];
  patients: Option[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    businessId?: string;
    name?: string;
    proofAfter?: string;
    note?: string;
  } | null>(null);
  const [form, setForm] = useState({
    firstName: "Alex",
    lastName: "Demo",
    preferredLanguage: "English" as "English" | "Spanish",
    accountType: "family_caregiver" as "family_caregiver" | "patient",
    linkBusinessId: caregivers[0]?.value || "CG-001",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const linkBusinessId =
        form.accountType === "patient"
          ? form.linkBusinessId || patients[0]?.value || "PAT-001"
          : form.linkBusinessId || caregivers[0]?.value || "CG-001";

      const res = await fetch("/api/account/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          preferredLanguage: form.preferredLanguage,
          accountType: form.accountType,
          linkBusinessId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.code || `Failed (${res.status})`);
      }
      setResult({
        businessId: data.meridian?.businessId,
        name: data.meridian?.name,
        proofAfter: data.proof?.after,
        note: data.note,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo account failed");
    } finally {
      setPending(false);
    }
  }

  const linkOptions =
    form.accountType === "patient" ? patients : caregivers;

  return (
    <Card className="border-matcha-200 bg-gradient-to-br from-white to-matcha-50/60">
      <CardHeader>
        <CardTitle>
          {locale === "es"
            ? "Crear cuenta demo (Meridian)"
            : "Create showcase dummy account"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-ink-600">
          {locale === "es"
            ? "Crea un perfil CareCircle ficticio, lo vincula a un registro Meridian existente y escribe un campo de prueba (teléfono) para demostrar que el backend responde. Datos sintéticos solamente."
            : "Creates a fictional CareCircle profile, links it to an existing Meridian record, and writes a proof field (phone) so you can show the backend is live. Synthetic data only."}
        </p>

        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>First name</span>
            <Input
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Last name</span>
            <Input
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Account type</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={form.accountType}
              onChange={(e) => {
                const accountType = e.target.value as
                  | "family_caregiver"
                  | "patient";
                setForm({
                  ...form,
                  accountType,
                  linkBusinessId:
                    accountType === "patient"
                      ? patients[0]?.value || "PAT-001"
                      : caregivers[0]?.value || "CG-001",
                });
              }}
            >
              <option value="family_caregiver">Family Caregiver</option>
              <option value="patient">Patient</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Language</span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={form.preferredLanguage}
              onChange={(e) =>
                setForm({
                  ...form,
                  preferredLanguage: e.target.value as "English" | "Spanish",
                })
              }
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
            </select>
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span>
              {locale === "es"
                ? "Vincular registro Meridian existente"
                : "Link existing Meridian record"}
            </span>
            <select
              className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
              value={form.linkBusinessId}
              onChange={(e) =>
                setForm({ ...form, linkBusinessId: e.target.value })
              }
              required
            >
              {linkOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-500">
              {locale === "es"
                ? "Meridian no puede crear IDs nuevos en este tenant (secuencia atascada). Usamos un registro ficticio existente + PATCH verificado."
                : "Meridian cannot mint new IDs in this tenant (stuck sequence). We use an existing fictional record + verified PATCH."}
            </p>
          </label>

          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending || !linkOptions.length}>
              {pending
                ? locale === "es"
                  ? "Creando…"
                  : "Creating…"
                : locale === "es"
                  ? "Crear cuenta demo"
                  : "Create dummy account"}
            </Button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </form>

        {result ? (
          <div className="mt-4 space-y-3 rounded-2xl border border-matcha-300 bg-matcha-50 p-4 text-sm text-ink-800">
            <p className="font-semibold text-matcha-800">
              {locale === "es"
                ? "Cuenta demo lista — backend Meridian verificado"
                : "Dummy account ready — Meridian backend verified"}
            </p>
            <p>
              Linked: <strong>{result.name}</strong> ({result.businessId})
            </p>
            <p>
              Proof write (phoneNumber): <code>{result.proofAfter}</code>
            </p>
            <p className="text-xs text-ink-500">{result.note}</p>
            <Button
              type="button"
              onClick={() => {
                router.push("/");
                router.refresh();
              }}
            >
              {locale === "es" ? "Ir al panel" : "Open dashboard"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
