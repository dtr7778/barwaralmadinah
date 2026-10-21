import { relations, sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

import {
  db_created_at,
  db_date,
  db_id,
  db_updated_at,
} from "@/db/utils/db-utils";
import { UserTable } from "./user.table";
import { UserEventTable } from "./userEvent.table";
import { UserSessionTable } from "./userSession.table";

export const UserDeviceTable = sqliteTable(
  "user_devices",
  {
    id: db_id,
    userId: text("user_id").notNull(),
    fingerprint: text("fingerprint").notNull(),
    browser: text("browser"),
    os: text("os"),
    deviceType: text("device_type"),
    firstSeenAt: db_date("first_seen_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    lastSeenAt: db_date("last_seen_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    createdAt: db_created_at,
    updatedAt: db_updated_at,
  },
  (table) => [
    foreignKey({
      name: "user_device_user_fkey",
      columns: [table.userId],
      foreignColumns: [UserTable.id],
    }).onDelete("cascade"),
    uniqueIndex("user_device_user_fingerprint_idx").on(
      table.userId,
      table.fingerprint
    ),
    index("user_device_user_id_idx").on(table.userId),
  ]
);

export const UserDeviceRelations = relations(
  UserDeviceTable,
  ({ one, many }) => ({
    user: one(UserTable, {
      fields: [UserDeviceTable.userId],
      references: [UserTable.id],
      relationName: "UserDeviceToUser",
    }),
    sessions: many(UserSessionTable, {
      relationName: "UserSessionToUserDevice",
    }),
    events: many(UserEventTable, {
      relationName: "UserEventToUserDevice",
    }),
  })
);

export const insertUserDeviceSchema = createInsertSchema(UserDeviceTable, {
  userId: z.uuid(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectUserDeviceSchema = createSelectSchema(UserDeviceTable, {
  id: z.uuid(),
  userId: z.uuid(),
});
export const updateUserDeviceSchema = createUpdateSchema(UserDeviceTable, {
  userId: z.uuid().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserDeviceDataModel = typeof UserDeviceTable.$inferSelect;
export type InsertUserDevice = z.infer<typeof insertUserDeviceSchema>;
export type SelectUserDevice = z.infer<typeof selectUserDeviceSchema>;
export type UpdateUserDevice = z.infer<typeof updateUserDeviceSchema>;
