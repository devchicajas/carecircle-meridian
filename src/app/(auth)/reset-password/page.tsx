import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { getServerLocale } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const locale = await getServerLocale();
  return (
    <AuthShell
      locale={locale}
      title={locale === "es" ? "Restablecer contraseña" : "Reset Password"}
    >
      <div className="space-y-4 text-sm text-ink-700">
        <p>
          {locale === "es"
            ? "No hay flujo de restablecimiento CareCircle sin un proveedor de identidad gestionado. No se simula éxito."
            : "There is no CareCircle password-reset flow without a managed identity provider. Success is not simulated."}
        </p>
        <Button asChild className="w-full">
          <Link href="/forgot-password">
            {locale === "es" ? "Ver opciones" : "See options"}
          </Link>
        </Button>
      </div>
    </AuthShell>
  );
}
