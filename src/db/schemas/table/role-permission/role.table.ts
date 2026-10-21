import { relations } from "drizzle-orm";
import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

import { db_id } from "@/db/utils/db-utils";
import { RoleEnum } from "../../enums/db-enums";
import { RolePermissionTable } from "./rolePermission.table";
import { UserRoleTable } from "./userRole.table";

export const RoleTable = sqliteTable(
  "roles",
  {
    id: db_id,
    roleName: RoleEnum("role_name").notNull().default("USER"),
    description: text("description"),
  },
  (table) => [uniqueIndex("role_name_unique").on(table.roleName)]
);

export const RoleRelations = relations(RoleTable, ({ many }) => ({
  rolePermissions: many(RolePermissionTable, {
    relationName: "RoleToRolePermission",
  }),
  userRoles: many(UserRoleTable, {
    relationName: "UserRoleToRole",
  }),
}));

export const insertRoleSchema = createInsertSchema(RoleTable).omit({
  id: true,
});
export const selectRoleSchema = createSelectSchema(RoleTable, {
  id: z.uuid(),
});
export const updateRoleSchema = createUpdateSchema(RoleTable).omit({
  id: true,
});

export type RoleDataModel = typeof RoleTable.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type SelectRole = z.infer<typeof selectRoleSchema>;
export type UpdateRole = z.infer<typeof updateRoleSchema>;
