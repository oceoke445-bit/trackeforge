import type { TrackPoint, TrackSource } from "@/app/(platform)/groups/components/history-track";

export const HISTORY_END = "2026-10-04T08:30:00Z";
export const HISTORY_SEED_START = "2026-10-04T08:00:00Z";

const TYPE_API = {
  telemetry: "TELEMETRY",
  mesh: "MESH_FRAME",
  uplink: "UPLINK",
  beacon: "BEACON",
  special: "SPECIAL",
  system: "SYSTEM",
} as const;

const SOURCE_API: Record<TrackSource, string> = {
  GNSS: "GNSS",
  "Dead Reckoning": "DEAD_RECKONING",
  "Trilateration / RSSI": "TRILATERATION",
  "Stale / Unknown": "STALE",
};

const SOURCE_LABEL: Record<string, TrackSource> = {
  GNSS: "GNSS",
  DEAD_RECKONING: "Dead Reckoning",
  TRILATERATION: "Trilateration / RSSI",
  STALE: "Stale / Unknown",
};

const KIND_LABEL: Record<string, TrackPoint["kind"]> = {
  TELEMETRY: "Telemetry",
  MESH_FRAME: "Mesh Frame",
  UPLINK: "Uplink",
  BEACON: "Beacon",
  SPECIAL: "Special",
  SYSTEM: "System",
};

export type HistoryDataTypeId = keyof typeof TYPE_API;

export type HistoryItem = {
  id: string;
  source_type: "RECORD";
  source_id: number;
  event_time: string;
  received_at: string | null;
  data_type: string;
  category: string;
  entity_type: string | null;
  entity_id: string | null;
  soldier_id: number | null;
  group_id: string | null;
  gateway_id: string | null;
  position_source: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type HistoryCards = {
  total_distance_km: number;
  distance_is_derived: boolean;
  heart_rate_avg_bpm: number | null;
  battery_avg_percent: number | null;
  total_records: number;
};

export type HistoryNamedCount = { name: string; count: number };

export type HistoryStatistics = {
  total_records: number;
  position_points: number;
  soldiers: number;
  by_data_type: HistoryNamedCount[];
  by_position_source: HistoryNamedCount[];
};

export type HistoryChartBucket = {
  time: string;
  heart_rate_avg_bpm: number | null;
  battery_avg_percent: number | null;
  samples: number;
};

export type HistoryTrackPoint = {
  id: string;
  source_id: number;
  soldier_id: number | null;
  event_time: string;
  latitude: number;
  longitude: number;
  position_source: string | null;
};

export type HistoryFilterOptions = {
  data_types: string[];
  position_sources: string[];
  gateways: string[];
  soldiers: number[];
  groups: string[];
};

export type HistoryPointDetail = HistoryItem & {
  transport: string | null;
  details: {
    position?: { latitude?: number | null; longitude?: number | null; position_source?: string | null };
    vitals?: { hr?: number | null; hrv?: number | null; spo2?: number | null; temp?: number | null };
    device?: { batt?: number | null; flags?: { sos?: boolean; strap_connected?: boolean; position_source?: string } };
    communication?: {
      transport?: string;
      gateway_id?: string;
      hop_count?: number;
      rssi?: number;
      snr?: number;
      ttl?: number;
      delivery_mode?: string;
      delivery_status?: string;
    };
    timing?: { event_time?: string; received_at?: string };
    raw_data?: { raw_hex?: string | null; raw_format?: string | null; raw_bytes_length?: number | null };
  };
};

export type HistoryBundle = {
  options: HistoryFilterOptions;
  cards: HistoryCards;
  items: HistoryItem[];
  total: number;
  track: HistoryTrackPoint[];
  buckets: HistoryChartBucket[];
  statistics: HistoryStatistics;
};

export type HistoryQuery = {
  scope: "SOLDIER" | "GROUP";
  soldierId?: number;
  groupId?: string;
  types?: string[];
  sources?: string[];
  from: string;
  to: string;
};

export function historyWindow(range: "1h" | "6h" | "24h" | "7d" | "custom") {
  if (range === "custom") return { from: HISTORY_SEED_START, to: HISTORY_END };
  const hours = range === "1h" ? 1 : range === "6h" ? 6 : range === "24h" ? 24 : 24 * 7;
  const end = Date.parse(HISTORY_END);
  return {
    from: new Date(end - hours * 3600 * 1000).toISOString().replace(".000Z", "Z"),
    to: HISTORY_END,
  };
}

export function soldierNumber(id: string) {
  const match = /^S-(\d+)$/.exec(id);
  return match ? Number(match[1]) : null;
}

export function historyQuery(input: {
  view: "soldier" | "group" | "weapon";
  entity: string;
  range: "1h" | "6h" | "24h" | "7d" | "custom";
  types: HistoryDataTypeId[];
  sources: TrackSource[];
}): HistoryQuery | null {
  if (input.view === "weapon" || !input.types.length || !input.sources.length) return null;
  const window = historyWindow(input.range);
  const types = input.types.length === Object.keys(TYPE_API).length ? undefined : input.types.map((item) => TYPE_API[item]);
  const sources = input.sources.length === Object.keys(SOURCE_API).length ? undefined : input.sources.map((item) => SOURCE_API[item]);
  if (input.view === "group") {
    return { scope: "GROUP", groupId: input.entity, types, sources, ...window };
  }
  const soldierId = soldierNumber(input.entity);
  if (soldierId == null) return null;
  return { scope: "SOLDIER", soldierId, types, sources, ...window };
}

function paramsFor(query: HistoryQuery, includeFilters: boolean) {
  const params = new URLSearchParams();
  params.set("scope", query.scope);
  if (query.scope === "SOLDIER" && query.soldierId != null) params.set("soldier_id", String(query.soldierId));
  if (query.scope === "GROUP" && query.groupId) params.set("group_id", query.groupId);
  params.set("from_time", query.from);
  params.set("to_time", query.to);
  if (includeFilters) {
    query.types?.forEach((value) => params.append("history_data_type", value));
    query.sources?.forEach((value) => params.append("position_source", value));
  }
  return params;
}

export function historySearch(query: HistoryQuery) {
  return paramsFor(query, true).toString();
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = body && typeof body === "object" && "detail" in body ? String(body.detail) : "History service is unavailable";
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export async function fetchHistory(query: HistoryQuery): Promise<HistoryBundle> {
  const filtered = paramsFor(query, true);
  const options = paramsFor(query, false);
  const list = new URLSearchParams(filtered);
  list.set("limit", "50");
  const [optionRes, summaryRes, pageRes, trackRes, chartRes, statsRes] = await Promise.all([
    fetch(`/api/history/filters/options?${options}`, { cache: "no-store" }),
    fetch(`/api/history/summary?${filtered}`, { cache: "no-store" }),
    fetch(`/api/history?${list}`, { cache: "no-store" }),
    fetch(`/api/history/track?${filtered}`, { cache: "no-store" }),
    fetch(`/api/history/charts?${filtered}`, { cache: "no-store" }),
    fetch(`/api/history/statistics?${filtered}`, { cache: "no-store" }),
  ]);
  const [optionBody, summaryBody, pageBody, trackBody, chartBody, statsBody] = await Promise.all([
    readJson<HistoryFilterOptions>(optionRes),
    readJson<{ cards: HistoryCards }>(summaryRes),
    readJson<{ items: HistoryItem[]; total: number }>(pageRes),
    readJson<{ points: HistoryTrackPoint[] }>(trackRes),
    readJson<{ buckets: HistoryChartBucket[] }>(chartRes),
    readJson<HistoryStatistics>(statsRes),
  ]);
  return {
    options: optionBody,
    cards: summaryBody.cards,
    items: pageBody.items,
    total: pageBody.total,
    track: trackBody.points,
    buckets: chartBody.buckets,
    statistics: statsBody,
  };
}

export async function fetchHistoryPoint(sourceId: number) {
  return readJson<HistoryPointDetail>(await fetch(`/api/history/point/${sourceId}`, { cache: "no-store" }));
}

export function sourceLabel(value: string | null | undefined): TrackSource | null {
  if (!value) return null;
  return SOURCE_LABEL[value] ?? null;
}

export function kindLabel(value: string) {
  return KIND_LABEL[value] ?? value;
}

export function formatHistoryTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
  return `${day} ${iso.slice(11, 19)}`;
}

export function trackToPoints(points: HistoryTrackPoint[]): TrackPoint[] {
  return points.map((point, index) => ({
    index,
    soldierId: point.soldier_id == null ? "unknown" : `S-${point.soldier_id}`,
    seconds: Math.floor(Date.parse(point.event_time) / 1000) % 86400,
    lng: point.longitude,
    lat: point.latitude,
    kind: "Telemetry",
    source: sourceLabel(point.position_source),
    hr: 0,
    hrv: 0,
    spo2: 0,
    temp: 0,
    battery: 0,
    strap: false,
    gateway: "",
    hop: 0,
    rssi: 0,
    snr: 0,
    receivedLag: 0,
    seq: 0,
    flags: 0,
    event: false,
    sourceId: point.source_id,
    eventUnix: Math.floor(Date.parse(point.event_time) / 1000),
  }));
}
