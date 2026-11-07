"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CredentialsSignupForm({ locale }: { locale: "en" | "es" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exists, setExists] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "jasmin@example.com",
    password: "",
    confirmPassword: "",
    preferredLanguage: "English",
    accountType: "family_caregiver",
    termsAccepted: false,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setExists(false);
    try {
      if (!form.termsAccepted) {
        throw new Error(
          locale === "es"
            ? "Debes aceptar los términos de la demo."
            : "Please accept the demo terms to continue.",
        );
      }
      if (form.password !== form.confirmPassword) {
        throw new Error(
          locale === "es"
            ? "La contraseña y la confirmación no coinciden."
            : "Password and confirm password do not match.",
        );
      }
      if (form.password.length < 8) {
        throw new Error(
          locale === "es"
            ? "La contraseña debe tener al menos 8 caracteres."
            : "Password must be at least 8 characters.",
        );
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          email: form.email.trim(),
          termsAccepted: form.termsAccepted,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setExists(true);
          throw new Error(
            data?.error ||
              (locale === "es"
                ? "Esta cuenta ya existe. Inicia sesión."
                : "This account already exists. Please log in."),
          );
        }
        throw new Error(data?.error || `Signup failed (${res.status})`);
      }

      const signedIn = await signIn("credentials", {
        email: form.email.trim(),
        password: form.password,
        redirect: false,
      });
      if (!signedIn || signedIn.error) {
        throw new Error(
          locale === "es"
            ? "Cuenta creada, pero el inicio de sesión automático falló. Usa Log in."
            : "Account created, but automatic sign-in failed. Use Log in.",
        );
      }
      router.push(data.redirectTo || "/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="rounded-2xl border border-matcha-200 bg-matcha-50/80 p-3 text-xs text-ink-700">
        {locale === "es"
          ? "Demo controlada: usa un correo como jasmin@example.com. Sin verificación por email. Las contraseñas se guardan con hash seguro (no en Meridian)."
          : "Controlled demo: use an email like jasmin@example.com. No verification email. Passwords are stored with a secure hash (not in Meridian)."}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>First Name / Nombre *</span>
          <Input
            required
            name="firstName"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Last Name / Apellido *</span>
          <Input
            required
            name="lastName"
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
          name="email"
          autoComplete="email"
          placeholder="jasmin@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Password * (min 8)</span>
          <Input
            type="password"
            required
            name="password"
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span>Confirm Password *</span>
          <Input
            type="password"
            required
            name="confirmPassword"
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
        <span>Account Type / Tipo</span>
        <select
          className="h-11 w-full rounded-2xl border border-ink-100 bg-white px-3"
          value={form.accountType}
          onChange={(e) => setForm({ ...form, accountType: e.target.value })}
        >
          <option value="family_caregiver">
            Family Caregiver / Cuidador familiar
          </option>
          <option value="patient">Patient / Paciente</option>
        </select>
        <p className="text-xs text-ink-500">
          Care Coordinator and Admin require invitation — not available here.
        </p>
      </label>

      <label className="flex items-start gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-matcha-600"
          checked={form.termsAccepted}
          onChange={(e) =>
            setForm({ ...form, termsAccepted: e.target.checked })
          }
        />
        <span>
          I understand this is a synthetic-data demo. Email is only a login ID
          and does not prove ownership of existing patient records. /
          Entiendo que es una demo con datos sintéticos.
        </span>
      </label>

      {error ? (
        <div className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p>{error}</p>
          {exists ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/login?email=${encodeURIComponent(form.email.trim())}`}
              >
                {locale === "es" ? "Ir a iniciar sesión" : "Go to Log in"}
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending
          ? locale === "es"
            ? "Creando cuenta…"
            : "Creating account…"
          : locale === "es"
            ? "Registrarme"
            : "Sign up"}
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
