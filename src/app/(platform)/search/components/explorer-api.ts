import type { IconName } from "@/components/ui/icon";
import type { ExplorerRecord, RecordLevel } from "./search-data";

export type ExplorerTimeRange = "all" | "30d";

export type FilterOptions = {
  categories: string[];
  data_types: string[];
  entity_types: string[];
  groups: string[];
  gateways: string[];
  position_sources: string[];
  time_ranges?: ExplorerTimeRange[];
};

export const EXPLORER_RANGES = [
  { id: "all" as const, label: "All time" },
  { id: "30d" as const, label: "30 days" },
];

export type ExplorerSummary = {
  total: number;
  timeline: { time: string; count: number; segments: { category: string; count: number }[] }[];
  by_category: { category: string; count: number }[];
};

export type LiveBundle = {
  records: ExplorerRecord[];
  total: number;
  summary: ExplorerSummary;
  options: FilterOptions;
  elapsedMs: number;
};

type ApiRecord = {
  id: number;
  category: string;
  data_type: string;
  entity_type: string | null;
  entity_id: string | null;
  group_id: string | null;
  gateway_id: string | null;
  event_time: string;
  received_at: string;
  position_source: string | null;
  transport: string | null;
  freshness: string | null;
  raw_format: string | null;
  raw_hex: string | null;
  raw_bytes_length: number | null;
  data: Record<string, unknown>;
};

const CATEGORY_LABEL: Record<string, RecordLevel> = {
  TELEMETRY: "Telemetry",
  MESH: "Mesh",
  UPLINK: "Uplink",
  BEACON: "Beacon",
  SPECIAL: "Special",
  SYSTEM: "System",
};

const CATEGORY_TONE: Record<string, ExplorerRecord["tone"]> = {
  TELEMETRY: "blue",
  MESH: "teal",
  UPLINK: "amber",
  BEACON: "slate",
  SPECIAL: "violet",
  SYSTEM: "green",
};

const CATEGORY_ICON: Record<string, IconName> = {
  TELEMETRY: "heart",
  MESH: "signal",
  UPLINK: "arrow",
  BEACON: "pin",
  SPECIAL: "file",
  SYSTEM: "settings",
};

export const CATEGORY_COLOR: Record<string, string> = {
  TELEMETRY: "#3b82f6",
  MESH: "#c4b5fd",
  UPLINK: "#fbbf24",
  BEACON: "#94a3b8",
  SPECIAL: "#2dd4bf",
  SYSTEM: "#34d399",
};

const ENTITY_TO_API: Record<string, string> = {
  Personnel: "SOLDIER",
  Gateway: "GATEWAY",
  Beacon: "BEACON",
};

const ENTITY_LABEL: Record<string, string> = {
  SOLDIER: "Personnel",
  GATEWAY: "Gateway",
  BEACON: "Beacon",
};

const SOURCE_TO_API: Record<string, string> = {
  GNSS: "GNSS",
  "Dead Reckoning": "DEAD_RECKONING",
  Trilateration: "TRILATERATION",
  Stale: "STALE",
};

const RECORD_TO_API: Record<string, string> = {
  "21-byte packet": "SOLDIER_TELEMETRY",
  "LoRa frame": "LORA_FRAME",
  "Satellite burst": "SATELLITE_UPLINK",
  "Beacon observation": "BEACON_OBSERVATION",
};

export function pretty(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function compact(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K`;
  return String(count);
}

function formatClock(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return `${day} ${month} ${value.slice(11, 19)}`;
}

export function formatAxis(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return `${day} ${month}, ${value.slice(11, 16)}`;
}

function matchOption(label: string, options: string[] | undefined, aliases: Record<string, string>) {
  if (!label || label.startsWith("All")) return undefined;
  if (aliases[label]) return aliases[label];
  return options?.find((item) => item === label || pretty(item) === label);
}

export function toExplorerTimeRange(range: string): ExplorerTimeRange {
  const key = range.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (key === "30d" || key === "30day" || key === "30days") return "30d";
  return "all";
}

export function explorerSearch(input: {
  query: string;
  entityType: string;
  group: string;
  level: string;
  recordType: string;
  source: string;
  gateway: string;
  range: string;
  limit: number;
  offset: number;
  options?: FilterOptions;
}) {
  const params = new URLSearchParams();
  const q = input.query.trim();
  if (q) params.set("q", q);
  const category = matchOption(
    input.level,
    input.options?.categories,
    Object.fromEntries(Object.entries(CATEGORY_LABEL).map(([key, label]) => [label, key])),
  );
  const dataType = matchOption(input.recordType, input.options?.data_types, RECORD_TO_API);
  const entityType = input.entityType === "All" ? undefined : ENTITY_TO_API[input.entityType] ?? matchOption(input.entityType, input.options?.entity_types, ENTITY_LABEL);
  const source = matchOption(input.source, input.options?.position_sources, SOURCE_TO_API);
  if (category) params.set("category", category);
  if (dataType) params.set("data_type", dataType);
  if (entityType) params.set("entity_type", entityType);
  if (input.group !== "All Groups") params.set("group_id", input.group);
  if (input.gateway !== "All Gateways") params.set("gateway_id", input.gateway);
  if (source) params.set("position_source", source);
  params.set("timeRange", toExplorerTimeRange(input.range));
  params.set("limit", String(input.limit));
  params.set("offset", String(input.offset));
  return params;
}

function summarize(item: ApiRecord) {
  const data = item.data;
  const flags = data.flags && typeof data.flags === "object" ? data.flags as Record<string, unknown> : null;
  if (item.category === "TELEMETRY") {
    const source = String(flags?.position_source ?? item.position_source ?? "Telemetry");
    return flags?.sos ? `${source} · SOS flag` : source;
  }
  if (item.category === "MESH") return `TTL ${data.ttl ?? "—"} · hop ${data.hop_count ?? "—"}`;
  if (item.category === "UPLINK") return `${data.packet_count ?? 0} packets · ${data.payload_size_bytes ?? 0} B`;
  if (item.category === "BEACON") return `${item.entity_id ?? "Beacon"} RSSI ${data.rssi ?? "—"}`;
  return pretty(item.data_type);
}

function entityLabel(item: ApiRecord) {
  if (item.entity_type === "SOLDIER" && item.entity_id) return `P-${item.entity_id}`;
  return item.entity_id ?? item.entity_type ?? "—";
}

function layers(item: ApiRecord) {
  const raw = {
    raw_hex: item.raw_hex,
    raw_format: item.raw_format,
    raw_bytes_length: item.raw_bytes_length,
  };
  if (item.category === "MESH") {
    const { payload, ...radio } = item.data;
    return {
      raw,
      decoded: payload && typeof payload === "object" ? payload as Record<string, unknown> : null,
      communication: radio,
    };
  }
  if (item.category === "UPLINK") return { raw, decoded: null, communication: item.data };
  return {
    raw,
    decoded: item.data,
    communication: {
      transport: item.transport,
      freshness: item.freshness,
      gateway_id: item.gateway_id,
    },
  };
}

function toRow(item: ApiRecord): ExplorerRecord {
  const view = layers(item);
  return {
    id: String(item.id),
    time: formatClock(item.event_time),
    received: formatClock(item.received_at),
    entity: entityLabel(item),
    group: item.group_id ?? "—",
    level: CATEGORY_LABEL[item.category] ?? "System",
    record: pretty(item.data_type),
    source: item.position_source ? pretty(item.position_source) : pretty(item.transport ?? "Unknown"),
    gateway: item.gateway_id ?? "—",
    summary: summarize(item),
    tone: CATEGORY_TONE[item.category] ?? "slate",
    icon: CATEGORY_ICON[item.category] ?? "file",
    raw: view.raw,
    decoded: view.decoded,
    communication: view.communication,
  };
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`Explorer request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function fetchExplorerBundle(params: URLSearchParams, signal: AbortSignal): Promise<Omit<LiveBundle, "elapsedMs">> {
  const filters = new URLSearchParams(params);
  filters.delete("limit");
  filters.delete("offset");
  const [page, summary, options] = await Promise.all([
    fetch(`/api/explorer?${params}`, { signal, cache: "no-store" }).then((response) => readJson<{ items: ApiRecord[]; total: number }>(response)),
    fetch(`/api/explorer/summary?${filters}`, { signal, cache: "no-store" }).then((response) => readJson<ExplorerSummary>(response)),
    fetch("/api/explorer/filters/options", { signal, cache: "no-store" }).then((response) => readJson<FilterOptions>(response)),
  ]);
  return {
    records: page.items.map(toRow),
    total: page.total,
    summary,
    options,
  };
}

export function optionLabels(values: string[], labels?: Record<string, string>) {
  return values.map((value) => labels?.[value] ?? pretty(value));
}

export { ENTITY_LABEL, CATEGORY_LABEL };
