import type { Locale } from "@/i18n/i18n.config";
import { defaultLocale, locales, ogLocale } from "@/i18n/i18n.config";

export interface OgMetaOptions {
  appName: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
}

export function buildOgMeta(
  locale: Locale = defaultLocale,
  options: OgMetaOptions
): Array<Record<string, string>> {
  const { appName, title, description, url, imageUrl } = options;

  return [
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:site_name", content: appName },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:image", content: imageUrl },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: appName },
    { property: "og:locale", content: ogLocale[locale] },
    ...locales
      .filter((alternate) => alternate !== locale)
      .map((alternate) => ({
        property: "og:locale:alternate",
        content: ogLocale[alternate],
      })),
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
    { name: "twitter:image:alt", content: appName },
  ];
}
