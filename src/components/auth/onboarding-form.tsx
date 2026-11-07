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
  const [hint, setHint] = useState<string | null>(null);
  const [stuck, setStuck] = useState(false);
  const [form, setForm] = useState({
    firstName: initial.firstName,
    lastName: initial.lastName,
    preferredName: "",
    preferredLanguage: initial.preferredLanguage,
    phoneNumber: "",
  });

  async function submit(linkByExactEmail: boolean) {
    setPending(true);
    setError(null);
    setHint(null);
    try {
      const res = await fetch("/api/account/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, linkByExactEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStuck(data?.code === "MERIDIAN_ID_SEQUENCE_STUCK");
        setHint(data?.hint || null);
        throw new Error(data?.error || data?.code || `Failed (${res.status})`);
      }
      await update();
      router.push(data.redirectTo || "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onboarding failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit(false);
      }}
      className="space-y-4"
    >
      <p className="rounded-2xl bg-cream p-3 text-sm text-ink-700">
        {locale === "es"
          ? `Cuenta ${accountType} · ${email}. Crearemos tu perfil en Meridian. No puedes autoasignarte Coordinador/Admin.`
          : `Account ${accountType} · ${email}. We’ll create your profile in Meridian. You cannot self-assign Coordinator/Admin.`}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>First Name *</span>
          <Input
            required
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Last Name *</span>
          <Input
            required
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span>Preferred Name</span>
        <Input
          value={form.preferredName}
          onChange={(e) => setForm({ ...form, preferredName: e.target.value })}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Phone (optional)</span>
        <Input
          placeholder="555-010-1234"
          value={form.phoneNumber}
          onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Preferred Language</span>
        <select
          className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
          value={form.preferredLanguage}
          onChange={(e) =>
            setForm({ ...form, preferredLanguage: e.target.value })
          }
        >
          <option value="English">English</option>
          <option value="Spanish">Spanish</option>
        </select>
      </label>

      {error ? (
        <div className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p className="font-medium">
            {locale === "es"
              ? "Meridian no guardó el perfil (error real)"
              : "Meridian did not save the profile (real error)"}
          </p>
          <p>{error}</p>
          {hint ? <p className="text-xs text-red-600">{hint}</p> : null}
        </div>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending
          ? locale === "es"
            ? "Guardando en Meridian…"
            : "Saving to Meridian…"
          : locale === "es"
            ? "Crear perfil en Meridian"
            : "Create profile in Meridian"}
      </Button>

      {stuck ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={pending}
          onClick={() => void submit(true)}
        >
          {locale === "es"
            ? "Vincular perfil Meridian por email exacto"
            : "Link Meridian profile by exact email"}
        </Button>
      ) : null}
    </form>
  );
}
