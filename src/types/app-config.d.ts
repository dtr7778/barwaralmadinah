import type { Locale } from "@/i18n/i18n.config";
import type messages from "@/i18n/messages/ar.json";

declare module "use-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
