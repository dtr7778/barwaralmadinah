import { createFileRoute } from "@tanstack/react-router";
import { createTranslator, useTranslations } from "use-intl";

import { head } from "@/lib/head";

export const Route = createFileRoute("/{-$locale}/")({
  head: ({ match }) => {
    const locale = match.context.locale;
    const messages = match.context.messages;
    const pathname = match.pathname;

    const t = createTranslator({ locale, messages, namespace: "demo" });

    return head(locale, {
      pathname,
      titleByTemplate: t("title"),
      description: t("description"),
    });
  },
  component: RouteContent,
});

const DEMO_DATE = new Date("2026-01-01T00:00:00Z");

function RouteContent() {
  const { locale } = Route.useRouteContext();
  const t = useTranslations("demo");

  return (
    <main className="container mx-auto space-y-2 p-4 pt-16">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p>
        {t("greeting", {
          name: locale === "ar" ? "سارة" : "Sara",
        })}
      </p>
      <p>{t("description")}</p>
      <p>{t("items", { count: 3 })}</p>
      <p>{t("date", { date: DEMO_DATE })}</p>
    </main>
  );
}
