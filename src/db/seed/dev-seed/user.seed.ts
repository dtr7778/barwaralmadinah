import { faker } from "@faker-js/faker";
import { hashPassword } from "better-auth/crypto";
import { zocker } from "zocker";

import type { DatabaseType } from "../../clients/drizzle-client";
import type {
  InsertAccount,
  InsertUser,
  InsertUserRole,
  RoleDataModel,
  UserDataModel,
} from "../../schemas";
import {
  AccountTable,
  insertUserSchema,
  UserRoleTable,
  UserTable,
} from "../../schemas";
import type { RoleEnumType } from "../../schemas/enums/zod-db-enums";
import { RoleEnumSchema } from "../../schemas/enums/zod-db-enums";
import { SYSTEM_ROLES } from "../roles.seed";
import { insertChunked, insertChunkedReturning } from "../seed-utils";
import { seedConfigs } from "../seed.config";

const DEFAULT_USERS: Array<{
  name: string;
  email: string;
  role: RoleEnumType;
  seed: string;
}> = [
  {
    name: "John User",
    email: "user@mail.com",
    role: RoleEnumSchema.enum.USER,
    seed: "user",
  },
  {
    name: "Employee",
    email: "super_agent@mail.com",
    role: RoleEnumSchema.enum.SUPPORT_AGENT,
    seed: "super_agent",
  },
  {
    name: "Admin Smith",
    email: "admin@mail.com",
    role: RoleEnumSchema.enum.ADMIN,
    seed: "admin",
  },
  {
    name: "Super Admin",
    email: "superadmin@mail.com",
    role: RoleEnumSchema.enum.SUPER_ADMIN,
    seed: "superadmin",
  },
];

// Configuration for random user generation
const RANDOM_USER_CONFIG = {
  BAN_PROBABILITY: 0.2,
} as const;

const DEFAULT_PASSWORD = "12345678";

/**
 * Creates a user object with default avatar from DiceBear API
 */
function createDefaultUser(
  user: (typeof DEFAULT_USERS)[number],
  roleId: string
): InsertUser & { roleId: string } {
  return {
    name: user.name,
    email: user.email,
    emailVerified: true,
    image: `https://api.dicebear.com/7.x/avataaars/png?size=128&seed=${user.seed}`,
    banned: false,
    role: user.role,
    roleId,
  };
}

/**
 * Maps default users to their data with role IDs
 */
function buildDefaultUsersData(
  roles: Array<RoleDataModel>
): Array<InsertUser & { roleId: string }> {
  return DEFAULT_USERS.map((user) => {
    const role = roles.find(({ roleName }) => roleName === user.role)!;
    return createDefaultUser(user, role.id);
  });
}

/**
 * Creates a random user with faker-generated data
 */
function createRandomUser(
  roleData: RoleDataModel
): InsertUser & { roleId: string } {
  const isBanned = faker.datatype.boolean(RANDOM_USER_CONFIG.BAN_PROBABILITY);

  const user = zocker(insertUserSchema)
    .supply(insertUserSchema.shape.name, faker.person.fullName())
    .supply(
      insertUserSchema.shape.image,
      faker.image.personPortrait({ size: 128 })
    )
    .supply(insertUserSchema.shape.banned, isBanned)
    .supply(
      insertUserSchema.shape.banExpires,
      isBanned ? faker.date.future() : null
    )
    .supply(
      insertUserSchema.shape.banReason,
      isBanned ? faker.lorem.sentence() : null
    )
    .supply(insertUserSchema.shape.timezone, faker.location.timeZone())
    .supply(
      insertUserSchema.shape.locale,
      faker.location.countryCode("alpha-2")
    )
    .supply(insertUserSchema.shape.currency, faker.finance.currency().code)
    .generate();

  return {
    ...user,
    role: roleData.roleName,
    roleId: roleData.id,
  };
}

/**
 * Builds random users data based on remaining count
 */
function buildRandomUsersData(
  roles: Array<RoleDataModel>,
  remainingCount: number
): Array<InsertUser> {
  const randomUsers: Array<InsertUser> = [];

  for (let i = 0; i < remainingCount; i++) {
    const role = faker.helpers.arrayElement(roles);
    const randomUser = createRandomUser(role);
    randomUsers.push(randomUser);
  }

  return randomUsers;
}

/**
 * Seeds users into the database
 * @param roles - Array of existing role data models
 * @returns Array of created user data models
 */
export async function seedUsers(
  db: DatabaseType,
  roles: Array<RoleDataModel>
): Promise<Array<UserDataModel>> {
  console.log("🌱 Seeding users...");

  const remainingCount = Math.max(
    0,
    seedConfigs.targets.users - DEFAULT_USERS.length
  );

  const allowedRoles = roles.filter(({ roleName }) =>
    SYSTEM_ROLES.includes(roleName)
  );

  const defaultUsersData = buildDefaultUsersData(allowedRoles);
  const randomUsersData = buildRandomUsersData(allowedRoles, remainingCount);
  const allUsersData = [...defaultUsersData, ...randomUsersData];

  const users = await insertChunkedReturning(allUsersData, (chunk) =>
    db.insert(UserTable).values(chunk).returning()
  );

  await insertChunked(
    users.map((user) => {
      return {
        roleId: roles.find(({ roleName }) => roleName === user.role)!.id,
        userId: user.id,
      } satisfies InsertUserRole;
    }),
    (chunk) => db.insert(UserRoleTable).values(chunk)
  );

  console.log(`✅ ${users.length} Users seeded`);

  console.log("🌱 Seeding accounts...");

  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);

  const accountsData: Array<InsertAccount> = users.map((u) => ({
    accountId: u.id,
    providerId: "credential",
    password: hashedPassword,
    userId: u.id,
  }));

  await insertChunkedReturning(accountsData, (chunk) =>
    db.insert(AccountTable).values(chunk).returning()
  );

  console.log(`✅ ${accountsData.length} Accounts seeded`);

  return users;
}
