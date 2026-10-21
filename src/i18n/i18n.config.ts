export const locales = ["en", "ar"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export const defaultTimeZone = "Asia/Riyadh";

type DIR_TYPE = "LTR" | "RTL";

export const dirLocal: Record<Locale, DIR_TYPE> = {
  ar: "RTL",
  en: "LTR",
};

export const ogLocale: Record<Locale, string> = {
  ar: "ar_SA",
  en: "en_US",
};

export function resolveDirLocale(locale: Locale): DIR_TYPE {
  return dirLocal[locale];
}

export function resolveLocale(param?: string): Locale {
  return locales.includes(param as Locale) ? (param as Locale) : defaultLocale;
}

export const isLocale = (v: unknown): v is Locale =>
  typeof v === "string" && (locales as readonly string[]).includes(v);
