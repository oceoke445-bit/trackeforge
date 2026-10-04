import type { AlertItem, AlertType, Severity } from "@/app/(platform)/alerts/components/alerts-data";

export const ALERT_CLOCK = "2026-10-04T12:00:00Z";

const TYPE_LABEL: Record<string, AlertType> = {
  SOS: "SOS",
  CASUALTY: "Casualty",
  ARRHYTHMIA: "Arrhythmia",
  LOW_BATTERY: "Low Battery",
  HEAT_STRESS: "Heat Stress",
  STRAP_DISCONNECTED: "Strap Disconnected",
  NO_CONTACT: "No Contact",
};

const API_TYPE: Record<AlertType, string> = {
  SOS: "SOS",
  Casualty: "CASUALTY",
  Arrhythmia: "ARRHYTHMIA",
  "Low Battery": "LOW_BATTERY",
  "Heat Stress": "HEAT_STRESS",
  "Strap Disconnected": "STRAP_DISCONNECTED",
  "No Contact": "NO_CONTACT",
};

const RANGE_MS = { "1h": 3_600_000, "6h": 21_600_000, "24h": 86_400_000, "7d": 604_800_000 } as const;

export type AlertRange = keyof typeof RANGE_MS;

type ApiAlert = {
  id: number;
  alert_code: string;
  alert_type: string;
  severity: string;
  status: string;
  soldier_id: number | null;
  group_id: string | null;
  event_time: string;
  last_seen_at: string;
  position_source: string | null;
  latitude: number | null;
  longitude: number | null;
  message: string;
  details: Record<string, unknown>;
  source_record: { data?: Record<string, unknown> } | null;
};

export type AlertSummary = {
  total: number;
  critical: number;
  warning: number;
  info: number;
  byType: Record<string, number>;
};

function clockMs() {
  return Date.parse(ALERT_CLOCK);
}

function iso(ms: number) {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function alertWindow(range: AlertRange) {
  const end = clockMs();
  return { from_time: iso(end - RANGE_MS[range]), to_time: ALERT_CLOCK };
}

export function alertQuery(input: {
  range: AlertRange;
  severities: Severity[];
  types: AlertType[];
  groups: string[];
  allSeverities: number;
  allTypes: number;
}) {
  const params = new URLSearchParams(alertWindow(input.range));
  if (input.severities.length > 0 && input.severities.length < input.allSeverities) {
    for (const severity of input.severities) params.append("severity", severity.toUpperCase());
  }
  if (input.types.length > 0 && input.types.length < input.allTypes) {
    for (const type of input.types) params.append("alert_type", API_TYPE[type]);
  }
  if (input.groups.length === 1) params.set("group_id", input.groups[0]);
  return params;
}

function titleStatus(status: string) {
  const lower = status.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function vital(data: Record<string, unknown> | undefined, key: string, unit: string) {
  const value = data?.[key];
  if (typeof value !== "number" && typeof value !== "string") return null;
  return `${value} ${unit}`;
}

export function toAlertItem(item: ApiAlert): AlertItem {
  const end = clockMs();
  const event = Date.parse(item.event_time);
  const seen = Date.parse(item.last_seen_at);
  const data = item.source_record?.data;
  const severity = item.severity.toLowerCase() as Severity;
  const type = TYPE_LABEL[item.alert_type] ?? "SOS";
  const when = new Date(item.event_time);
  return {
    id: item.alert_code,
    apiId: item.id,
    apiStatus: item.status,
    minutesAgo: Math.max(0, Math.round((end - event) / 60_000)),
    date: `${String(when.getUTCDate()).padStart(2, "0")} Oct 2026`,
    clock: `${String(when.getUTCHours()).padStart(2, "0")}:${String(when.getUTCMinutes()).padStart(2, "0")}`,
    severity: severity === "critical" || severity === "warning" || severity === "info" ? severity : "info",
    type,
    soldier: item.soldier_id != null ? `S-${item.soldier_id}` : "—",
    group: item.group_id ?? "—",
    details: item.message,
    position: item.position_source ?? "Unknown",
    lastSeen: Number.isNaN(seen) ? "—" : `${Math.max(0, Math.round((end - seen) / 60_000))} minutes ago`,
    lng: item.longitude ?? 106.845,
    lat: item.latitude ?? -6.208,
    status: titleStatus(item.status),
    battery: vital(data, "batt", "%") ?? "—",
    hr: vital(data, "hr", "bpm"),
    hrv: vital(data, "hrv", "ms"),
    temp: vital(data, "temp", "°C"),
  };
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`Alerts request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export function summaryTypeCount(summary: AlertSummary, type: AlertType) {
  return summary.byType[API_TYPE[type]] ?? 0;
}

export async function fetchLiveAlerts(params: URLSearchParams) {
  const query = new URLSearchParams(params);
  query.set("limit", "500");
  query.set("offset", "0");
  const [page, summary, sos] = await Promise.all([
    readJson<{ items: ApiAlert[]; total: number }>(await fetch(`/api/alerts?${query}`, { cache: "no-store" })),
    readJson<{ total: number; by_severity: { severity: string; count: number }[]; by_type: { alert_type: string; count: number }[] }>(
      await fetch(`/api/alerts/summary?${params}`, { cache: "no-store" }),
    ),
    readJson<{ items: ApiAlert[]; total: number }>(await fetch("/api/alerts/sos", { cache: "no-store" })),
  ]);
  const counts = { critical: 0, warning: 0, info: 0 };
  for (const row of summary.by_severity) {
    const key = row.severity.toLowerCase();
    if (key === "critical" || key === "warning" || key === "info") counts[key] = row.count;
  }
  const byType: Record<string, number> = {};
  for (const row of summary.by_type) byType[row.alert_type] = row.count;
  return {
    items: page.items.map(toAlertItem),
    total: page.total,
    summary: { total: summary.total, ...counts, byType },
    sos: sos.items.map(toAlertItem),
  };
}

export async function postAlertAction(id: number, action: "acknowledge" | "resolve") {
  const response = await fetch(`/api/alerts/${id}/${action}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ by: "operator-1" }),
  });
  return toAlertItem(await readJson<ApiAlert>(response));
}
