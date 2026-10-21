import { relations } from "drizzle-orm";
import { index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

import {
  ActionTypeEnumSchema,
  type ActionTypeEnumType,
  PermissionLevelEnumSchema,
  type PermissionLevelEnumType,
  ResourceTypeEnumSchema,
  type ResourceTypeEnumType,
} from "../../enums/zod-db-enums";
import { RolePermissionTable } from "./rolePermission.table";
import { db_created_at, db_id, db_updated_at } from "@/db/utils/db-utils";

export const PermissionTable = sqliteTable(
  "permissions",
  {
    id: db_id,
    level: text("level").$type<PermissionLevelEnumType>().notNull(),
    resource: text("resource").$type<ResourceTypeEnumType>().notNull(),
    action: text("action").$type<ActionTypeEnumType>().notNull(),
    description: text("description"),
    createdAt: db_created_at,
    updatedAt: db_updated_at,
  },
  (table) => [
    uniqueIndex("permission_level_resource_action_key").on(
      table.level,
      table.resource,
      table.action
    ),
    index("permission_level_idx").on(table.level),
    index("permission_resource_idx").on(table.resource),
    index("permission_action_idx").on(table.action),
  ]
);

export const PermissionTableRelations = relations(
  PermissionTable,
  ({ many }) => ({
    rolePermissions: many(RolePermissionTable, {
      relationName: "PermissionToRolePermission",
    }),
  })
);

export const insertPermissionSchema = createInsertSchema(PermissionTable, {
  level: PermissionLevelEnumSchema,
  resource: ResourceTypeEnumSchema,
  action: ActionTypeEnumSchema,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectPermissionSchema = createSelectSchema(PermissionTable, {
  level: PermissionLevelEnumSchema,
  resource: ResourceTypeEnumSchema,
  action: ActionTypeEnumSchema,
  id: z.uuid(),
});
export const updatePermissionSchema = createUpdateSchema(PermissionTable, {
  level: PermissionLevelEnumSchema,
  resource: ResourceTypeEnumSchema,
  action: ActionTypeEnumSchema,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PermissionDataModel = typeof PermissionTable.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type SelectPermission = z.infer<typeof selectPermissionSchema>;
export type UpdatePermission = z.infer<typeof updatePermissionSchema>;
