import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { getAccountProfile } from "@/lib/account/session";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { getPageViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const viewer = await getPageViewer();
  const profile = await getAccountProfile();

  if (!viewer.verified) redirect("/login");
  if (!profile) redirect("/signup");
  if (profile.onboarded) redirect("/");

  return (
    <AuthShell locale={locale} title={t.onboarding} subtitle={t.welcome}>
      <OnboardingForm locale={locale} accountType={profile.accountType} />
    </AuthShell>
  );
}
