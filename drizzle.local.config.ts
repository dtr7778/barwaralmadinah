import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { defineConfig } from "drizzle-kit";

function findLocalDbFile() {
  const dir = resolve(
    process.cwd(),
    ".wrangler/v3/d1/miniflare-D1DatabaseObject"
  );

  if (!existsSync(dir)) {
    throw new Error(
      `Local D1 directory not found at ${dir}. Run "pnpm db:migrate:local" first.`
    );
  }

  const file = readdirSync(dir).find(
    (entry) => entry.endsWith(".sqlite") && entry !== "metadata.sqlite"
  );

  if (!file) {
    throw new Error(
      `No local D1 database file found in ${dir}. Run "pnpm db:migrate:local" first.`
    );
  }

  return join(dir, file);
}

export default defineConfig({
  schema: "./src/db/schemas/**",
  out: "migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: findLocalDbFile(),
  },
});
