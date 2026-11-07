import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import type { Locale } from "@/lib/i18n/dictionary";
import { getDictionary } from "@/lib/i18n/dictionary";

export function AuthShell({
  children,
  locale,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  locale: Locale;
  title: string;
  subtitle?: string;
}) {
  const t = getDictionary(locale);
  return (
    <div className="min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-strawberry-200/50 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-matcha-200/40 blur-3xl" />
      </div>
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-strawberry-400 to-matcha-500 text-white shadow-soft">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-ink-900">
                {t.appName}{" "}
                <span className="font-normal text-ink-500">| {t.appNameEs}</span>
              </p>
              <p className="text-xs text-ink-500">{t.tagline}</p>
            </div>
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>
        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-ink-600">{subtitle}</p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-4 text-center text-xs text-ink-500">{t.demoOnly}</p>
        <p className="mt-1 text-center text-xs text-ink-400">{t.safety}</p>
      </div>
    </div>
  );
}
