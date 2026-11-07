import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n/dictionary";

export const LOCALE_COOKIE = "carecircle_locale";

export async function getServerLocale(): Promise<Locale> {
  const jar = await cookies();
  const value = jar.get(LOCALE_COOKIE)?.value;
  return value === "es" ? "es" : "en";
}
