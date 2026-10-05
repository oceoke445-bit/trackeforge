import { readSessionUser, startSession } from "@/lib/session";

export type ProfileRole = {
  id: number;
  name: string;
} | null;

export type ProfileUser = {
  id: number;
  identityType: "HUMAN" | "SERVICE";
  fullName: string;
  username: string | null;
  email: string | null;
  profileImageUrl: string | null;
  department: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DISABLED";
  verification: "VERIFIED" | "PENDING";
  accessBinding: "BOUND" | "NO_BINDING";
  role: ProfileRole;
  accountType: "Human" | "Service";
  lastLoginAt: string | null;
  loginMethod: string;
  memberSince: string;
};

type ProfileResponse = { user: ProfileUser };

function authHeaders(): HeadersInit {
  const token = readSessionUser()?.sessionId;
  if (!token) return {};
  return { authorization: `Bearer ${token}` };
}

function detailOf(body: unknown, fallback: string) {
  if (body && typeof body === "object" && "detail" in body && typeof body.detail === "string") return body.detail;
  return fallback;
}

async function readProfile(response: Response): Promise<ProfileUser> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(detailOf(body, "Profile is unavailable"));
  return (body as ProfileResponse).user;
}

export function rememberProfile(user: ProfileUser) {
  const current = readSessionUser();
  if (!current) return;
  const role = user.role?.name ?? null;
  if (current.id === user.id && current.name === user.fullName && current.username === user.username && current.role === role) return;
  startSession({
    ...current,
    id: user.id,
    name: user.fullName,
    username: user.username,
    role,
  });
}

export async function fetchMyProfile() {
  const response = await fetch("/api/access/auth/me", { cache: "no-store", headers: authHeaders() });
  return readProfile(response);
}

export async function updateMyProfile(fields: { fullname?: string; email?: string; profileImage?: File }) {
  const body = new FormData();
  if (fields.fullname !== undefined) body.append("fullname", fields.fullname);
  if (fields.email !== undefined) body.append("email", fields.email);
  if (fields.profileImage) body.append("profile_image", fields.profileImage);
  const response = await fetch("/api/access/users/me", {
    method: "PATCH",
    headers: authHeaders(),
    body,
  });
  return readProfile(response);
}

export async function fetchProfileImage() {
  const response = await fetch("/api/access/users/me/profile-image", { cache: "no-store", headers: authHeaders() });
  if (response.status === 404) return null;
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(detailOf(body, "Profile photo is unavailable"));
  }
  return URL.createObjectURL(await response.blob());
}

export async function removeProfileImage() {
  const response = await fetch("/api/access/users/me/profile-image", {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (response.status === 204) return;
  const body = await response.json().catch(() => ({}));
  throw new Error(detailOf(body, "Profile photo could not be removed"));
}
