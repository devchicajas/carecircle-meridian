"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignUpForm({ locale }: { locale: "en" | "es" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    preferredLanguage: "English",
    accountType: "family_caregiver",
    terms: false,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (!form.terms) {
        throw new Error(
          locale === "es"
            ? "Debes aceptar los términos."
            : "You must accept the terms.",
        );
      }
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          preferredLanguage: form.preferredLanguage,
          accountType: form.accountType,
          termsAcceptedAt: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.errorEs || `Signup failed (${res.status})`);
      }
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-2xl border border-matcha-200 bg-matcha-50/70 p-3 text-xs text-ink-700">
        {locale === "es" ? (
          <>
            CareCircle usa <strong>Cursor Identity</strong> para la sesión
            verificada (apps privadas/equipo). Meridian no expone registro
            email/contraseña para este frontend. Completa tu perfil CareCircle
            después de autenticarte con Cursor.
          </>
        ) : (
          <>
            CareCircle uses <strong>Cursor Identity</strong> for verified
            sessions on published private/team apps. Meridian does not expose
            email/password signup for this frontend. Complete your CareCircle
            profile after Cursor authentication.
          </>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>First Name / Nombre *</span>
          <Input
            required
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Last Name / Apellido *</span>
          <Input
            required
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span>Preferred Language / Idioma</span>
        <select
          className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
          value={form.preferredLanguage}
          onChange={(e) =>
            setForm({ ...form, preferredLanguage: e.target.value })
          }
        >
          <option value="English">English</option>
          <option value="Spanish">Spanish / Español</option>
        </select>
      </label>

      <label className="block space-y-1 text-sm">
        <span>Account Type / Tipo de cuenta</span>
        <select
          className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
          value={form.accountType}
          onChange={(e) => setForm({ ...form, accountType: e.target.value })}
        >
          <option value="family_caregiver">Family Caregiver / Cuidador familiar</option>
          <option value="patient">Patient / Paciente</option>
        </select>
        <p className="text-xs text-ink-500">
          Care Coordinator and Admin require invitation — not self-serve.
        </p>
      </label>

      <label className="flex items-start gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={form.terms}
          onChange={(e) => setForm({ ...form, terms: e.target.checked })}
        />
        <span>
          I understand CareCircle organizes care coordination with synthetic demo
          data and does not provide medical advice. /
          Entiendo que CareCircle organiza cuidados con datos sintéticos y no
          ofrece consejo médico.
        </span>
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : locale === "es" ? "Continuar" : "Continue"}
      </Button>

      <p className="text-center text-sm text-ink-500">
        {locale === "es" ? "¿Ya tienes cuenta?" : "Already registered?"}{" "}
        <Link href="/login" className="text-strawberry-700 underline">
          {locale === "es" ? "Iniciar sesión" : "Log in"}
        </Link>
      </p>
    </form>
  );
}
