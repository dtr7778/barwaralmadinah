import { I18nProvider } from "@/i18n/i18n-provider";
import { resolveDirLocale, resolveLocale } from "@/i18n/i18n.config";
import { loadMessages } from "@/i18n/loadMessages";
import { globalHead } from "@/lib/head";
import { TanStackDevtools } from "@tanstack/react-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

interface RouteContext {}

export const Route = createRootRouteWithContext<RouteContext>()({
  beforeLoad: async ({ location }) => {
    const seg = location.pathname.split("/")[1];

    const locale = resolveLocale(seg);

    return { locale, messages: await loadMessages({ data: locale }) };
  },
  head: ({ match }) => globalHead(match.context.locale),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const { locale, messages } = Route.useRouteContext();

  return (
    <html lang={locale} dir={resolveDirLocale(locale)}>
      <head>
        <HeadContent />
      </head>
      <body>
        <I18nProvider locale={locale} messages={messages}>
          {children}
        </I18nProvider>
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
