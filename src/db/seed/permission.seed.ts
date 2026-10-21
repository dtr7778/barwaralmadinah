import type { DatabaseType } from "../clients/drizzle-client";
import type { PermissionDataModel } from "../schemas";
import { PermissionTable } from "../schemas";
import type {
  ActionTypeEnumType,
  PermissionLevelEnumType,
  ResourceTypeEnumType,
} from "../schemas/enums/zod-db-enums";
import { insertChunkedReturning } from "./seed-utils";

export type PermissionType = Pick<
  PermissionDataModel,
  "level" | "resource" | "action"
>;

type CreatePermissionType = {
  level: PermissionLevelEnumType;
  resource: ResourceTypeEnumType;
  action: ActionTypeEnumType;
  description?: string | null | undefined;
};

const selfPermissions: CreatePermissionType[] = [
  // User
  {
    level: "self",
    resource: "user",
    action: "read",
    description: "View own profile information",
  },
  {
    level: "self",
    resource: "user",
    action: "update",
    description: "Edit own profile details",
  },
];

const systemPermissions: CreatePermissionType[] = [
  // User
  {
    level: "system",
    resource: "user",
    action: "create",
    description: "Create new user accounts",
  },
  {
    level: "system",
    resource: "user",
    action: "read",
    description: "View any user's profile information",
  },
  {
    level: "system",
    resource: "user",
    action: "list",
    description: "List all users with filters and pagination",
  },
  {
    level: "system",
    resource: "user",
    action: "update",
    description: "Edit any user's profile details",
  },
  {
    level: "system",
    resource: "user",
    action: "delete",
    description: "Deactivate or remove any user account",
  },
  {
    level: "system",
    resource: "user",
    action: "manage",
    description: "Full user administration including role assignments",
  },

  // Role Permission
  {
    level: "system",
    resource: "role_permission",
    action: "create",
    description: "Create new roles and permissions",
  },
  {
    level: "system",
    resource: "role_permission",
    action: "read",
    description: "View role and permission configurations",
  },
  {
    level: "system",
    resource: "role_permission",
    action: "list",
    description: "List all roles and their assigned permissions",
  },
  {
    level: "system",
    resource: "role_permission",
    action: "update",
    description: "Modify role details and permission assignments",
  },
  {
    level: "system",
    resource: "role_permission",
    action: "delete",
    description: "Remove roles from the system",
  },
  {
    level: "system",
    resource: "role_permission",
    action: "manage",
    description: "Full access to configure roles and permissions",
  },

  // Report
  {
    level: "system",
    resource: "report",
    action: "read",
    description: "View a specific report and its figures",
  },
  {
    level: "system",
    resource: "report",
    action: "list",
    description: "List available reports and saved report runs",
  },
  {
    level: "system",
    resource: "report",
    action: "export",
    description: "Export report data to CSV or PDF",
  },
  {
    level: "system",
    resource: "report",
    action: "manage",
    description: "Full access to build and manage reports",
  },
];

export const permissionsData: CreatePermissionType[] = [
  ...selfPermissions,
  ...systemPermissions,
];

export async function seedPermission(
  db: DatabaseType
): Promise<Array<PermissionDataModel>> {
  console.log("🌱 Seeding permissions...");

  const permissions = await insertChunkedReturning(
    permissionsData.map((p) => ({
      ...p,
      level: p.level,
      resource: p.resource,
      action: p.action,
    })),
    (chunk) => db.insert(PermissionTable).values(chunk).returning()
  );

  console.log(`✅ ${permissions.length} Permissions seeded`);
  return permissions;
}
