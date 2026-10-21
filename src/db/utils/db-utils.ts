import { sql } from "drizzle-orm";
import { integer, real, text } from "drizzle-orm/sqlite-core";

export const db_date = (name: string) =>
  integer(name, { mode: "timestamp_ms" });

export const db_id = text("id")
  .primaryKey()
  .$defaultFn(() => crypto.randomUUID())
  .notNull();

export const db_created_at = db_date("created_at")
  .notNull()
  .default(sql`(unixepoch() * 1000)`);

export const db_updated_at = db_date("updated_at")
  .notNull()
  .default(sql`(unixepoch() * 1000)`)
  .$onUpdate(() => new Date());

export const db_soft_delete = {
  deletedAt: db_date("deleted_at"),
  deletedBy: text("deleted_by"),
};

export const db_bool = (name: string) => integer(name, { mode: "boolean" });

export const db_money = (name: string) => real(name);
