import { readSessionUser } from "@/lib/session";
import {
  scene,
  type OpStatus,
  type Operation,
} from "@/app/(platform)/operations/components/operations-data";

export type ApiOperationStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

export type OperationListItem = {
  id: number;
  operation_code: string;
  name: string;
  description: string | null;
  status: ApiOperationStatus;
  start_at: string;
  end_at: string;
  group_count: number;
  personnel_count: number;
  geofence_count: number;
  created_at: string;
};

export type OperationPage = {
  items: OperationListItem[];
  page: number;
  limit: number;
  total: number;
};

export type OperationSummary = {
  total: number;
  planning: number;
  active: number;
  on_hold: number;
  completed: number;
  cancelled: number;
};

export type OperationFilterOptions = {
  statuses: ApiOperationStatus[];
  groups: { id: number; name: string }[];
};

export type OperationGroupChoice = {
  id: number;
  name: string;
  personnel_count: number;
  commander_name: string | null;
};

export type OperationDetail = {
  id: number;
  operation_code: string;
  name: string;
  description: string | null;
  status: ApiOperationStatus;
  start_at: string;
  end_at: string;
  groups: { id: number; name: string; personnel_count: number }[];
  geofences: { id: number; name: string }[];
  summary: { group_count: number; personnel_count: number; geofence_count: number };
  created_by: { id: number; name: string };
  created_at: string;
};

export type OperationGroupItem = {
  id: number;
  name: string;
  commander: { id: number; name: string } | null;
  personnel_count: number;
  status: string;
};

export type OperationPersonnelItem = {
  soldier_id: number;
  group_id: number;
  group_name: string;
};

export type OperationMapPayload = {
  operation: Record<string, number | string>;
  groups: { id: number; name: string; personnel_count: number }[];
  personnel: OperationPersonnelItem[];
  geofences: { id: number; name: string; polygon: number[][] }[];
  positions: {
    soldier_id: number;
    group_id: number;
    group_name: string;
    latitude: number | null;
    longitude: number | null;
    event_time: string | null;
  }[];
};

export type OperationAlertItem = {
  id: number;
  type: string;
  severity: string;
  soldier_id: number | null;
  group_id: number | null;
  status: string;
  event_time: string;
};

export type OperationTicketItem = {
  id: number;
  ticket_code: string;
  status: string;
  priority: string;
  source_alert_id: number | null;
  alert_type: string | null;
};

export type OperationStatusAction = {
  action: "activate" | "hold" | "resume" | "complete" | "cancel";
  status: OpStatus;
  label: string;
};

export class OperationApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "OperationApiError";
    this.status = status;
  }
}

export const STATUS_MAP: Record<ApiOperationStatus, OpStatus> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const STATUS_TO_API: Record<OpStatus, ApiOperationStatus> = {
  Planning: "PLANNING",
  Active: "ACTIVE",
  "On Hold": "ON_HOLD",
  Completed: "COMPLETED",
  Cancelled: "CANCELLED",
};

export function statusActionsFor(current: OpStatus): OperationStatusAction[] {
  if (current === "Planning") {
    return [
      { action: "activate", status: "Active", label: "Activate" },
      { action: "cancel", status: "Cancelled", label: "Cancel operation" },
    ];
  }
  if (current === "Active") {
    return [
      { action: "hold", status: "On Hold", label: "Hold" },
      { action: "complete", status: "Completed", label: "Complete" },
      { action: "cancel", status: "Cancelled", label: "Cancel operation" },
    ];
  }
  if (current === "On Hold") {
    return [
      { action: "resume", status: "Active", label: "Resume" },
      { action: "complete", status: "Completed", label: "Complete" },
      { action: "cancel", status: "Cancelled", label: "Cancel operation" },
    ];
  }
  return [];
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

async function request<T>(path: string, init?: RequestInit, fallback = "Operations service is unavailable"): Promise<T> {
  const headers = new Headers(authHeaders(false));
  const extra = init?.headers;
  if (extra) {
    const other = new Headers(extra);
    other.forEach((value, key) => headers.set(key, value));
  }
  const response = await fetch(path, { cache: "no-store", ...init, headers });
  if (response.status === 204 || response.status === 205) return undefined as T;
  const body = await readBody(response);
  if (!response.ok) {
    throw new OperationApiError(response.status, errorMessage(body, fallback));
  }
  return body as T;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatStamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${pad(date.getDate())} ${months[date.getMonth()]} ${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDay(value: string) {
  return formatStamp(value).slice(0, 11);
}

function daySpan(startAt: string, endAt: string) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return "1 day";
  const days = Math.max(1, Math.ceil((end - start) / 86_400_000));
  return `${days} day${days === 1 ? "" : "s"}`;
}

/** Accept ISO-8601, datetime-local, or Date-parseable strings → UTC ISO for the API. */
export function toIsoInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00Z`;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}Z`;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new OperationApiError(400, "timestamp must be ISO-8601");
  }
  return parsed.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function toDatetimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function emptyOperation(base: Partial<Operation> = {}): Operation {
  const map = scene(106.845, -6.255, ["Alpha"]);
  return {
    id: "0",
    name: "Operation",
    sector: "Unassigned area",
    start: "",
    end: "",
    startAt: "",
    endAt: "",
    days: "1 day",
    status: "Planning",
    groups: 0,
    personnel: 0,
    weapons: 0,
    geofences: 0,
    devices: 0,
    photo: "/images/login-hero.jpg",
    focus: "Live operation",
    summary: "",
    createdBy: "System",
    createdAt: "",
    updatedAt: "",
    groupsActive: 0,
    personnelOnline: 0,
    weaponsOnline: 0,
    alerts: 0,
    critical: 0,
    groupRows: [],
    geofenceRows: [],
    alertRows: [],
    ticketRows: [],
    gateway: "Gateway",
    gatewayPlace: "Field",
    uplink: "—",
    signal: 0,
    timeline: [],
    ...map,
    ...base,
  };
}

export type OperationListQuery = {
  q?: string;
  status?: OpStatus | "All Status";
  groupId?: number | null;
  startFrom?: string | null;
  startTo?: string | null;
  page?: number;
  limit?: number;
};

export function buildOperationsQuery(input: OperationListQuery) {
  const params = new URLSearchParams();
  const q = input.q?.trim();
  if (q) params.set("q", q);
  if (input.status && input.status !== "All Status") params.set("status", STATUS_TO_API[input.status]);
  if (input.groupId != null) params.set("group_id", String(input.groupId));
  if (input.startFrom) params.set("start_from", input.startFrom);
  if (input.startTo) params.set("start_to", input.startTo);
  params.set("page", String(input.page ?? 1));
  params.set("limit", String(input.limit ?? 20));
  return params.toString();
}

export function mapListItemToOperation(item: OperationListItem): Operation {
  const status = STATUS_MAP[item.status] ?? "Planning";
  return emptyOperation({
    id: String(item.id),
    name: item.name,
    sector: item.operation_code,
    summary: item.description?.trim() || "No description.",
    status,
    startAt: formatStamp(item.start_at),
    endAt: formatStamp(item.end_at),
    start: formatDay(item.start_at),
    end: formatDay(item.end_at),
    days: daySpan(item.start_at, item.end_at),
    startAtIso: item.start_at,
    endAtIso: item.end_at,
    groups: item.group_count,
    personnel: item.personnel_count,
    geofences: item.geofence_count,
    devices: Math.max(0, item.personnel_count),
    createdAt: formatStamp(item.created_at),
    updatedAt: formatStamp(item.created_at),
    groupsActive: status === "Active" ? item.group_count : 0,
    personnelOnline: item.personnel_count,
  });
}

export function mapDetailToOperation(
  detail: OperationDetail,
  extras?: {
    map?: OperationMapPayload | null;
    groups?: OperationGroupItem[];
    personnel?: OperationPersonnelItem[];
    alerts?: OperationAlertItem[];
    tickets?: OperationTicketItem[];
  },
): Operation {
  const status = STATUS_MAP[detail.status] ?? "Planning";
  const groupItems = extras?.groups ?? detail.groups.map((group) => ({
    id: group.id,
    name: group.name,
    commander: null as { id: number; name: string } | null,
    personnel_count: group.personnel_count,
    status: status === "Active" ? "ACTIVE" : "PLANNING",
  }));
  const personnel = extras?.personnel ?? [];
  const groupRows = groupItems.map((group) => {
    const commander = group.commander?.name || "—";
    const members = personnel
      .filter((row) => row.group_id === group.id)
      .map((row) => String(row.soldier_id));
    return {
      name: group.name,
      count: group.personnel_count,
      commander,
      status: group.status === "ACTIVE" ? "Active" : status,
      members,
    };
  });

  const map = extras?.map ?? null;
  const positioned = (map?.positions ?? []).filter((row) => row.latitude != null && row.longitude != null);
  const centerLng = positioned[0]?.longitude ?? map?.geofences?.[0]?.polygon?.[0]?.[0] ?? 106.845;
  const centerLat = positioned[0]?.latitude ?? map?.geofences?.[0]?.polygon?.[0]?.[1] ?? -6.255;
  const names = groupRows.map((row) => row.name);
  const fallback = scene(centerLng, centerLat, names.length ? names : ["Alpha"]);
  const rings = (map?.geofences ?? [])
    .map((fence) => fence.polygon.map((point) => [point[0], point[1]] as [number, number]))
    .filter((ring) => ring.length >= 3);
  const ring = rings[0]?.length
    ? ([...rings[0], rings[0][0]] as [number, number][])
    : fallback.ring;
  const people = positioned.length
    ? positioned.map((row) => [row.longitude as number, row.latitude as number] as [number, number])
    : fallback.people;
  const pins = names.map((name, index) => {
    const match = positioned.find((row) => row.group_name === name);
    return {
      name,
      lng: match?.longitude ?? fallback.pins[index]?.lng ?? centerLng,
      lat: match?.latitude ?? fallback.pins[index]?.lat ?? centerLat,
    };
  });

  const alerts = extras?.alerts ?? [];
  const tickets = extras?.tickets ?? [];

  return emptyOperation({
    id: String(detail.id),
    name: detail.name,
    sector: detail.operation_code,
    summary: detail.description?.trim() || "No description.",
    status,
    startAt: formatStamp(detail.start_at),
    endAt: formatStamp(detail.end_at),
    start: formatDay(detail.start_at),
    end: formatDay(detail.end_at),
    days: daySpan(detail.start_at, detail.end_at),
    startAtIso: detail.start_at,
    endAtIso: detail.end_at,
    groupIds: detail.groups.map((item) => item.id),
    geofenceIds: detail.geofences.map((item) => item.id),
    groups: detail.summary.group_count,
    personnel: detail.summary.personnel_count,
    geofences: detail.summary.geofence_count,
    devices: detail.summary.personnel_count,
    createdBy: detail.created_by.name,
    createdAt: formatStamp(detail.created_at),
    updatedAt: formatStamp(detail.created_at),
    groupsActive: status === "Active" ? detail.summary.group_count : 0,
    personnelOnline: detail.summary.personnel_count,
    alerts: alerts.length,
    critical: alerts.filter((item) => item.severity === "CRITICAL").length,
    groupRows,
    geofenceRows: detail.geofences.map((item) => ({ id: item.id, name: item.name, type: "POLYGON" as const })),
    alertRows: alerts.map((item) => ({
      id: item.id,
      title: item.type,
      detail: `Soldier ${item.soldier_id ?? "—"} · ${formatStamp(item.event_time)} · ${item.status}`,
      level: item.severity,
      status: item.status,
    })),
    ticketRows: tickets.map((item) => ({
      id: item.id,
      code: item.ticket_code,
      status: item.status,
      priority: item.priority,
      alertType: item.alert_type || "—",
    })),
    center: [centerLng, centerLat],
    ring,
    route: pins.map((pin) => [pin.lng, pin.lat] as [number, number]),
    pins,
    people,
    weaponPins: [],
    alertPins: positioned.length
      ? alerts
        .map((alert) => {
          const pos = positioned.find((row) => row.soldier_id === alert.soldier_id);
          return pos ? [pos.longitude as number, pos.latitude as number] as [number, number] : null;
        })
        .filter((point): point is [number, number] => Boolean(point))
      : [],
    gatewayPin: fallback.gatewayPin,
    timeline: [{ time: formatStamp(detail.created_at).slice(-5), text: `${detail.name} synced` }],
  });
}

export async function fetchLiveOperations(query: OperationListQuery = {}): Promise<OperationPage> {
  const qs = buildOperationsQuery(query);
  return request<OperationPage>(`/api/operations?${qs}`, { headers: authHeaders() });
}

export async function fetchOperationSummary(): Promise<OperationSummary> {
  return request<OperationSummary>("/api/operations/summary", { headers: authHeaders() });
}

export async function fetchOperationFilterOptions(): Promise<OperationFilterOptions> {
  return request<OperationFilterOptions>("/api/operations/filters/options", { headers: authHeaders() });
}

export async function fetchOperationDetail(id: number): Promise<OperationDetail> {
  return request<OperationDetail>(`/api/operations/${id}`, { headers: authHeaders() });
}

export async function fetchOperationGroups(id: number): Promise<OperationGroupItem[]> {
  const body = await request<{ items: OperationGroupItem[] }>(`/api/operations/${id}/groups`, { headers: authHeaders() });
  return body.items;
}

export async function fetchOperationPersonnel(id: number): Promise<OperationPersonnelItem[]> {
  const body = await request<{ items: OperationPersonnelItem[] }>(`/api/operations/${id}/personnel`, { headers: authHeaders() });
  return body.items;
}

export async function fetchOperationMap(id: number): Promise<OperationMapPayload> {
  return request<OperationMapPayload>(`/api/operations/${id}/map`, { headers: authHeaders() });
}

export async function fetchOperationAlerts(id: number): Promise<OperationAlertItem[]> {
  const body = await request<{ items: OperationAlertItem[] }>(`/api/operations/${id}/alerts`, { headers: authHeaders() });
  return body.items;
}

export async function fetchOperationTickets(id: number): Promise<OperationTicketItem[]> {
  const body = await request<{ items: OperationTicketItem[] }>(`/api/operations/${id}/tickets`, { headers: authHeaders() });
  return body.items;
}

export async function fetchEnrichedOperation(id: number): Promise<Operation> {
  const [detail, groups, personnel, map, alerts, tickets] = await Promise.all([
    fetchOperationDetail(id),
    fetchOperationGroups(id).catch(() => [] as OperationGroupItem[]),
    fetchOperationPersonnel(id).catch(() => [] as OperationPersonnelItem[]),
    fetchOperationMap(id).catch(() => null),
    fetchOperationAlerts(id).catch(() => [] as OperationAlertItem[]),
    fetchOperationTickets(id).catch(() => [] as OperationTicketItem[]),
  ]);
  return mapDetailToOperation(detail, { map, groups, personnel, alerts, tickets });
}

export async function fetchOperationGroupChoices(): Promise<OperationGroupChoice[]> {
  const body = await request<{ items: OperationGroupChoice[] }>("/api/operations/groups/options", { headers: authHeaders() });
  return body.items;
}

export async function createLiveOperation(input: {
  name: string;
  description?: string;
  start_at: string;
  end_at: string;
  group_ids?: number[];
  geofence_ids?: number[];
}): Promise<OperationDetail> {
  return request<OperationDetail>(
    "/api/operations",
    {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({
        name: input.name,
        description: input.description?.trim() ? input.description.trim() : null,
        start_at: toIsoInput(input.start_at),
        end_at: toIsoInput(input.end_at),
        group_ids: input.group_ids ?? [],
        geofence_ids: input.geofence_ids ?? [],
      }),
    },
    "Unable to create operation",
  );
}

export async function patchLiveOperation(
  id: number,
  input: {
    name?: string;
    description?: string | null;
    start_at?: string;
    end_at?: string;
    group_ids?: number[];
    geofence_ids?: number[];
  },
): Promise<OperationDetail> {
  const body: Record<string, unknown> = {};
  if (input.name != null) body.name = input.name;
  if (input.description !== undefined) body.description = input.description;
  if (input.start_at != null) body.start_at = toIsoInput(input.start_at);
  if (input.end_at != null) body.end_at = toIsoInput(input.end_at);
  if (input.group_ids != null) body.group_ids = input.group_ids;
  if (input.geofence_ids != null) body.geofence_ids = input.geofence_ids;
  return request<OperationDetail>(
    `/api/operations/${id}`,
    {
      method: "PATCH",
      headers: authHeaders(true),
      body: JSON.stringify(body),
    },
    "Unable to update operation",
  );
}

export async function transitionOperation(id: number, action: OperationStatusAction["action"]): Promise<OperationDetail> {
  return request<OperationDetail>(
    `/api/operations/${id}/${action}`,
    { method: "POST", headers: authHeaders() },
    `Unable to ${action} operation`,
  );
}

export async function addOperationGroup(operationId: number, groupId: number): Promise<OperationDetail> {
  return request<OperationDetail>(
    `/api/operations/${operationId}/groups`,
    {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ group_id: groupId }),
    },
    "Unable to add group",
  );
}

export async function removeOperationGroup(operationId: number, groupId: number): Promise<OperationDetail> {
  return request<OperationDetail>(
    `/api/operations/${operationId}/groups/${groupId}`,
    { method: "DELETE", headers: authHeaders() },
    "Unable to remove group",
  );
}

export async function addOperationGeofence(operationId: number, geofenceId: number): Promise<OperationDetail> {
  return request<OperationDetail>(
    `/api/operations/${operationId}/geofences`,
    {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ geofence_id: geofenceId }),
    },
    "Unable to add geofence",
  );
}

export async function removeOperationGeofence(operationId: number, geofenceId: number): Promise<OperationDetail> {
  return request<OperationDetail>(
    `/api/operations/${operationId}/geofences/${geofenceId}`,
    { method: "DELETE", headers: authHeaders() },
    "Unable to remove geofence",
  );
}

export async function deleteLiveOperation(id: number): Promise<void> {
  await request<void>(
    `/api/operations/${id}`,
    { method: "DELETE", headers: authHeaders() },
    "Unable to delete operation",
  );
}
