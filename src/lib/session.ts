const SESSION_KEY = "traxon-session";

export function hasSession() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export function startSession() {
  sessionStorage.setItem(SESSION_KEY, "1");
}

export function endSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
