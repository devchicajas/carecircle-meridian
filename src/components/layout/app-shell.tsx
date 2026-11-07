"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HeartHandshake,
  LayoutDashboard,
  Users,
  ClipboardList,
  Sparkles,
  UserRound,
  CalendarDays,
  Pill,
  Bell,
  ClipboardPlus,
  LogIn,
  Route,
  CircleUserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DemoPersonaBadge } from "@/components/care/demo-persona-picker";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import type { Locale } from "@/lib/i18n/dictionary";

const nav = [
  { href: "/login", label: "Log In", es: "Entrar", icon: LogIn },
  { href: "/", label: "Dashboard", es: "Panel", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", es: "Pacientes", icon: Users },
  { href: "/caregivers", label: "Caregivers", es: "Cuidadores", icon: UserRound },
  { href: "/care-plans", label: "Care Plans", es: "Planes", icon: ClipboardPlus },
  { href: "/appointments", label: "Appointments", es: "Citas", icon: CalendarDays },
  { href: "/medications", label: "Medications", es: "Medicamentos", icon: Pill },
  { href: "/tasks", label: "Care Tasks", es: "Tareas", icon: ClipboardList },
  { href: "/care-circle", label: "Care Circle", es: "Círculo", icon: Users },
  { href: "/care-journey", label: "Care Journey", es: "Seguimiento", icon: Route },
  { href: "/notifications", label: "Alerts", es: "Avisos", icon: Bell },
  { href: "/account", label: "Account", es: "Cuenta", icon: CircleUserRound },
];

export function AppShell({
  children,
  sourceLabel,
  viewerName,
  locale: localeProp = "en",
}: {
  children: React.ReactNode;
  sourceLabel?: string;
  viewerName?: string;
  locale?: Locale;
}) {
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>(localeProp);

  useEffect(() => {
    setLocale(localeProp);
  }, [localeProp]);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )carecircle_locale=(en|es)/);
    if (match?.[1] === "en" || match?.[1] === "es") {
      setLocale(match[1]);
    }
  }, [pathname]);

  return (
    <div className="min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-strawberry-200/50 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-matcha-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-strawberry-100/60 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/60 bg-cream/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-strawberry-400 to-matcha-500 text-white shadow-soft transition group-hover:scale-105">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight text-ink-900 sm:text-lg">
                CareCircle{" "}
                <span className="font-normal text-ink-500">
                  | Círculo de Cuidado
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-500">
                <Sparkles className="h-3 w-3 text-matcha-600" />
                {locale === "es"
                  ? "Mejor cuidado, juntos."
                  : "Better Care, Together."}
              </div>
            </div>
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <LanguageSwitcher locale={locale} />
            <DemoPersonaBadge />
            {viewerName ? (
              <Badge variant="outline">{viewerName}</Badge>
            ) : null}
            {sourceLabel ? (
              <Badge variant={sourceLabel === "Meridian" ? "matcha" : "warning"}>
                {sourceLabel === "Meridian"
                  ? "Live Meridian"
                  : "Meridian unavailable"}
              </Badge>
            ) : null}
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6 lg:px-8">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm transition sm:px-4",
                  active
                    ? "bg-ink-900 text-white shadow-soft"
                    : "text-ink-600 hover:bg-white hover:text-ink-900",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{locale === "es" ? item.es : item.label}</span>
                <span
                  className={cn(
                    "hidden text-xs lg:inline",
                    active ? "text-white/70" : "text-ink-400",
                  )}
                >
                  / {locale === "es" ? item.label : item.es}
                </span>
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
