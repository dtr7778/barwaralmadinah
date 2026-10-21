import { defaultLocale, type Locale } from "@/i18n/i18n.config";

export function buildWebmanifest(
  locale: Locale = defaultLocale
): Array<Record<string, string>> {
  return [
    {
      rel: "manifest",
      href: locale === "ar" ? "/site.webmanifest" : "/site.en.webmanifest",
    },
  ];
}
