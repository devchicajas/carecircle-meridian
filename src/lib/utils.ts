import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string | null, locale: string = "en-US") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** True only for exact Active (case-insensitive). Never matches Inactive. */
export function isActiveStatus(status?: string | null) {
  return /^active$/i.test(String(status || "").trim());
}

export function pickString(
  record: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  // case-insensitive fallback
  const lowerMap = new Map(
    Object.keys(record).map((k) => [k.toLowerCase(), k] as const),
  );
  for (const key of keys) {
    const actual = lowerMap.get(key.toLowerCase());
    if (!actual) continue;
    const value = record[actual];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
