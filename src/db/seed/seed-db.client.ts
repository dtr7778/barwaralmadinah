import { getPlatformProxy } from "wrangler";

import { createDrizzleClient } from "../clients/drizzle-client";

type SeedEnv = {
  DB: Parameters<typeof createDrizzleClient>[0];
};

export async function seedDbClient() {
  const configPath = process.env.WRANGLER_CONFIG_PATH;
  const persistPath = process.env.WRANGLER_PERSIST_PATH;
  const isRemote = process.env.SEED_REMOTE === "true";

  if (!configPath) {
    throw new Error(
      "WRANGLER_CONFIG_PATH must point to an app's wrangler config file"
    );
  }

  console.log(
    `🔌 Connecting to the ${isRemote ? "REMOTE" : "local"} D1 database via ${configPath}\n`
  );

  const { env, dispose } = await getPlatformProxy<SeedEnv>({
    configPath,
    environment: isRemote ? "production" : undefined,
    remoteBindings: isRemote,
    persist: isRemote ? false : persistPath ? { path: persistPath } : false,
  });

  const db = createDrizzleClient(env.DB);

  return { db, dispose };
}
