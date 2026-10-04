import { readSessionUser } from "@/lib/session";

export type AuditActor = {
  id: number | null;
  name: string | null;
  role: string | null;
};

export type AuditTarget = {
  id: string | null;
  name: string | null;
  type: string | null;
};

export type AuditListItem = {
  eventId: string;
  timestamp: string;
  event: string;
  category: string;
  actor: AuditActor;
  target: AuditTarget | null;
  action: string;
  outcome: string;
  description: string | null;
};

export type AuditPage = {
  items: AuditListItem[];
  total: number;
  page: number;
  limit: number;
};

export type AuditSummary = {
  total_activities: number;
  user_actions: number;
  system_actions: number;
  failed_actions: number;
};

export type AuditCategory = {
  code: string;
  name: string;
  count: number;
};

export type AuditDetail = {
  eventId: string;
  timestamp: string;
  actor: AuditActor;
  actorType: string;
  category: string;
  eventType: string;
  action: string;
  target: AuditTarget | null;
  outcome: string;
  description: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: string | null;
  metadata: Record<string, unknown> | null;
};

export type AuditQuery = {
  page?: number;
  limit?: number;
  timeRange?: "24h" | "7d" | "30d" | "90d";
  from_time?: string;
  to_time?: string;
  search?: string;
  action?: string;
  category?: string;
  actor?: string;
  outcome?: string;
  userId?: number;
};

function authHeaders(): HeadersInit {
  const token = readSessionUser()?.sessionId;
  if (!token) return {};
  return { authorization: `Bearer ${token}` };
}

function queryString(query: AuditQuery) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

async function readBody<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body && typeof body === "object" && "detail" in body ? String(body.detail) : "Activity log is unavailable";
    throw new Error(detail);
  }
  return body as T;
}

async function send<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    cache: "no-store",
    ...init,
    headers: { "content-type": "application/json", ...authHeaders(), ...init?.headers },
  });
  return readBody<T>(response);
}

export function fetchAuditSummary() {
  return send<AuditSummary>("/api/audit-logs/summary");
}

export function fetchAuditCategories() {
  return send<{ categories: AuditCategory[] }>("/api/audit-logs/categories");
}

export function fetchAuditLogs(query: AuditQuery) {
  return send<AuditPage>(`/api/audit-logs${queryString(query)}`);
}

export function fetchAuditDetail(eventId: string) {
  return send<AuditDetail>(`/api/audit-logs/${encodeURIComponent(eventId)}`);
}

export async function downloadAuditExport(query: AuditQuery) {
  const response = await fetch(`/api/audit-logs/export${queryString(query)}`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = body && typeof body === "object" && "detail" in body ? String(body.detail) : "Activity log is unavailable";
    throw new Error(detail);
  }
  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "activity-log.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}
