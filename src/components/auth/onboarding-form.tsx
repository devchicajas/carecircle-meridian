"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function OnboardingForm({
  locale,
  accountType,
}: {
  locale: "en" | "es";
  accountType: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkId, setLinkId] = useState("");

  async function complete(mode: "create" | "link") {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/account/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "link" && linkId ? { linkExistingId: linkId } : {},
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Onboarding failed (${res.status})`);
      }
      router.push(accountType === "patient" ? "/portal/patient" : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onboarding failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-700">
        <li>{locale === "es" ? "Bienvenida a CareCircle" : "Welcome to CareCircle"}</li>
        <li>
          {locale === "es" ? "Tipo de cuenta confirmado" : "Account type confirmed"}:{" "}
          <strong>{accountType}</strong>
        </li>
        <li>
          {locale === "es"
            ? "Crear o vincular tu registro Meridian autorizado"
            : "Create or link your authorized Meridian record"}
        </li>
        <li>
          {locale === "es"
            ? "Las membresías del círculo requieren aprobación — no se otorgan automáticamente"
            : "Care-circle memberships require approval — not granted automatically"}
        </li>
      </ol>

      <label className="block space-y-1 text-sm">
        <span>
          {locale === "es"
            ? "Vincular ID existente (opcional, email debe coincidir)"
            : "Link existing Meridian ID (optional; email must match)"}
        </span>
        <input
          className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
          placeholder="PAT-001 or CG-001"
          value={linkId}
          onChange={(e) => setLinkId(e.target.value)}
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} onClick={() => complete("create")}>
          {pending
            ? "…"
            : locale === "es"
              ? "Crear registro Meridian"
              : "Create Meridian record"}
        </Button>
        <Button
          variant="outline"
          disabled={pending || !linkId}
          onClick={() => complete("link")}
        >
          {locale === "es" ? "Vincular existente" : "Link existing"}
        </Button>
      </div>
    </div>
  );
}
