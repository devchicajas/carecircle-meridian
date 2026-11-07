"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CredentialsLoginForm({ locale }: { locale: "en" | "es" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: params.get("email") || "",
    password: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const email = form.email.trim();
      // Pre-validate so we show a clear error before Auth.js session dance.
      const check = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: form.password }),
      });
      const checkData = await check.json().catch(() => ({}));
      if (!check.ok) {
        throw new Error(
          checkData?.error ||
            (locale === "es"
              ? "Correo o contraseña incorrectos."
              : "Invalid email or password."),
        );
      }

      const result = await signIn("credentials", {
        email,
        password: form.password,
        redirect: false,
      });

      if (result?.error && result.error !== "undefined") {
        throw new Error(
          locale === "es"
            ? "No se pudo iniciar sesión. Inténtalo de nuevo."
            : "Could not start your session. Please try again.",
        );
      }

      router.push(checkData.redirectTo || "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block space-y-1 text-sm">
        <span>Email</span>
        <Input
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>{locale === "es" ? "Contraseña" : "Password"}</span>
        <Input
          type="password"
          required
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </label>
      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending
          ? "…"
          : locale === "es"
            ? "Iniciar sesión"
            : "Log in"}
      </Button>
      <p className="text-center text-sm text-ink-500">
        {locale === "es" ? "¿Nuevo en CareCircle?" : "New to CareCircle?"}{" "}
        <Link
          href="/signup"
          className="font-medium text-strawberry-700 underline"
        >
          {locale === "es" ? "Crear cuenta" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
