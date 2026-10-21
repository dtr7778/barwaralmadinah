import { buildOgMeta } from "./og";
import { buildFaviconLinks } from "./favicon";
import { buildWebmanifest } from "./webmanifest";
import { defaultLocale, locales, type Locale } from "@/i18n/i18n.config";

export interface BuildHeadConfig {
  appName: string;
  siteUrl: string;
  defaultTitle: string;
  titleTemplate: string;
  description: string;
  themeColor: string;
  robots?: string;
  stylesheets?: ReadonlyArray<string>;
  ogImagePath?: string;
  social?: boolean;
}

export type HeadPageOptions = {
  pathname: string;
  description?: string;
} & (
  | { title: string; titleByTemplate?: never }
  | { titleByTemplate: string; title?: never }
);

export interface HeadResult {
  meta: Array<Record<string, string>>;
  links: Array<Record<string, string>>;
}

const GOOGLEBOT_DEFAULT =
  "index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1";

export function buildHead(config: BuildHeadConfig) {
  const {
    appName,
    siteUrl,
    defaultTitle,
    titleTemplate,
    description,
    themeColor,
    robots = "index, follow",
    stylesheets = [],
    ogImagePath = "/opengraph-image.jpeg",
    social = true,
  } = config;

  if (!titleTemplate.includes("%s")) {
    throw new Error('buildHead: titleTemplate must contain "%s"');
  }

  const baseUrl = siteUrl.replace(/\/$/, "");
  const ogImage = `${baseUrl}${ogImagePath}`;
  const googlebot = robots.includes("noindex") ? robots : GOOGLEBOT_DEFAULT;

  const normalizePathname = (pathname: string) =>
    pathname.startsWith("/") ? pathname : `/${pathname}`;

  const stripLocalePrefix = (pathname: string): string => {
    const normalized = normalizePathname(pathname);
    const prefixedLocale = locales.find(
      (locale) =>
        locale !== defaultLocale &&
        (normalized === `/${locale}` || normalized.startsWith(`/${locale}/`))
    );

    if (!prefixedLocale) return normalized;

    const stripped = normalized.slice(prefixedLocale.length + 1);

    return stripped === "" ? "/" : stripped;
  };

  const localizePathname = (pathname: string, locale: Locale): string => {
    const normalized = stripLocalePrefix(pathname);

    if (locale === defaultLocale) return normalized;

    return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
  };

  const canonicalUrl = (pathname: string, locale: Locale) => {
    const localized = localizePathname(pathname, locale);

    return localized === "/" ? baseUrl : `${baseUrl}${localized}`;
  };

  const buildMeta = (
    title: string,
    pageDescription: string,
    url: string | undefined,
    locale: Locale
  ): Array<Record<string, string>> => {
    const meta: Array<Record<string, string>> = [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: themeColor },
      { title },
      { name: "description", content: pageDescription },
      { name: "robots", content: robots },
      { name: "googlebot", content: googlebot },
      { name: "format-detection", content: "telephone=no" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: appName },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
    ];

    if (social) {
      meta.push(
        ...buildOgMeta(locale, {
          appName,
          title,
          description: pageDescription,
          url: url ?? canonicalUrl("/", locale),
          imageUrl: ogImage,
        })
      );
    }

    return meta;
  };

  const buildLinks = (
    url: string | undefined,
    locale: Locale = defaultLocale
  ): Array<Record<string, string>> => [
    ...stylesheets.map((href) => ({ rel: "stylesheet", href })),
    ...buildFaviconLinks(),
    ...buildWebmanifest(locale),
    ...(url ? [{ rel: "canonical", href: url }] : []),
  ];

  const buildAlternateLinks = (
    pathname: string
  ): Array<Record<string, string>> => [
    ...locales.map((locale) => ({
      rel: "alternate",
      hrefLang: locale,
      href: canonicalUrl(pathname, locale),
    })),
    {
      rel: "alternate",
      hrefLang: "x-default",
      href: canonicalUrl(pathname, defaultLocale),
    },
  ];

  const globalHead = (locale: Locale = defaultLocale): HeadResult => ({
    meta: buildMeta(defaultTitle, description, undefined, locale),
    links: buildLinks(undefined, locale),
  });

  const head = (
    locale: Locale = defaultLocale,
    options: HeadPageOptions
  ): HeadResult => {
    const title =
      options.titleByTemplate === undefined
        ? options.title
        : titleTemplate.replace("%s", () => options.titleByTemplate);
    const pageDescription = options.description ?? description;
    const url = canonicalUrl(options.pathname, locale);

    return {
      meta: buildMeta(title, pageDescription, url, locale),
      links: [
        ...buildLinks(url, locale),
        ...buildAlternateLinks(options.pathname),
      ],
    };
  };

  return { globalHead, head };
}
