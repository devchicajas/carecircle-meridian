"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  locale,
  className,
}: {
  locale: "en" | "es";
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function setLocale(next: "en" | "es") {
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div
      className={cn(
        "inline-flex rounded-full border border-ink-100 bg-white/80 p-0.5 text-xs",
        className,
      )}
      role="group"
      aria-label="Language / Idioma"
    >
      {(["en", "es"] as const).map((code) => (
        <button
          key={code}
          type="button"
          disabled={pending}
          onClick={() => setLocale(code)}
          className={cn(
            "rounded-full px-2.5 py-1 font-medium transition",
            locale === code
              ? "bg-ink-900 text-white"
              : "text-ink-600 hover:bg-cream",
          )}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
