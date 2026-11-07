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
            ? "El restablecimiento por correo no está habilitado en este entorno demo controlado (sin verificación de email). Crea una cuenta nueva de demostración o contacta a un administrador del tenant."
            : "Email-based password reset is not enabled in this controlled demo (no email verification). Create a new demo account or contact a tenant administrator."}
        </p>
        <Button asChild className="w-full">
          <Link href="/login">
            {locale === "es" ? "Volver" : "Back to login"}
          </Link>
        </Button>
      </div>
    </AuthShell>
  );
}
