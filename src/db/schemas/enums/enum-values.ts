export const ROLES = ["USER", "SUPPORT_AGENT", "ADMIN", "SUPER_ADMIN"] as const;

export const PERMISSION_LEVEL = ["system", "self"] as const;
export const RESOURCE_TYPE = ["user", "role_permission", "report"] as const;
export const ACTION_TYPE = [
  "create",
  "read",
  "list",
  "update",
  "delete",
  "manage",
  "export",
] as const;

export const ADDRESS_TYPE = [
  "billing",
  "shipping",
  "office",
  "home",
  "work",
  "other",
] as const;

export const USER_EVENT_TYPE = [
  "auth.login",
  "auth.logout",
  "auth.login_failed",
  "auth.password_changed",
  "auth.password_reset",
  "device.new_detected",
  "admin.impersonation",
] as const;
