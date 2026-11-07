import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/signup-form";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return (
    <AuthShell
      locale={locale}
      title={t.signUp}
      subtitle={
        locale === "es"
          ? "Crea tu perfil CareCircle vinculado a tu identidad Cursor."
          : "Create your CareCircle profile linked to your Cursor identity."
      }
    >
      <SignUpForm locale={locale} />
    </AuthShell>
  );
}
