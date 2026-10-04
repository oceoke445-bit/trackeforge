const SESSION_KEY = "traxon-session";
const USER_KEY = "traxon-user";

export type SignedInUser = {
  id: number;
  name: string;
  username: string | null;
  role: string | null;
  permissions: string[];
  sessionId: string | null;
};

export function hasSession() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export function readSessionUser(): SignedInUser | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SignedInUser;
    if (typeof parsed.id !== "number" || typeof parsed.name !== "string" || !Array.isArray(parsed.permissions)) return null;
    return { ...parsed, sessionId: typeof parsed.sessionId === "string" ? parsed.sessionId : null };
  } catch {
    return null;
  }
}

export function startSession(user: SignedInUser) {
  sessionStorage.setItem(SESSION_KEY, "1");
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function endSession() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(USER_KEY);
}
