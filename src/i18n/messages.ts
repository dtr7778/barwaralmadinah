import type { AbstractIntlMessages } from "use-intl";

import type { Locale } from "@/i18n/i18n.config";

import ar from "@/i18n/messages/ar.json";
import en from "@/i18n/messages/en.json";

const catalogs = { ar, en } satisfies Record<Locale, AbstractIntlMessages>;

export function getMessages(locale: Locale) {
  return catalogs[locale];
}
