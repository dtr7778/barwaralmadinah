import { relations } from "drizzle-orm/relations";
import {
  foreignKey,
  index,
  integer,
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

import { db_created_at, db_id, db_updated_at } from "@/db/utils/db-utils";
import { UserTable } from "./user";

export const AccountTable = sqliteTable(
  "accounts",
  {
    id: db_id,
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    userId: text("user_id").notNull(),
    createdAt: db_created_at,
    updatedAt: db_updated_at,
  },
  (table) => [
    foreignKey({
      name: "account_user_fkey",
      columns: [table.userId],
      foreignColumns: [UserTable.id],
    }).onDelete("cascade"),
    uniqueIndex("account_accountProvider_accountId_idx").on(
      table.providerId,
      table.accountId
    ),
    index("account_userId_idx").on(table.userId),
  ]
);

export const AccountRelations = relations(AccountTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [AccountTable.userId],
    references: [UserTable.id],
    relationName: "AccountToUser",
  }),
}));

export const insertAccountSchema = createInsertSchema(AccountTable, {
  userId: z.uuid(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectAccountSchema = createSelectSchema(AccountTable, {
  id: z.uuid(),
  userId: z.uuid(),
});
export const updateAccountSchema = createUpdateSchema(AccountTable, {
  id: z.uuid().optional(),
  userId: z.uuid().optional(),
});

export type AccountDataModel = typeof AccountTable.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type SelectAccount = z.infer<typeof selectAccountSchema>;
export type UpdateAccount = z.infer<typeof updateAccountSchema>;
