import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { getSessionUser } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const user = await getSessionUser();

  if (!user) redirect("/login");
  if (user.accountType === "admin") redirect("/admin");
  if (user.onboarded) redirect("/");

  return (
    <AuthShell locale={locale} title={t.onboarding} subtitle={t.welcome}>
      <OnboardingForm
        locale={locale}
        accountType={user.accountType}
        email={user.email}
        initial={{
          firstName: user.firstName,
          lastName: user.lastName,
          preferredLanguage: user.preferredLanguage,
        }}
      />
    </AuthShell>
  );
}
