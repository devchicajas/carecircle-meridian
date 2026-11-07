import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { getServerLocale } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const locale = await getServerLocale();
  return (
    <AuthShell
      locale={locale}
      title={locale === "es" ? "Olvidé mi contraseña" : "Forgot Password"}
    >
      <div className="space-y-4 text-sm text-ink-700">
        <p>
          {locale === "es"
            ? "CareCircle no almacena contraseñas y Meridian no expone restablecimiento para este frontend. En esta implementación, el acceso verificado es vía Cursor Identity."
            : "CareCircle does not store passwords, and Meridian does not expose password reset for this frontend. In this implementation, verified access is via Cursor Identity."}
        </p>
        <p className="rounded-2xl border border-ink-100 bg-cream p-3 text-xs">
          To enable email/password reset, configure a managed IdP (Auth0 or Clerk),
          bind secrets in Cursor, and wire Auth.js — without inventing Meridian
          login endpoints or a custom password store.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">
            {locale === "es" ? "Volver" : "Back to login"}
          </Link>
        </Button>
      </div>
    </AuthShell>
  );
}
