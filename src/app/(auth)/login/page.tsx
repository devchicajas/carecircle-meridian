import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { CredentialsLoginForm } from "@/components/auth/credentials-login-form";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const user = await getSessionUser();
  if (user?.onboarded) redirect("/");
  if (user && !user.onboarded) redirect("/onboarding");

  return (
    <AuthShell
      locale={locale}
      title={t.logIn}
      subtitle={
        locale === "es"
          ? "Inicia sesión con el correo y la contraseña de tu cuenta CareCircle."
          : "Sign in with your CareCircle email and password."
      }
    >
      <Suspense fallback={<p className="text-sm text-ink-500">Loading…</p>}>
        <CredentialsLoginForm locale={locale} />
      </Suspense>
    </AuthShell>
  );
}
