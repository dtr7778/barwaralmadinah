import type { ReactNode } from "react";
import type { AbstractIntlMessages } from "use-intl";
import { IntlProvider } from "use-intl";

import type { Locale } from "@/i18n/i18n.config";
import { defaultTimeZone } from "@/i18n/i18n.config";
import { getMessages } from "@/i18n/messages";

export type I18nProviderProps = {
  children: ReactNode;
  locale: Locale;
  /** Overrides the catalog that is resolved from `locale`. */
  messages?: AbstractIntlMessages;
  /** Defaults to the app time zone so server and client render alike. */
  timeZone?: string;
};

export function I18nProvider({
  children,
  locale,
  messages,
  timeZone = defaultTimeZone,
}: I18nProviderProps) {
  return (
    <IntlProvider
      locale={locale}
      messages={messages ?? getMessages(locale)}
      timeZone={timeZone}
    >
      {children}
    </IntlProvider>
  );
}
