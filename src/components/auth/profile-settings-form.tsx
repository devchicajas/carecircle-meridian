"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileSettingsForm({
  locale,
  initial,
}: {
  locale: "en" | "es";
  initial: {
    firstName: string;
    lastName: string;
    preferredName?: string;
    preferredLanguage: string;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Update failed");
      setOk(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 text-sm">
        <span>First Name</span>
        <Input
          required
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
      </label>
      <label className="space-y-1 text-sm">
        <span>Last Name</span>
        <Input
          required
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />
      </label>
      <label className="space-y-1 text-sm sm:col-span-2">
        <span>Preferred Name</span>
        <Input
          value={form.preferredName || ""}
          onChange={(e) => setForm({ ...form, preferredName: e.target.value })}
        />
      </label>
      <label className="space-y-1 text-sm sm:col-span-2">
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
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending
            ? "…"
            : locale === "es"
              ? "Guardar cambios"
              : "Save Changes"}
        </Button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {ok ? (
          <p className="text-sm text-matcha-700">
            {locale === "es" ? "Guardado" : "Saved"}
          </p>
        ) : null}
      </div>
    </form>
  );
}
