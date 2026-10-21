import { relations } from "drizzle-orm";
import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

import {
  db_bool,
  db_created_at,
  db_date,
  db_id,
  db_updated_at,
} from "@/db/utils/db-utils";
import { RoleEnumSchema, type RoleEnumType } from "../../enums/zod-db-enums";
import { AccountTable } from "../account.table";
import { UserRoleTable } from "../role-permission";
import { SessionTable } from "../session.table";
import { UserDeviceTable } from "./userDevice.table";
import { UserEventTable } from "./userEvent.table";
import { UserSessionTable } from "./userSession.table";

export const UserTable = sqliteTable(
  "users",
  {
    id: db_id,
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: db_bool("email_verified").notNull().default(false),
    image: text("image"),
    role: text("role").$type<RoleEnumType>().notNull(),
    banned: db_bool("banned").default(false),
    banReason: text("ban_reason"),
    banExpires: db_date("ban_expires"),

    // settings
    timezone: text("timezone").default("UTC").notNull(),
    locale: text("locale").default("en-US").notNull(),
    currency: text("currency").default("USD").notNull(),

    createdAt: db_created_at,
    updatedAt: db_updated_at,
  },
  (table) => [uniqueIndex("user_email_key").on(table.email)]
);

export const UserRelations = relations(UserTable, ({ many }) => ({
  sessions: many(SessionTable, {
    relationName: "SessionToUser",
  }),
  accounts: many(AccountTable, {
    relationName: "AccountToUser",
  }),
  roles: many(UserRoleTable, {
    relationName: "UserRoleToUser",
  }),
  // auth sessions / devices / events
  loginSessions: many(UserSessionTable, {
    relationName: "UserSessionToUser",
  }),
  devices: many(UserDeviceTable, { relationName: "UserDeviceToUser" }),
  events: many(UserEventTable, { relationName: "UserEventToUser" }),
}));

export const insertUserSchema = createInsertSchema(UserTable, {
  email: z.email(),
  image: z.url().nullable(),
  role: RoleEnumSchema,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectUserSchema = createSelectSchema(UserTable, {
  email: z.email(),
  image: z.url().nullable(),
  role: RoleEnumSchema,
  id: z.uuid(),
});
export const updateUserSchema = createUpdateSchema(UserTable, {
  email: z.email().optional(),
  image: z.url().nullable(),
  role: RoleEnumSchema,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserDataModel = typeof UserTable.$inferSelect;
export type SelectUser = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
