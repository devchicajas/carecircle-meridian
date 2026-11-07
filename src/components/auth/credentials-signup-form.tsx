"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

async function establishSession(email: string, password: string) {
  const result = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });
  // Auth.js may return ok/url without error, or status 200/302 depending on version.
  if (result?.error && result.error !== "undefined") {
    return false;
  }
  if (result?.ok === false) return false;
  return true;
}

export function CredentialsSignupForm({ locale }: { locale: "en" | "es" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    preferredLanguage: "English",
    accountType: "family_caregiver",
    termsAccepted: false,
  });

  async function goAfterAuth() {
    const me = await fetch("/api/account", { cache: "no-store" });
    const data = await me.json().catch(() => ({}));
    router.push(data?.profile?.onboarded ? "/" : "/onboarding");
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (!form.termsAccepted) {
        throw new Error(
          locale === "es"
            ? "Acepta los términos para continuar."
            : "Please accept the terms to continue.",
        );
      }
      if (form.password !== form.confirmPassword) {
        throw new Error(
          locale === "es"
            ? "Las contraseñas no coinciden."
            : "Passwords do not match.",
        );
      }
      if (form.password.length < 8) {
        throw new Error(
          locale === "es"
            ? "La contraseña debe tener al menos 8 caracteres."
            : "Password must be at least 8 characters.",
        );
      }

      const email = form.email.trim();
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          email,
          termsAccepted: true,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        // Account already exists — try signing in with the password they just entered.
        const ok = await establishSession(email, form.password);
        if (ok) {
          await goAfterAuth();
          return;
        }
        throw new Error(
          locale === "es"
            ? "Esta cuenta ya existe. Comprueba la contraseña o inicia sesión."
            : "That account already exists. Check your password or log in.",
        );
      }

      if (!res.ok) {
        throw new Error(data?.error || `Signup failed (${res.status})`);
      }

      const ok = await establishSession(email, form.password);
      if (!ok) {
        throw new Error(
          locale === "es"
            ? "Cuenta creada. Usa Iniciar sesión con tu contraseña."
            : "Account created. Please log in with your password.",
        );
      }
      await goAfterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
        <span>Email *</span>
        <Input
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>{locale === "es" ? "Contraseña *" : "Password *"}</span>
          <Input
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>
            {locale === "es" ? "Confirmar contraseña *" : "Confirm password *"}
          </span>
          <Input
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
          />
        </label>
      </div>

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

      <label className="block space-y-1 text-sm">
        <span>{locale === "es" ? "Tipo de cuenta" : "I am a…"}</span>
        <select
          className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
          value={form.accountType}
          onChange={(e) => setForm({ ...form, accountType: e.target.value })}
        >
          <option value="family_caregiver">
            {locale === "es" ? "Cuidador familiar" : "Family caregiver"}
          </option>
          <option value="patient">
            {locale === "es" ? "Paciente" : "Patient"}
          </option>
        </select>
      </label>

      <label className="flex items-start gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-[#91B88B]"
          checked={form.termsAccepted}
          onChange={(e) =>
            setForm({ ...form, termsAccepted: e.target.checked })
          }
        />
        <span>
          {locale === "es"
            ? "Acepto usar CareCircle con información ficticia de demostración y entiendo que no reemplaza consejo médico."
            : "I agree to use CareCircle with fictional demo information and understand it does not replace medical advice."}
        </span>
      </label>

      {error ? (
        <div className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p>{error}</p>
          <Link href="/login" className="font-medium underline">
            {locale === "es" ? "Ir a iniciar sesión" : "Go to log in"}
          </Link>
        </div>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending
          ? locale === "es"
            ? "Creando cuenta…"
            : "Creating account…"
          : locale === "es"
            ? "Crear cuenta"
            : "Create account"}
      </Button>

      <p className="text-center text-sm text-ink-500">
        {locale === "es" ? "¿Ya tienes cuenta?" : "Already have an account?"}{" "}
        <Link
          href="/login"
          className="font-medium text-strawberry-700 underline"
        >
          {locale === "es" ? "Iniciar sesión" : "Log in"}
        </Link>
      </p>
    </form>
  );
}
