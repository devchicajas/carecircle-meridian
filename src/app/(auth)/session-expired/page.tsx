import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export const dynamic = "force-dynamic";

export default async function SessionExpiredPage() {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return (
    <AuthShell locale={locale} title={t.sessionExpired}>
      <p className="text-sm text-ink-600">
        {locale === "es"
          ? "Tu sesión expiró. Vuelve a autenticarte con Cursor."
          : "Your session expired. Sign in again with Cursor."}
      </p>
      <Button asChild className="mt-4 w-full">
        <Link href="/login">{t.logIn}</Link>
      </Button>
    </AuthShell>
  );
}
