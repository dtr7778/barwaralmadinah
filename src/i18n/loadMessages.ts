import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { defaultLocale, locales } from "./i18n.config";
import { getMessages } from "./messages";

export const loadMessages = createServerFn({ method: "GET" })
  .validator(z.enum(locales).default(defaultLocale))
  .handler(async ({ data }) => {
    return getMessages(data);
  });
