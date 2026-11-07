import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileSettingsForm } from "@/components/auth/profile-settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccountProfile } from "@/lib/account/session";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { getPageViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const viewer = await getPageViewer();
  const profile = await getAccountProfile();
  if (!profile) redirect("/signup");

  return (
    <AppShell
      sourceLabel="Meridian"
      viewerName={viewer.verified ? viewer.name : undefined}
      locale={locale}
    >
      <Card className="mx-auto max-w-2xl animate-fadeUp">
        <CardHeader>
          <CardTitle>{t.settings}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileSettingsForm
            locale={locale}
            initial={{
              firstName: profile.firstName,
              lastName: profile.lastName,
              preferredName: profile.preferredName,
              preferredLanguage: profile.preferredLanguage,
            }}
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
