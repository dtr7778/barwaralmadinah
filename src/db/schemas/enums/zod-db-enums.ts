import z from "zod";

import {
  ACTION_TYPE,
  ADDRESS_TYPE,
  PERMISSION_LEVEL,
  RESOURCE_TYPE,
  ROLES,
  USER_EVENT_TYPE,
} from "./enum-values";

export const RoleEnumSchema = z.enum(ROLES);
export type RoleEnumType = z.infer<typeof RoleEnumSchema>;

export const PermissionLevelEnumSchema = z.enum(PERMISSION_LEVEL);
export type PermissionLevelEnumType = z.infer<typeof PermissionLevelEnumSchema>;

export const ResourceTypeEnumSchema = z.enum(RESOURCE_TYPE);
export type ResourceTypeEnumType = z.infer<typeof ResourceTypeEnumSchema>;

export const ActionTypeEnumSchema = z.enum(ACTION_TYPE);
export type ActionTypeEnumType = z.infer<typeof ActionTypeEnumSchema>;

export const AddressTypeEnumSchema = z.enum(ADDRESS_TYPE);
export type AddressTypeEnumType = z.infer<typeof AddressTypeEnumSchema>;

export const UserEventTypeEnumSchema = z.enum(USER_EVENT_TYPE);
export type UserEventTypeEnumType = z.infer<typeof UserEventTypeEnumSchema>;
