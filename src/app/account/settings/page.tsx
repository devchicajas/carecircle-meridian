import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileSettingsForm } from "@/components/auth/profile-settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <AppShell
      sourceLabel="Meridian"
      viewerName={`${user.firstName} ${user.lastName}`}
      locale={locale}
      showLogout
    >
      <Card className="mx-auto max-w-2xl animate-fadeUp">
        <CardHeader>
          <CardTitle>{t.settings}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileSettingsForm
            locale={locale}
            initial={{
              firstName: user.firstName,
              lastName: user.lastName,
              preferredName: user.preferredName,
              preferredLanguage: user.preferredLanguage,
            }}
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
