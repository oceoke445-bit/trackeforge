import type { IconName } from "@/components/ui/icon";

export type EventKind = "Position" | "Vital" | "Alert" | "Mesh" | "Uplink" | "Weapon" | "Communication" | "Battery" | "System";

export type ExplorerEvent = {
  id: string;
  time: string;
  entity: string;
  group: string;
  kind: EventKind;
  event: string;
  source: string;
  gateway: string;
  summary: string;
  tone: "blue" | "teal" | "red" | "amber" | "violet" | "green" | "slate";
  icon: IconName;
};

export const SERIES = [
  { label: "Position", value: "563.1K", color: "#3b82f6" },
  { label: "Vital", value: "309.7K", color: "#2dd4bf" },
  { label: "Communication", value: "48.3K", color: "#fbbf24" },
  { label: "Alert", value: "12.4K", color: "#f87171" },
  { label: "Weapon", value: "3.2K", color: "#a78bfa" },
  { label: "System", value: "1.9K", color: "#94a3b8" },
] as const;

export const CHART_BARS = Array.from({ length: 42 }, (_, index) => {
  const wave = 0.35 + 0.65 * Math.abs(Math.sin(index * 0.42 + 0.4));
  const edge = index < 10 || index > 32 ? 1 : 0.62;
  const scale = wave * edge;
  return [
    Math.round(22 * scale),
    Math.round(12 * scale),
    Math.round(5 * (0.45 + (index % 4) / 8)),
    index % 8 === 2 ? 4 : 1,
    index % 11 === 0 ? 3 : 1,
    1,
  ];
});

export const CHART_LABELS = ["03 Oct, 08:29", "03 Oct, 12:29", "03 Oct, 16:29", "03 Oct, 20:29", "04 Oct, 00:29", "04 Oct, 04:29", "04 Oct, 08:29"];

export const COMMON_FIELDS = [
  { name: "timestamp", count: "875.7K" },
  { name: "user", count: "542.1K" },
  { name: "event_type", count: "875.7K" },
  { name: "entity_type", count: "512.3K" },
  { name: "entity_id", count: "512.3K" },
  { name: "group_name", count: "148.2K" },
  { name: "gateway_id", count: "432.9K" },
  { name: "source", count: "875.7K" },
  { name: "severity", count: "86.1K" },
];

export const FIELD_GROUPS = [
  { name: "Position", count: "563.1K", fields: ["lat", "lon", "alt", "accuracy"] },
  { name: "Vital Signs", count: "309.7K", fields: ["heart_rate", "rmssd", "temperature"] },
  { name: "Communication", count: "48.3K", fields: ["snr", "rssi"] },
  { name: "Alert", count: "12.4K", fields: ["alert_type", "severity"] },
  { name: "Weapon", count: "3.2K", fields: ["ammo", "weapon_id"] },
  { name: "System", count: "1.9K", fields: ["uptime", "firmware"] },
];

const row = (
  id: string,
  time: string,
  entity: string,
  group: string,
  kind: EventKind,
  event: string,
  source: string,
  gateway: string,
  summary: string,
  tone: ExplorerEvent["tone"],
  icon: IconName,
): ExplorerEvent => ({ id, time, entity, group, kind, event, source, gateway, summary, tone, icon });

export const EXPLORER_EVENTS: ExplorerEvent[] = [
  row("ev-01", "04 Oct 08:29:12", "P-014", "Alpha", "Position", "GNSS Update", "GNSS", "GW-02", "1.2345, 104.1234", "blue", "pin"),
  row("ev-02", "04 Oct 08:28:59", "P-014", "Alpha", "Vital", "Heart Rate", "Strap", "GW-02", "78 bpm", "red", "heart"),
  row("ev-03", "04 Oct 08:28:11", "P-021", "Bravo", "Alert", "High Heart Rate", "System", "GW-01", "102 bpm", "amber", "warn"),
  row("ev-04", "04 Oct 08:27:11", "P-003", "Alpha", "Vital", "RMSSD", "Strap", "GW-02", "52 ms", "red", "heart"),
  row("ev-05", "04 Oct 08:26:45", "GW-02", "Alpha", "Mesh", "Burst Sent", "Starlink", "GW-02", "—", "violet", "signal"),
  row("ev-06", "04 Oct 08:26:12", "P-014", "Alpha", "Uplink", "RSSI", "System", "GW-02", "-92 dBm", "blue", "signal"),
  row("ev-07", "04 Oct 08:25:33", "P-007", "Charlie", "Weapon", "Ammo Update", "System", "GW-02", "28", "red", "crosshair"),
  row("ev-08", "04 Oct 08:24:33", "P-014", "Alpha", "Alert", "SOS", "System", "GW-01", "—", "red", "warn"),
  row("ev-09", "04 Oct 08:23:50", "GW-01", "Bravo", "Uplink", "Burst Sent", "Starlink", "GW-01", "—", "blue", "signal"),
  row("ev-10", "04 Oct 08:22:31", "P-014", "Alpha", "Communication", "SNR", "GW-01", "GW-01", "8.5 dB", "green", "signal"),
  row("ev-11", "04 Oct 08:21:09", "P-003", "Alpha", "Position", "Dead Reckoning", "GW-02", "GW-02", "1.2351, 104.1201", "blue", "pin"),
  row("ev-12", "04 Oct 08:20:05", "P-018", "Charlie", "Battery", "42%", "Strap", "GW-02", "42%", "green", "bolt"),
  row("ev-13", "04 Oct 08:18:44", "P-014", "Alpha", "Vital", "Temperature", "Strap", "GW-02", "36.8 °C", "red", "thermo"),
  row("ev-14", "04 Oct 08:17:02", "P-021", "Bravo", "Vital", "HRV", "Strap", "GW-01", "48 ms", "red", "heart"),
  row("ev-15", "04 Oct 08:16:55", "P-007", "Charlie", "Position", "GNSS Update", "GNSS", "GW-01", "1.2362, 104.1198", "blue", "pin"),
  row("ev-16", "04 Oct 08:15:12", "GW-02", "Alpha", "System", "Strap Disconnected", "System", "GW-02", "—", "slate", "link"),
];

export function eventJson(event: ExplorerEvent) {
  const [lat, lon] = event.summary.includes(",") ? event.summary.split(",").map((part) => Number(part.trim())) : [null, null];
  return {
    timestamp: "2026-10-04T08:29:12.123Z",
    entity: { id: event.entity, type: event.entity.startsWith("GW") ? "gateway" : "soldier", name: event.entity === "P-014" ? "Sertu Arif" : event.entity, group: `${event.group}-1-2` },
    event: { type: event.kind.toLowerCase(), event: event.event.toLowerCase().replace(/\s+/g, "_") },
    location: lat ? { lat, lon, alt: 28.5, accuracy: 8, source: "gnss" } : undefined,
    device: { gateway_id: event.gateway, source: event.source.toLowerCase() },
    meta: { received_at: "2026-10-04T08:29:12.456Z", raw_value: event.summary, severity: event.kind === "Alert" ? "critical" : "info" },
  };
}
