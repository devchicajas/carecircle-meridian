"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function OnboardingForm({
  locale,
  accountType,
  email,
  initial,
}: {
  locale: "en" | "es";
  accountType: string;
  email: string;
  initial: {
    firstName: string;
    lastName: string;
    preferredLanguage: string;
  };
}) {
  const router = useRouter();
  const { update } = useSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: initial.firstName,
    lastName: initial.lastName,
    preferredName: "",
    preferredLanguage: initial.preferredLanguage,
    phoneNumber: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/account/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Could not save (${res.status})`);
      }
      await update();
      router.push(data.redirectTo || "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="rounded-2xl bg-cream p-3 text-sm text-ink-700">
        {locale === "es"
          ? `Completa tu perfil de ${accountType === "patient" ? "paciente" : "cuidador familiar"} (${email}).`
          : `Finish your ${accountType === "patient" ? "patient" : "family caregiver"} profile (${email}).`}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>{locale === "es" ? "Nombre *" : "First name *"}</span>
          <Input
            required
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>{locale === "es" ? "Apellido *" : "Last name *"}</span>
          <Input
            required
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span>{locale === "es" ? "Nombre preferido" : "Preferred name"}</span>
        <Input
          value={form.preferredName}
          onChange={(e) => setForm({ ...form, preferredName: e.target.value })}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>{locale === "es" ? "Teléfono (opcional)" : "Phone (optional)"}</span>
        <Input
          placeholder="555-010-1234"
          value={form.phoneNumber}
          onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>{locale === "es" ? "Idioma" : "Language"}</span>
        <select
          className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
          value={form.preferredLanguage}
          onChange={(e) =>
            setForm({ ...form, preferredLanguage: e.target.value })
          }
        >
          <option value="English">English</option>
          <option value="Spanish">Español</option>
        </select>
      </label>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending
          ? locale === "es"
            ? "Guardando…"
            : "Saving…"
          : locale === "es"
            ? "Guardar y continuar"
            : "Save and continue"}
      </Button>
    </form>
  );
}
