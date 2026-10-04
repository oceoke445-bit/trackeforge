export type UserStatus = "INACTIVE" | "ACTIVE" | "SUSPENDED" | "DISABLED";
export type Verification = "PENDING" | "VERIFIED";
export type AccessBinding = "BOUND" | "NO_BINDING";
export type BindingStatus = "ACTIVE" | "SUSPENDED" | "REVOKED";

export type UserItem = {
  id: number;
  identity_type: "HUMAN" | "SERVICE";
  name: string;
  username: string | null;
  email: string | null;
  department: string | null;
  verification: Verification;
  status: UserStatus;
  access_binding: AccessBinding;
};

export type UserDetail = UserItem & { title?: string | null; sponsor?: string | null };

export type UserSummary = {
  total_humans: number;
  active_humans: number;
  inactive_humans: number;
  total_services: number;
  pending_verification: number;
};

export type RoleItem = {
  id: number;
  name: string;
  display_name: string;
  duty_category: string;
  description: string;
  privilege_narrative: string | null;
  least_privilege_baseline: string | null;
  is_system: boolean;
  is_protected: boolean;
  assigned_users: number;
};

export type RoleSummary = {
  total: number;
  system_roles: number;
  protected_roles: number;
  custom_roles: number;
};

export type PermissionItem = {
  id: number;
  code: string;
  name: string;
  domain: string;
  action_type: "READ" | "ALL_ACTIONS";
  description: string | null;
};

export type BindingItem = {
  id: number;
  user_id: number;
  role_id: number;
  role: string | null;
  status: BindingStatus;
  valid_from: string | null;
  valid_until: string | null;
  description: string | null;
  access_binding: AccessBinding;
  user_status: UserStatus;
};

export type EffectiveAccess = {
  user_id: number;
  binding_id: number | null;
  binding_status: BindingStatus | null;
  role_id: number | null;
  role: string | null;
  permissions: string[];
};

export function hasPermission(granted: string[], domain: string, action: "read" | "all") {
  if (granted.includes(domain)) return true;
  if (action === "read") return granted.includes(`${domain}.read`);
  return false;
}

export function canRead(granted: string[], domain: string) {
  return hasPermission(granted, domain, "read");
}

export function canWrite(granted: string[], domain: string) {
  return hasPermission(granted, domain, "all");
}

async function readBody<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body && typeof body === "object" && "detail" in body ? String(body.detail) : "User access is unavailable";
    throw new Error(detail);
  }
  return body as T;
}

async function send<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, { cache: "no-store", ...init, headers: { "content-type": "application/json", ...init?.headers } });
  return readBody<T>(response);
}

export type LoginResult = {
  id: number;
  name: string;
  username: string | null;
  email: string | null;
  department: string | null;
  verification: Verification;
  status: UserStatus;
  access: EffectiveAccess;
  session_id: string;
};

export function loginAccount(account: string, password: string) {
  return send<LoginResult>("/api/access/users/login", {
    method: "POST",
    body: JSON.stringify({ account, password }),
  });
}

export function fetchUserSummary() {
  return send<UserSummary>("/api/access/users/summary");
}

export function fetchUsers(params: URLSearchParams) {
  return send<{ items: UserItem[]; total: number; page: number; limit: number }>(`/api/access/users?${params}`);
}

export function createHuman(body: { name: string; username: string; email: string; password: string; department?: string; title?: string }) {
  return send<Pick<UserItem, "id" | "name" | "verification" | "access_binding" | "status">>("/api/access/users/human", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateHuman(id: number, body: { name?: string; username?: string; email?: string; department?: string; title?: string; sponsor?: string; verification?: Verification }) {
  return send<UserDetail>(`/api/access/users/${id}/human`, { method: "PATCH", body: JSON.stringify(body) });
}

export function fetchUserPermissions(id: number) {
  return send<EffectiveAccess>(`/api/access/users/${id}/permissions`);
}

export function fetchRoleSummary() {
  return send<RoleSummary>("/api/access/roles/summary");
}

export function fetchRoles() {
  return send<{ items: RoleItem[] }>("/api/access/roles");
}

export function fetchRoleDetail(id: number) {
  return send<RoleItem & { permissions: { code: string }[] }>(`/api/access/roles/${id}/detail`);
}

export function createRole(body: { name: string; duty_category: string; description: string; privilege_narrative?: string; least_privilege_baseline?: string }) {
  return send<RoleItem>("/api/access/roles", { method: "POST", body: JSON.stringify(body) });
}

export function updateRole(id: number, body: { name: string; duty_category: string; description: string; privilege_narrative?: string; least_privilege_baseline?: string }) {
  return send<RoleItem>(`/api/access/roles/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export function deleteRole(id: number) {
  return send<void>(`/api/access/roles/${id}`, { method: "DELETE" });
}

export function fetchPermissionCatalog() {
  return send<{ items: PermissionItem[] }>("/api/access/permissions");
}

export function fetchRolePermissions(id: number) {
  return send<{ role_id: number; permissions: PermissionItem[] }>(`/api/access/roles/${id}/permissions`);
}

export function saveRolePermissions(id: number, permissionIds: number[]) {
  return send<{ role_id: number; permissions: PermissionItem[] }>(`/api/access/roles/${id}/permissions`, {
    method: "PATCH",
    body: JSON.stringify({ permissionIds }),
  });
}

export function fetchBindings(userId?: number) {
  const query = userId == null ? "" : `?user_id=${userId}`;
  return send<{ items: BindingItem[] }>(`/api/access/user-roles${query}`);
}

export function createBinding(body: { user_id: number; role_id: number; description?: string; valid_from?: string; valid_until?: string }) {
  return send<BindingItem>("/api/access/user-roles", { method: "POST", body: JSON.stringify(body) });
}

export function updateBindingStatus(id: number, status: BindingStatus) {
  return send<BindingItem>(`/api/access/user-roles/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}
