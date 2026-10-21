import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

import { db_created_at, db_id } from "@/db/utils/db-utils";
import { PermissionTable } from "./permission.table";
import { RoleTable } from "./role.table";

export const RolePermissionTable = sqliteTable(
  "role_permissions",
  {
    id: db_id,
    roleId: text("role_id").notNull(),
    permissionId: text("permission_id").notNull(),
    createdAt: db_created_at,
  },
  (table) => [
    foreignKey({
      name: "role_permission_role_fkey",
      columns: [table.roleId],
      foreignColumns: [RoleTable.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "role_permission_permission_fkey",
      columns: [table.permissionId],
      foreignColumns: [PermissionTable.id],
    }).onDelete("cascade"),
    uniqueIndex("role_permission_unique").on(table.roleId, table.permissionId),
    index("role_permission_role_idx").on(table.roleId),
    index("role_permission_permission_idx").on(table.permissionId),
  ]
);

export const RolePermissionRelations = relations(
  RolePermissionTable,
  ({ one }) => ({
    role: one(RoleTable, {
      fields: [RolePermissionTable.roleId],
      references: [RoleTable.id],
      relationName: "RoleToRolePermission",
    }),
    permission: one(PermissionTable, {
      fields: [RolePermissionTable.permissionId],
      references: [PermissionTable.id],
      relationName: "PermissionToRolePermission",
    }),
  })
);

export const insertRolePermissionSchema = createInsertSchema(
  RolePermissionTable,
  {
    roleId: z.uuid(),
    permissionId: z.uuid(),
  }
).omit({
  id: true,
  createdAt: true,
});
export const selectRolePermissionSchema = createSelectSchema(
  RolePermissionTable,
  {
    id: z.uuid(),
    roleId: z.uuid(),
    permissionId: z.uuid(),
  }
);

export type RolePermissionDataModel = typeof RolePermissionTable.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type SelectRolePermission = z.infer<typeof selectRolePermissionSchema>;
