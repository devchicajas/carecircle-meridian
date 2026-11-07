import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export const dynamic = "force-dynamic";

export default async function UnauthorizedPage() {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return (
    <AuthShell locale={locale} title={t.unauthorized}>
      <p className="text-sm text-ink-600">
        {locale === "es"
          ? "No tienes permiso para ver este recurso."
          : "You do not have permission to view this resource."}
      </p>
      <Button asChild className="mt-4 w-full">
        <Link href="/login">{t.logIn}</Link>
      </Button>
    </AuthShell>
  );
}
