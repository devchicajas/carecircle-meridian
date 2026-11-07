"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CredentialsLoginForm({ locale }: { locale: "en" | "es" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email: form.email.trim(),
        password: form.password,
        redirect: false,
      });
      if (!result || result.error) {
        throw new Error(
          locale === "es"
            ? "Correo o contraseña incorrectos."
            : "Invalid email or password.",
        );
      }
      // Fetch session-ish redirect via a lightweight account endpoint
      const me = await fetch("/api/account");
      const data = await me.json();
      if (data?.profile?.onboarded) {
        router.push("/");
      } else {
        router.push("/onboarding");
      }
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
          placeholder="jasmin@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Password</span>
        <Input
          type="password"
          required
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending
          ? "…"
          : locale === "es"
            ? "Iniciar sesión"
            : "Log in"}
      </Button>
      <p className="text-center text-sm text-ink-500">
        {locale === "es" ? "¿Nuevo aquí?" : "New here?"}{" "}
        <Link href="/signup" className="text-strawberry-700 underline">
          {locale === "es" ? "Registrarse" : "Sign up"}
        </Link>
      </p>
    </form>
  );
}
