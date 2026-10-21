import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { describe, expect, test } from "vitest";

import {
  db_bool,
  db_created_at,
  db_date,
  db_id,
  db_updated_at,
} from "../db-utils";
import { buildPaginateOptions } from "./buildPaginateOptions";

describe("buildPaginateOptions", () => {
  const UserTable = sqliteTable("users", {
    id: db_id,
    name: text("name", { length: 255 }).notNull(),
    email: text("email", { length: 255 }).notNull(),
    emailVerified: db_bool("email_verified").notNull().default(false),
    image: text("image", { length: 255 }),
    role: text("role", { length: 255 }),
    banned: db_bool("banned").default(false),
    banReason: text("ban_reason", { length: 255 }),
    banExpires: db_date("ban_expires"),
    createdAt: db_created_at,
    updatedAt: db_updated_at,
  });

  test("should build paginate options", () => {
    const paginateOptions = buildPaginateOptions(
      {
        id: UserTable.id,
        name: UserTable.name,
        email: UserTable.email,
        emailVerified: UserTable.emailVerified,
        image: UserTable.image,
        role: UserTable.role,
        banned: UserTable.banned,
        banReason: UserTable.banReason,
        banExpires: UserTable.banExpires,
        createdAt: UserTable.createdAt,
        updatedAt: UserTable.updatedAt,
      },
      {
        search: "test",
        searchFields: ["name", "email"],
        filter: {},
        orderField: "createdAt",
        order: "asc",
        page: 1,
        limit: 10,
      }
    );

    expect(paginateOptions).include({
      limit: 10,
      offset: 0,
      page: 1,
    });
  });
});
