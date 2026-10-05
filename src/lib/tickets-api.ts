import { readSessionUser } from "@/lib/session";
import {
  TICKET_ALERT_TYPES,
  TICKET_GROUPS,
  type TicketAlertType,
  type TicketGroup,
  type TicketItem,
  type TicketPriority,
  type TicketStatus,
} from "@/app/(platform)/tickets/components/tickets-data";

export type ApiTicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";
export type ApiTicketPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type ApiTaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type TicketPerson = {
  id: number;
  full_name: string | null;
  username: string | null;
  role: string | null;
};

export type TicketSourceAlert = {
  id: number;
  alert_code: string;
  type: string;
  severity: string;
  status: string;
  soldier_id: number | null;
  group_id: string | null;
  event_time: string;
  position_source: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type TicketTask = {
  id: number;
  title: string;
  description: string | null;
  assignee: TicketPerson | null;
  priority: ApiTicketPriority;
  status: ApiTaskStatus;
  created_by: TicketPerson;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type TicketUpdate = {
  id: number;
  message: string;
  created_at: string;
  author: TicketPerson;
};

export type TicketDetail = {
  id: number;
  ticket_code: string;
  status: ApiTicketStatus;
  priority: ApiTicketPriority;
  source_alert: TicketSourceAlert;
  created_by: TicketPerson;
  assignee: TicketPerson | null;
  collaborators: TicketPerson[];
  response_plan: string | null;
  tasks: TicketTask[];
  updates: TicketUpdate[];
  created_at: string;
  updated_at: string;
  started_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
};

type ApiListTicket = {
  id: number;
  ticket_code: string;
  source_alert_id: number;
  source_alert_code: string;
  alert_type: string;
  title: string;
  description: string;
  soldier_id: number | null;
  group_id: string | null;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  assignee: TicketPerson | null;
  created_by: TicketPerson;
};

export type TicketSummary = {
  total: number;
  by_status: { value: string; count: number }[];
  by_priority: { value: string; count: number }[];
};

export type TicketTimeRange = "all" | "30d";

export type TicketFilterOptions = {
  statuses: string[];
  priorities: string[];
  alert_types: string[];
  groups: string[];
  time_ranges?: TicketTimeRange[];
};

export class TicketApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "TicketApiError";
    this.status = status;
  }
}

function authHeaders(json = false): HeadersInit {
  const headers: Record<string, string> = {};
  const token = readSessionUser()?.sessionId;
  if (token) headers.authorization = `Bearer ${token}`;
  if (json) headers["content-type"] = "application/json";
  return headers;
}

async function readBody(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { detail: text };
  }
}

function errorMessage(body: Record<string, unknown>, fallback: string) {
  const detail = body.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const first = detail[0];
    if (first && typeof first === "object" && "msg" in first) return String((first as { msg: unknown }).msg);
  }
  return fallback;
}

async function request<T>(path: string, init?: RequestInit, fallback = "Tickets service is unavailable"): Promise<T> {
  const response = await fetch(path, { cache: "no-store", ...init });
  const body = await readBody(response);
  if (!response.ok) {
    throw new TicketApiError(response.status, errorMessage(body, fallback));
  }
  return body as T;
}

function titleWords(value: string) {
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => (part === "sos" ? "SOS" : part.slice(0, 1).toUpperCase() + part.slice(1)))
    .join(" ");
}

export function toUiStatus(value: string): TicketStatus {
  const key = value.toUpperCase().replace(/\s+/g, "_");
  if (key === "IN_PROGRESS") return "In Progress";
  if (key === "WAITING") return "Waiting";
  if (key === "RESOLVED") return "Resolved";
  if (key === "CLOSED") return "Closed";
  return "Open";
}

export function toApiStatus(value: TicketStatus): ApiTicketStatus {
  if (value === "In Progress") return "IN_PROGRESS";
  if (value === "Waiting") return "WAITING";
  if (value === "Resolved") return "RESOLVED";
  if (value === "Closed") return "CLOSED";
  return "OPEN";
}

export function toUiPriority(value: string): TicketPriority {
  const key = value.toUpperCase();
  if (key === "CRITICAL") return "Critical";
  if (key === "HIGH") return "High";
  if (key === "LOW") return "Low";
  return "Medium";
}

export function toApiPriority(value: TicketPriority): ApiTicketPriority {
  return value.toUpperCase() as ApiTicketPriority;
}

export function mapAlertType(value: string): TicketAlertType {
  const label = titleWords(value);
  const match = TICKET_ALERT_TYPES.find((item) => item.toLowerCase() === label.toLowerCase());
  if (match) return match;
  if (label.toLowerCase().includes("battery")) return "Low Battery";
  if (label.toLowerCase().includes("geofence")) return "Out of Geofence";
  if (label.toLowerCase().includes("movement") || label.toLowerCase().includes("casualty")) return "No Movement";
  if (label.toLowerCase().includes("device") || label.toLowerCase().includes("strap")) return "Device Issue";
  if (label.toLowerCase().includes("temp") || label.toLowerCase().includes("heat")) return "High Temperature";
  if (label.toLowerCase().includes("health") || label.toLowerCase().includes("heart") || label.toLowerCase().includes("arrhythmia")) {
    return "Health";
  }
  if (label === "SOS") return "SOS";
  return "Others";
}

function mapGroup(value: string | null): TicketGroup | string {
  if (!value) return "Alpha";
  const match = TICKET_GROUPS.find((item) => item.toLowerCase() === value.toLowerCase());
  return match ?? value;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

const TONES = ["blue", "green", "amber", "purple"] as const;

export function personTone(id: number) {
  return TONES[Math.abs(id) % TONES.length];
}

export function personLabel(person: TicketPerson | null | undefined) {
  if (!person) return "";
  return person.full_name || person.username || `User ${person.id}`;
}

export function formatStamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(date)} WIB`;
}

export function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(date)} WIB`;
}

export function mapListTicket(item: ApiListTicket): TicketItem {
  const name = personLabel(item.assignee);
  return {
    id: item.ticket_code,
    apiId: item.id,
    alertType: mapAlertType(item.alert_type),
    apiAlertType: item.alert_type,
    title: item.title,
    description: item.description || "",
    soldier: item.soldier_id == null ? "—" : `S-${item.soldier_id}`,
    group: mapGroup(item.group_id),
    priority: toUiPriority(item.priority),
    status: toUiStatus(item.status),
    createdAt: formatStamp(item.created_at),
    sourceAlertCode: item.source_alert_code,
    assignee: item.assignee
      ? {
          name: name || "User",
          initials: initials(name || "User"),
          tone: personTone(item.assignee.id),
        }
      : null,
  };
}

export function ticketQuery(input: {
  statuses: TicketStatus[];
  priorities: TicketPriority[];
  alertTypes: string[];
  groups: string[];
  allStatuses: number;
  allPriorities: number;
  allAlertTypes: number;
  allGroups: number;
  timeRange?: TicketTimeRange;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (input.statuses.length > 0 && input.statuses.length < input.allStatuses) {
    for (const status of input.statuses) params.append("status", toApiStatus(status));
  }
  if (input.priorities.length > 0 && input.priorities.length < input.allPriorities) {
    for (const priority of input.priorities) params.append("priority", toApiPriority(priority));
  }
  if (input.alertTypes.length > 0 && input.alertTypes.length < input.allAlertTypes) {
    for (const type of input.alertTypes) params.append("alert_type", type);
  }
  if (input.groups.length > 0 && input.groups.length < input.allGroups) {
    for (const group of input.groups) params.append("group_id", group);
  }
  if (input.timeRange) params.set("timeRange", input.timeRange);
  if (input.q?.trim()) params.set("q", input.q.trim());
  params.set("limit", String(input.limit ?? 100));
  params.set("offset", String(input.offset ?? 0));
  return params;
}

export async function fetchLiveTickets(params?: URLSearchParams) {
  const query = params ?? new URLSearchParams({ limit: "100", offset: "0" });
  const page = await request<{ items: ApiListTicket[]; total: number; limit: number; offset: number }>(
    `/api/tickets?${query}`,
    { headers: authHeaders() },
  );
  return {
    items: (page.items || []).map(mapListTicket),
    total: page.total ?? 0,
  };
}

export async function fetchTicketSummary(timeRange: TicketTimeRange = "all") {
  const params = new URLSearchParams({ timeRange });
  return request<TicketSummary>(`/api/tickets/summary?${params}`, { headers: authHeaders() });
}

export async function fetchTicketFilterOptions() {
  return request<TicketFilterOptions>("/api/tickets/filters/options", { headers: authHeaders() });
}

export async function fetchTicketDetail(id: number) {
  return request<TicketDetail>(`/api/tickets/${id}`, { headers: authHeaders() }, "Ticket not found");
}

export async function createTicketFromAlert(alertId: number) {
  return request<TicketDetail>(
    `/api/alerts/${alertId}/ticket`,
    { method: "POST", headers: authHeaders() },
    "Could not create ticket from alert",
  );
}

export async function patchTicket(id: number, body: { response_plan?: string | null; priority?: ApiTicketPriority }) {
  return request<TicketDetail>(`/api/tickets/${id}`, {
    method: "PATCH",
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });
}

export async function assignTicket(id: number, userId: number) {
  return request<TicketDetail>(`/api/tickets/${id}/assign`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function startWorking(id: number) {
  return request<TicketDetail>(`/api/tickets/${id}/start-working`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export async function markWaiting(id: number) {
  return request<TicketDetail>(`/api/tickets/${id}/waiting`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export async function resolveTicket(id: number) {
  return request<TicketDetail>(`/api/tickets/${id}/resolve`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export async function closeTicket(id: number) {
  return request<TicketDetail>(`/api/tickets/${id}/close`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export async function addCollaborator(id: number, userId: number) {
  return request<TicketDetail>(`/api/tickets/${id}/collaborators`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function removeCollaborator(id: number, userId: number) {
  return request<TicketDetail>(`/api/tickets/${id}/collaborators/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function addTask(
  id: number,
  body: { title: string; description?: string | null; assignee_id?: number | null; priority?: ApiTicketPriority },
) {
  return request<TicketTask>(
    `/api/tickets/${id}/tasks`,
    {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(body),
    },
    "Could not create task",
  );
}

export async function patchTask(
  ticketId: number,
  taskId: number,
  body: {
    title?: string;
    description?: string | null;
    assignee_id?: number | null;
    priority?: ApiTicketPriority;
    status?: ApiTaskStatus;
  },
) {
  return request<TicketTask>(`/api/tickets/${ticketId}/tasks/${taskId}`, {
    method: "PATCH",
    headers: authHeaders(true),
    body: JSON.stringify(body),
  });
}

export async function postTicketUpdate(id: number, message: string) {
  return request<TicketUpdate>(
    `/api/tickets/${id}/updates`,
    {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ message }),
    },
    "Could not post update",
  );
}

export function summaryStatusCount(summary: TicketSummary | null, status: TicketStatus) {
  if (!summary) return 0;
  const key = toApiStatus(status);
  return summary.by_status.find((row) => row.value === key)?.count ?? 0;
}

export function summaryPriorityCount(summary: TicketSummary | null, priority: TicketPriority) {
  if (!summary) return 0;
  const key = toApiPriority(priority);
  return summary.by_priority.find((row) => row.value === key)?.count ?? 0;
}
