import {
  type AnyD1Database,
  drizzle,
  type DrizzleD1Database,
} from "drizzle-orm/d1";

import * as schema from "../schemas";

export type DatabaseType = DrizzleD1Database<typeof schema>;

export function createDrizzleClient(db: AnyD1Database): DatabaseType {
  return drizzle(db, { schema });
}
