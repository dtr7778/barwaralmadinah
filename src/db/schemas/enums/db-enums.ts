import { text } from "drizzle-orm/sqlite-core";

import { ADDRESS_TYPE, ROLES, USER_EVENT_TYPE } from "./enum-values";

export const RoleEnum = (name: string) => text(name, { enum: ROLES });

export const AddressTypeEnum = (name: string) =>
  text(name, { enum: ADDRESS_TYPE });

export const UserEventTypeEnum = (name: string) =>
  text(name, { enum: USER_EVENT_TYPE });
