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
import { SessionTable } from "../session.table";
import { UserTable } from "./user.table";
import { UserDeviceTable } from "./userDevice.table";

export const UserSessionTable = sqliteTable(
  "user_sessions",
  {
    id: db_id,
    userId: text("user_id").notNull(),
    deviceId: text("device_id"),
    sessionId: text("session_id").notNull(),
    loginAt: db_date("login_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    lastSeenAt: db_date("last_seen_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    logoutAt: db_date("logout_at"),
    expiresAt: db_date("expires_at"),
    createdAt: db_created_at,
    updatedAt: db_updated_at,
  },
  (table) => [
    foreignKey({
      name: "user_session_user_fkey",
      columns: [table.userId],
      foreignColumns: [UserTable.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "user_session_session_fkey",
      columns: [table.sessionId],
      foreignColumns: [SessionTable.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "user_session_device_fkey",
      columns: [table.deviceId],
      foreignColumns: [UserDeviceTable.id],
    }).onDelete("set null"),
    index("user_session_user_id_idx").on(table.userId),
    uniqueIndex("user_session_session_id_idx").on(table.sessionId),
    index("user_session_login_at_idx").on(table.loginAt),
    index("user_session_last_seen_at_idx").on(table.lastSeenAt),
  ]
);

export const UserSessionRelations = relations(UserSessionTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [UserSessionTable.userId],
    references: [UserTable.id],
    relationName: "UserSessionToUser",
  }),
  session: one(SessionTable, {
    fields: [UserSessionTable.sessionId],
    references: [SessionTable.id],
    relationName: "UserSessionToSession",
  }),
  device: one(UserDeviceTable, {
    fields: [UserSessionTable.deviceId],
    references: [UserDeviceTable.id],
    relationName: "UserSessionToUserDevice",
  }),
}));

export const insertUserSessionSchema = createInsertSchema(UserSessionTable, {
  userId: z.uuid(),
  deviceId: z.uuid().nullish(),
  sessionId: z.uuid(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectUserSessionSchema = createSelectSchema(UserSessionTable, {
  id: z.uuid(),
  userId: z.uuid(),
  deviceId: z.uuid().nullish(),
  sessionId: z.uuid(),
});
export const updateUserSessionSchema = createUpdateSchema(UserSessionTable, {
  userId: z.uuid().optional(),
  deviceId: z.uuid().nullish(),
  sessionId: z.uuid().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserSessionDataModel = typeof UserSessionTable.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type SelectUserSession = z.infer<typeof selectUserSessionSchema>;
export type UpdateUserSession = z.infer<typeof updateUserSessionSchema>;
