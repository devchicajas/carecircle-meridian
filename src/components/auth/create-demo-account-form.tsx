"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Sparkles } from "lucide-react";

type Option = { value: string; label: string };

export function CreateDemoAccountForm({
  locale,
  caregivers,
  patients,
  compact = false,
  autoRedirect = true,
}: {
  locale: "en" | "es";
  caregivers: Option[];
  patients: Option[];
  compact?: boolean;
  autoRedirect?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    businessId?: string;
    name?: string;
    proofAfter?: string;
    firstName?: string;
  } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    firstName: "Alex",
    lastName: "Demo",
    preferredLanguage: "English" as "English" | "Spanish",
    accountType: "family_caregiver" as "family_caregiver" | "patient",
    linkBusinessId: caregivers[0]?.value || "CG-001",
  });

  async function createAccount(overrides?: Partial<typeof form>) {
    const next = { ...form, ...overrides };
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const linkBusinessId =
        next.accountType === "patient"
          ? next.linkBusinessId || patients[0]?.value || "PAT-001"
          : next.linkBusinessId || caregivers[0]?.value || "CG-001";

      const res = await fetch("/api/account/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: next.firstName,
          lastName: next.lastName,
          preferredLanguage: next.preferredLanguage,
          accountType: next.accountType,
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
        firstName: next.firstName,
      });
      router.refresh();
      if (autoRedirect) {
        window.setTimeout(() => {
          router.push("/demo/ready");
          router.refresh();
        }, 900);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo account failed");
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createAccount();
  }

  const linkOptions =
    form.accountType === "patient" ? patients : caregivers;

  return (
    <Card className="border-matcha-200 bg-gradient-to-br from-white via-strawberry-50/40 to-matcha-50/70 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-strawberry-600" />
          {locale === "es"
            ? "Registrarse · Cuenta demo"
            : "Sign up · Dummy account"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-ink-600">
          {locale === "es"
            ? "MVP de simulación para el hackathon: crea tu cuenta CareCircle y verifica una escritura real en Meridian (datos ficticios)."
            : "Hackathon simulation MVP: create your CareCircle account and verify a real write in Meridian (fictional data only)."}
        </p>

        {!compact ? (
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={pending || !caregivers.length}
            onClick={() =>
              createAccount({
                firstName: "Alex",
                lastName: "Demo",
                accountType: "family_caregiver",
                linkBusinessId: caregivers[0]?.value || "CG-001",
                preferredLanguage: "English",
              })
            }
          >
            {pending
              ? locale === "es"
                ? "Creando cuenta…"
                : "Creating account…"
              : locale === "es"
                ? "Crear cuenta demo en 1 clic"
                : "Create dummy account in 1 click"}
          </Button>
        ) : null}

        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>{locale === "es" ? "Nombre" : "First name"}</span>
            <Input
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>{locale === "es" ? "Apellido" : "Last name"}</span>
            <Input
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </label>

          <button
            type="button"
            className="sm:col-span-2 text-left text-xs font-medium text-strawberry-700 underline"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            {showAdvanced
              ? locale === "es"
                ? "Ocultar opciones"
                : "Hide options"
              : locale === "es"
                ? "Más opciones (idioma / tipo / vínculo Meridian)"
                : "More options (language / type / Meridian link)"}
          </button>

          {showAdvanced ? (
            <>
              <label className="space-y-1 text-sm">
                <span>{locale === "es" ? "Tipo de cuenta" : "Account type"}</span>
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
                  <option value="family_caregiver">
                    Family Caregiver / Cuidador familiar
                  </option>
                  <option value="patient">Patient / Paciente</option>
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span>{locale === "es" ? "Idioma" : "Language"}</span>
                <select
                  className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
                  value={form.preferredLanguage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      preferredLanguage: e.target.value as
                        | "English"
                        | "Spanish",
                    })
                  }
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish / Español</option>
                </select>
              </label>
              <label className="space-y-1 text-sm sm:col-span-2">
                <span>
                  {locale === "es"
                    ? "Registro Meridian vinculado"
                    : "Linked Meridian record"}
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
              </label>
            </>
          ) : null}

          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              size="lg"
              disabled={pending || !linkOptions.length}
              className={compact ? "w-full" : undefined}
            >
              {pending
                ? locale === "es"
                  ? "Registrando…"
                  : "Signing up…"
                : locale === "es"
                  ? "Registrarme con Meridian"
                  : "Sign up with Meridian"}
            </Button>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </form>

        {result ? (
          <div className="space-y-2 rounded-2xl border border-matcha-300 bg-white/90 p-4 text-sm text-ink-800">
            <p className="flex items-center gap-2 font-semibold text-matcha-800">
              <CheckCircle2 className="h-4 w-4" />
              {locale === "es"
                ? `¡Listo, ${result.firstName}! Cuenta creada`
                : `You're in, ${result.firstName}! Account created`}
            </p>
            <p>
              Meridian: <strong>{result.name}</strong> ({result.businessId})
            </p>
            <p>
              {locale === "es" ? "Escritura verificada" : "Verified write"}:{" "}
              <code className="rounded bg-matcha-100 px-1.5 py-0.5">
                {result.proofAfter}
              </code>
            </p>
            <p className="text-xs text-ink-500">
              {autoRedirect
                ? locale === "es"
                  ? "Abriendo tu recorrido demo…"
                  : "Opening your demo walkthrough…"
                : null}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
