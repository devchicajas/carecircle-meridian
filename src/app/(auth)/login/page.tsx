import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { getServerLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { getPageViewer } from "@/lib/viewer";
import { getAccountProfile } from "@/lib/account/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const viewer = await getPageViewer();
  const profile = await getAccountProfile();

  return (
    <AuthShell
      locale={locale}
      title={t.logIn}
      subtitle={
        locale === "es"
          ? "Las sesiones verificadas usan Cursor Identity en apps publicadas privadas o de equipo."
          : "Verified sessions use Cursor Identity on published private/team apps."
      }
    >
      <div className="space-y-4">
        {viewer.verified ? (
          <div className="rounded-2xl border border-matcha-200 bg-matcha-50 p-4 text-sm text-ink-800">
            <p className="font-medium">
              {locale === "es" ? "Sesión activa" : "Signed in"} ·{" "}
              {viewer.name || viewer.email || viewer.sub}
            </p>
            {viewer.simulated ? (
              <p className="mt-1 text-xs text-ink-500">
                Local simulated viewer (identity.dev) — not cryptographically
                verified.
              </p>
            ) : null}
            {profile?.onboarded ? (
              <Button asChild className="mt-3 w-full">
                <Link href="/">
                  {locale === "es" ? "Ir al panel" : "Open dashboard"}
                </Link>
              </Button>
            ) : (
              <Button asChild className="mt-3 w-full">
                <Link href={profile ? "/onboarding" : "/signup"}>
                  {profile
                    ? locale === "es"
                      ? "Completar incorporación"
                      : "Complete onboarding"
                    : t.signUp}
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-strawberry-200 bg-strawberry-50 p-4 text-sm">
            {locale === "es"
              ? "No hay sesión verificada. Publica CareCircle como app privada/equipo en Cursor para autenticación real."
              : "No verified session. Publish CareCircle as a Cursor private/team app for real authentication."}
          </div>
        )}

        <div className="rounded-2xl border border-ink-100 bg-cream/80 p-4 text-xs text-ink-600">
          <p className="font-medium text-ink-800">
            {locale === "es"
              ? "Email / contraseña no disponible vía Meridian"
              : "Email/password not available via Meridian"}
          </p>
          <p className="mt-1">
            Meridian OpenAPI exposes object CRUD only. To add email/password,
            bind Auth0 or Clerk secrets (`AUTH0_SECRET` / `CLERK_SECRET_KEY`) and
            wire that IdP — do not store passwords in Meridian or invent login
            endpoints.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild size="lg">
            <Link href="/signup">
              {locale === "es"
                ? "Registrarme · cuenta dummy Meridian"
                : "Sign up · Meridian dummy account"}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/enter">
              {locale === "es"
                ? "Entrada demo (personas)"
                : "Demo enter (personas)"}
            </Link>
          </Button>
          <Button asChild variant="soft">
            <Link href="/signup">{t.signUp}</Link>
          </Button>
          <Link
            href="/forgot-password"
            className="text-center text-sm text-strawberry-700 underline"
          >
            {locale === "es" ? "Olvidé mi contraseña" : "Forgot password"}
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
