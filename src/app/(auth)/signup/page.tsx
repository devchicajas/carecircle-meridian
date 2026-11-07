import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { CredentialsSignupForm } from "@/components/auth/credentials-signup-form";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const user = await getSessionUser();
  if (user?.onboarded) redirect("/");
  if (user && !user.onboarded) redirect("/onboarding");

  return (
    <AuthShell
      locale={locale}
      title={t.signUp}
      subtitle={
        locale === "es"
          ? "Crea tu cuenta para organizar el cuidado de tu familia."
          : "Create your account to organize care for your family."
      }
    >
      <CredentialsSignupForm locale={locale} />
    </AuthShell>
  );
}
