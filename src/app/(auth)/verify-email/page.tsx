import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { getServerLocale } from "@/lib/i18n/locale";
import { getPageViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage() {
  const locale = await getServerLocale();
  const viewer = await getPageViewer();
  const verified = viewer.verified && (viewer.emailVerified || viewer.simulated);

  return (
    <AuthShell
      locale={locale}
      title={locale === "es" ? "Verificar correo" : "Verify Email"}
      subtitle={
        locale === "es"
          ? "CareCircle usa el estado de verificación de Cursor Identity."
          : "CareCircle uses Cursor Identity email verification status."
      }
    >
      <div className="space-y-4 text-sm text-ink-700">
        {verified ? (
          <p className="rounded-2xl bg-matcha-50 p-4 text-matcha-800">
            {locale === "es"
              ? "Correo verificado (o simulado en desarrollo local)."
              : "Email verified (or simulated in local development)."}
          </p>
        ) : (
          <p className="rounded-2xl bg-strawberry-50 p-4 text-strawberry-800">
            {locale === "es"
              ? "Tu identidad Cursor no reporta email verificado. Completa la verificación en Cursor antes de acceder a datos protegidos."
              : "Your Cursor identity does not report a verified email. Complete verification in Cursor before accessing protected data."}
          </p>
        )}
        <Button asChild className="w-full">
          <Link href={verified ? "/onboarding" : "/login"}>
            {verified
              ? locale === "es"
                ? "Continuar"
                : "Continue"
              : locale === "es"
                ? "Volver al inicio de sesión"
                : "Back to login"}
          </Link>
        </Button>
      </div>
    </AuthShell>
  );
}
