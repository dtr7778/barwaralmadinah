import { relations } from "drizzle-orm/relations";
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
import { UserSessionTable } from "./user";
import { UserTable } from "./user/user.table";

export const SessionTable = sqliteTable(
  "sessions",
  {
    id: db_id,
    token: text("token").notNull(),
    ipAddress: text("ip_address"), // IPv6 compatible
    userAgent: text("user_agent"),
    impersonatedBy: text("impersonated_by"),
    userId: text("user_id").notNull(),
    expiresAt: db_date("expires_at").notNull(),
    createdAt: db_created_at,
    updatedAt: db_updated_at,
  },
  (table) => [
    foreignKey({
      name: "session_user_fkey",
      columns: [table.userId],
      foreignColumns: [UserTable.id],
    }).onDelete("cascade"),
    uniqueIndex("session_token_idx").on(table.token),
    index("session_userId_idx").on(table.userId),
    index("session_expiresAt_idx").on(table.expiresAt),
  ]
);

export const SessionRelations = relations(SessionTable, ({ one }) => ({
  user: one(UserTable, {
    relationName: "SessionToUser",
    fields: [SessionTable.userId],
    references: [UserTable.id],
  }),
  userSession: one(UserSessionTable, {
    fields: [SessionTable.id],
    references: [UserSessionTable.sessionId],
    relationName: "UserSessionToSession",
  }),
}));

export const insertSessionSchema = createInsertSchema(SessionTable, {
  userId: z.uuid(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectSessionSchema = createSelectSchema(SessionTable, {
  id: z.uuid(),
  userId: z.uuid(),
});
export const updateSessionSchema = createUpdateSchema(SessionTable, {
  userId: z.uuid().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SessionDataModel = typeof SessionTable.$inferSelect;
export type SelectSession = z.infer<typeof selectSessionSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
