import { relations } from "drizzle-orm";
import { numeric, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

import { db_created_at, db_id, db_updated_at } from "@/db/utils/db-utils";
import { AddressTypeEnum } from "../enums/db-enums";

export const AddressTable = sqliteTable("addresses", {
  id: db_id,

  type: AddressTypeEnum("type").notNull().default("other"),

  streetLine1: text("street_line_1").notNull(),
  streetLine2: text("street_line_2"),
  city: text("city").notNull(),
  state: text("state"),
  zipCode: text("zip_code").notNull(),
  country: text("country").notNull(),

  latitude: numeric("latitude"),
  longitude: numeric("longitude"),

  notes: text("notes"),

  createdAt: db_created_at,
  updatedAt: db_updated_at,
});

export const AddressRelations = relations(AddressTable, () => ({}));

export const insertAddressSchema = createInsertSchema(AddressTable).omit({
  id: true,
  updatedAt: true,
  createdAt: true,
});
export const selectAddressSchema = createSelectSchema(AddressTable, {
  id: z.uuid(),
});
export const updateAddressSchema = createUpdateSchema(AddressTable).omit({
  id: true,
  updatedAt: true,
  createdAt: true,
});

export type AddressDataModel = typeof AddressTable.$inferSelect;
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type SelectAddress = z.infer<typeof selectAddressSchema>;
export type UpdateAddress = z.infer<typeof updateAddressSchema>;
