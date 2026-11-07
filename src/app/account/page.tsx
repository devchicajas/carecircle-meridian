import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LogoutButton } from "@/components/auth/logout-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
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
      <div className="mx-auto max-w-2xl space-y-6 animate-fadeUp">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-strawberry-600">
              {t.account}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink-900">
              {t.settings}
            </h1>
          </div>
          <LogoutButton label={t.logOut} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {locale === "es" ? "Cuenta CareCircle" : "CareCircle account"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-ink-700">
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              {user.firstName} {user.lastName}
            </p>
            <p>
              {locale === "es" ? "Tipo" : "Type"}: {user.accountType}
            </p>
            <p>
              Meridian Patient:{" "}
              {user.meridianPatientBusinessId || user.meridianPatientId || "—"}
            </p>
            <p>
              Meridian Caregiver:{" "}
              {user.meridianCaregiverBusinessId ||
                user.meridianCaregiverId ||
                "—"}
            </p>
            <p>Onboarded: {user.onboarded ? "yes" : "no"}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild size="sm">
                <Link href="/account/settings">{t.settings}</Link>
              </Button>
              {!user.onboarded ? (
                <Button asChild size="sm" variant="soft">
                  <Link href="/onboarding">{t.onboarding}</Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
