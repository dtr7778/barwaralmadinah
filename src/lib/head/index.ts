import { createTranslator } from "use-intl";

import appCss from "../../styles.css?url";
import { THEME_COLOR } from "@/constants";
import type { Locale } from "@/i18n/i18n.config";
import { defaultLocale } from "@/i18n/i18n.config";
import { getMessages } from "@/i18n/messages";

import { env } from "../env";
import type { HeadPageOptions } from "./buildHead";
import { buildHead } from "./buildHead";

function createHead(locale: Locale) {
  const t = createTranslator({ locale, messages: getMessages(locale) });

  return buildHead({
    appName: env.VITE_APP_NAME,
    siteUrl: env.VITE_SITE_URL,
    themeColor: THEME_COLOR,
    robots: "index, follow",
    social: true,
    stylesheets: [appCss],
    defaultTitle: t("meta.defaultTitle", { appName: env.VITE_APP_NAME }),
    titleTemplate: t("meta.titleTemplate", { appName: env.VITE_APP_NAME }),
    description: t("meta.description"),
  });
}

export function globalHead(locale: Locale = defaultLocale) {
  return createHead(locale).globalHead(locale);
}

export function head(locale: Locale = defaultLocale, options: HeadPageOptions) {
  return createHead(locale).head(locale, options);
}
