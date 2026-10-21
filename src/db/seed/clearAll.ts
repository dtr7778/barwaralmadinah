import type { DatabaseType } from "../clients/drizzle-client";
import * as schema from "../schemas";

export async function clearAll(db: DatabaseType) {
  console.log("🧹 Clearing existing data...");

  // Join tables first so their parent rows can be removed safely
  await db.delete(schema.UserRoleTable);
  await db.delete(schema.RolePermissionTable);

  await db.delete(schema.UserEventTable);
  await db.delete(schema.UserSessionTable);
  await db.delete(schema.UserDeviceTable);
  await db.delete(schema.AccountTable);
  await db.delete(schema.SessionTable);
  await db.delete(schema.VerificationTable);

  await db.delete(schema.AddressTable);
  await db.delete(schema.UserTable);

  await db.delete(schema.RoleTable);
  await db.delete(schema.PermissionTable);

  console.log("🗑️  Cleared existing data \n");
}
