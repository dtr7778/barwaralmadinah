import { relations, sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

import { db_date, db_id } from "@/db/utils/db-utils";
import { UserTable } from "../user";
import { RoleTable } from "./role.table";

export const UserRoleTable = sqliteTable(
  "user_roles",
  {
    id: db_id,
    roleId: text("role_id").notNull(),
    userId: text("user_id").notNull(),
    assignedAt: db_date("assigned_at")
      .default(sql`(unixepoch() * 1000)`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "fk_user_roles_role_id",
      columns: [table.roleId],
      foreignColumns: [RoleTable.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "fk_user_roles_user_id",
      columns: [table.userId],
      foreignColumns: [UserTable.id],
    }).onDelete("cascade"),
    uniqueIndex("user_role_unique").on(table.userId, table.roleId),
    index("user_role_role_id_idx").on(table.roleId),
    index("user_role_user_id_idx").on(table.userId),
  ]
);

export const UserRoleRelations = relations(UserRoleTable, ({ one }) => ({
  role: one(RoleTable, {
    fields: [UserRoleTable.roleId],
    references: [RoleTable.id],
    relationName: "UserRoleToRole",
  }),
  user: one(UserTable, {
    fields: [UserRoleTable.userId],
    references: [UserTable.id],
    relationName: "UserRoleToUser",
  }),
}));

export const insertUserRoleSchema = createInsertSchema(UserRoleTable, {
  roleId: z.uuid(),
  userId: z.uuid(),
}).omit({
  id: true,
  assignedAt: true,
});
export const selectUserRoleSchema = createSelectSchema(UserRoleTable, {
  id: z.uuid(),
  roleId: z.uuid(),
  userId: z.uuid(),
});

export type UserRoleDataModel = typeof UserRoleTable.$inferInsert;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
