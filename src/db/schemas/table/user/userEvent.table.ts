import { relations } from "drizzle-orm";
import { foreignKey, index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

import { db_created_at, db_id } from "@/db/utils/db-utils";
import { UserEventTypeEnum } from "../../enums/db-enums";
import { UserTable } from "./user.table";
import { UserDeviceTable } from "./userDevice.table";

export const UserEventTable = sqliteTable(
  "user_events",
  {
    id: db_id,
    userId: text("user_id"),
    email: text("email"),
    event: UserEventTypeEnum("event").notNull(),
    sessionId: text("session_id"),
    deviceId: text("device_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: db_created_at,
  },
  (table) => [
    foreignKey({
      name: "user_event_user_fkey",
      columns: [table.userId],
      foreignColumns: [UserTable.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "user_event_device_fkey",
      columns: [table.deviceId],
      foreignColumns: [UserDeviceTable.id],
    }).onDelete("set null"),
    index("user_event_user_id_idx").on(table.userId),
    index("user_event_event_idx").on(table.event),
    index("user_event_created_at_idx").on(table.createdAt),
    index("user_event_session_id_idx").on(table.sessionId),
  ]
);

export const UserEventRelations = relations(UserEventTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [UserEventTable.userId],
    references: [UserTable.id],
    relationName: "UserEventToUser",
  }),
  device: one(UserDeviceTable, {
    fields: [UserEventTable.deviceId],
    references: [UserDeviceTable.id],
    relationName: "UserEventToUserDevice",
  }),
}));

export const insertUserEventSchema = createInsertSchema(UserEventTable, {
  userId: z.uuid().nullish(),
  deviceId: z.uuid().nullish(),
}).omit({
  id: true,
  createdAt: true,
});
export const selectUserEventSchema = createSelectSchema(UserEventTable, {
  id: z.uuid(),
  userId: z.uuid().nullish(),
  deviceId: z.uuid().nullish(),
});
export const updateUserEventSchema = createUpdateSchema(UserEventTable, {
  userId: z.uuid().nullish(),
  deviceId: z.uuid().nullish(),
}).omit({
  id: true,
  createdAt: true,
});

export type UserEventDataModel = typeof UserEventTable.$inferSelect;
export type InsertUserEvent = z.infer<typeof insertUserEventSchema>;
export type SelectUserEvent = z.infer<typeof selectUserEventSchema>;
export type UpdateUserEvent = z.infer<typeof updateUserEventSchema>;
