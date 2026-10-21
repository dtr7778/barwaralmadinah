import { isLocale } from "@/i18n/i18n.config";
import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { useTranslations } from "use-intl";

export const Route = createFileRoute("/{-$locale}")({
  beforeLoad: async ({ params }) => {
    if (params.locale && !isLocale(params.locale)) throw notFound();
  },
  notFoundComponent: NotFound,
  component: RouteComponent,
});

function NotFound() {
  const t = useTranslations("notFound");

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </main>
  );
}

function RouteComponent() {
  return <Outlet />;
}
