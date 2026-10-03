import type { IconName } from "@/components/ui/icon";

export type HistoryEventType =
  | "SOS"
  | "Casualty"
  | "Movement"
  | "Weapon"
  | "System"
  | "Alert"
  | "Uplink";

export type HistoryEntityKind = "soldier" | "weapon" | "gateway" | "system";

export type HistoryEvent = {
  id: string;
  time: string;
  type: HistoryEventType;
  entityId: string;
  entityUnit: string;
  entityKind: HistoryEntityKind;
  details: string;
  description: string;
  lat: number;
  lng: number;
  elevation: number;
  battery: number | null;
  signal: number | null;
  gatewayReceived: string | null;
  gatewayDelay: string | null;
  satelliteUplink: string | null;
  satelliteDelay: string | null;
  status: "Delivered" | "Pending" | "Failed";
};

export const EVENT_TYPES: HistoryEventType[] = [
  "SOS",
  "Casualty",
  "Movement",
  "Weapon",
  "System",
  "Alert",
  "Uplink",
];

export const ENTITY_KINDS: { id: "all" | HistoryEntityKind; label: string }[] = [
  { id: "all", label: "All Types" },
  { id: "soldier", label: "Soldier" },
  { id: "weapon", label: "Weapon" },
  { id: "gateway", label: "Gateway" },
  { id: "system", label: "System" },
];

export const UNITS = [
  "All Units",
  "Alpha 1-1",
  "Alpha 1-2",
  "Bravo 1-1",
  "Bravo 1-2",
  "Charlie 2-1",
  "Delta QRF",
] as const;

export const EVENT_META: Record<
  HistoryEventType,
  { tone: string; icon: IconName; label: string }
> = {
  SOS: { tone: "sos", icon: "bell", label: "SOS" },
  Casualty: { tone: "casualty", icon: "heart", label: "Casualty" },
  Movement: { tone: "movement", icon: "route", label: "Movement" },
  Weapon: { tone: "weapon", icon: "crosshair", label: "Weapon" },
  System: { tone: "system", icon: "cpu", label: "System" },
  Alert: { tone: "alert", icon: "bolt", label: "Alert" },
  Uplink: { tone: "uplink", icon: "upload", label: "Uplink" },
};

export const HISTORY_EVENTS: HistoryEvent[] = [
  {
    id: "HE-001",
    time: "2026-10-03 14:32:18",
    type: "SOS",
    entityId: "P-03",
    entityUnit: "Alpha 1-2",
    entityKind: "soldier",
    details: "SOS button pressed (2x)",
    description: "Soldier P-03 pressed the SOS button twice within 4 seconds. Immediate response required.",
    lat: -6.2088,
    lng: 106.8456,
    elevation: 12,
    battery: 78,
    signal: -92,
    gatewayReceived: "14:32:26",
    gatewayDelay: "8s delay",
    satelliteUplink: "14:32:41",
    satelliteDelay: "23s delay",
    status: "Delivered",
  },
  {
    id: "HE-002",
    time: "2026-10-03 14:28:45",
    type: "Weapon",
    entityId: "W-07",
    entityUnit: "Bravo 1-1",
    entityKind: "weapon",
    details: "Weapon status: Online",
    description: "Weapon W-07 reconnected to mesh network after brief dropout.",
    lat: -6.2142,
    lng: 106.8511,
    elevation: 18,
    battery: 86,
    signal: -74,
    gatewayReceived: "14:28:47",
    gatewayDelay: "2s delay",
    satelliteUplink: "14:28:55",
    satelliteDelay: "10s delay",
    status: "Delivered",
  },
  {
    id: "HE-003",
    time: "2026-10-03 14:25:12",
    type: "Casualty",
    entityId: "P-11",
    entityUnit: "Charlie 2-1",
    entityKind: "soldier",
    details: "Fall / impact detected",
    description: "Impact sensor triggered with no movement for 20 seconds after event.",
    lat: -6.2215,
    lng: 106.8398,
    elevation: 24,
    battery: 61,
    signal: -88,
    gatewayReceived: "14:25:19",
    gatewayDelay: "7s delay",
    satelliteUplink: "14:25:33",
    satelliteDelay: "21s delay",
    status: "Delivered",
  },
  {
    id: "HE-004",
    time: "2026-10-03 14:21:03",
    type: "Movement",
    entityId: "P-05",
    entityUnit: "Alpha 1-1",
    entityKind: "soldier",
    details: "Position updated",
    description: "Periodic location uplink from wearable tracker.",
    lat: -6.2054,
    lng: 106.8422,
    elevation: 15,
    battery: 91,
    signal: -68,
    gatewayReceived: "14:21:05",
    gatewayDelay: "2s delay",
    satelliteUplink: "14:21:12",
    satelliteDelay: "9s delay",
    status: "Delivered",
  },
  {
    id: "HE-005",
    time: "2026-10-03 14:18:40",
    type: "System",
    entityId: "GW-002",
    entityUnit: "HQ",
    entityKind: "gateway",
    details: "Gateway sync completed",
    description: "Gateway Hub finished mesh topology refresh for Sector North.",
    lat: -6.1988,
    lng: 106.834,
    elevation: 9,
    battery: null,
    signal: -55,
    gatewayReceived: "14:18:40",
    gatewayDelay: null,
    satelliteUplink: "14:18:48",
    satelliteDelay: "8s delay",
    status: "Delivered",
  },
  {
    id: "HE-006",
    time: "2026-10-03 14:15:22",
    type: "Alert",
    entityId: "P-08",
    entityUnit: "Bravo 1-2",
    entityKind: "soldier",
    details: "Heart rate abnormal",
    description: "Heart rate sustained above 125 BPM for more than 90 seconds.",
    lat: -6.2177,
    lng: 106.8489,
    elevation: 21,
    battery: 54,
    signal: -81,
    gatewayReceived: "14:15:28",
    gatewayDelay: "6s delay",
    satelliteUplink: "14:15:40",
    satelliteDelay: "18s delay",
    status: "Delivered",
  },
  {
    id: "HE-007",
    time: "2026-10-03 14:12:09",
    type: "Uplink",
    entityId: "P-02",
    entityUnit: "Alpha 1-2",
    entityKind: "soldier",
    details: "Satellite packet sent",
    description: "Buffered telemetry flushed via satellite uplink after mesh recovery.",
    lat: -6.2101,
    lng: 106.8472,
    elevation: 14,
    battery: 83,
    signal: -70,
    gatewayReceived: null,
    gatewayDelay: null,
    satelliteUplink: "14:12:09",
    satelliteDelay: null,
    status: "Delivered",
  },
  {
    id: "HE-008",
    time: "2026-10-03 14:08:55",
    type: "Weapon",
    entityId: "W-03",
    entityUnit: "Alpha 1-1",
    entityKind: "weapon",
    details: "Weapon status: Offline",
    description: "Weapon W-03 lost link. Last known RSSI −101 dBm.",
    lat: -6.2066,
    lng: 106.841,
    elevation: 16,
    battery: 33,
    signal: -101,
    gatewayReceived: "14:08:59",
    gatewayDelay: "4s delay",
    satelliteUplink: "14:09:12",
    satelliteDelay: "17s delay",
    status: "Pending",
  },
  {
    id: "HE-009",
    time: "2026-10-03 14:05:31",
    type: "Movement",
    entityId: "P-14",
    entityUnit: "Delta QRF",
    entityKind: "soldier",
    details: "Entered staging yard",
    description: "Geofence entry recorded for QRF staging area.",
    lat: -6.2294,
    lng: 106.8525,
    elevation: 11,
    battery: 95,
    signal: -62,
    gatewayReceived: "14:05:33",
    gatewayDelay: "2s delay",
    satelliteUplink: "14:05:40",
    satelliteDelay: "9s delay",
    status: "Delivered",
  },
  {
    id: "HE-010",
    time: "2026-10-03 14:01:18",
    type: "Alert",
    entityId: "P-06",
    entityUnit: "Charlie 2-1",
    entityKind: "soldier",
    details: "Battery low (20%)",
    description: "Wearable battery crossed low threshold. Recommend replacement.",
    lat: -6.2233,
    lng: 106.8367,
    elevation: 27,
    battery: 20,
    signal: -85,
    gatewayReceived: "14:01:24",
    gatewayDelay: "6s delay",
    satelliteUplink: "14:01:36",
    satelliteDelay: "18s delay",
    status: "Delivered",
  },
  {
    id: "HE-011",
    time: "2026-10-03 13:58:02",
    type: "SOS",
    entityId: "P-09",
    entityUnit: "Bravo 1-1",
    entityKind: "soldier",
    details: "SOS button pressed",
    description: "Single SOS press acknowledged and delivered to command.",
    lat: -6.2158,
    lng: 106.8495,
    elevation: 19,
    battery: 72,
    signal: -79,
    gatewayReceived: "13:58:08",
    gatewayDelay: "6s delay",
    satelliteUplink: "13:58:20",
    satelliteDelay: "18s delay",
    status: "Delivered",
  },
  {
    id: "HE-012",
    time: "2026-10-03 13:52:44",
    type: "System",
    entityId: "SYS",
    entityUnit: "HQ",
    entityKind: "system",
    details: "History archive rotated",
    description: "Daily history partition sealed and mirrored to cold storage.",
    lat: -6.1988,
    lng: 106.834,
    elevation: 9,
    battery: null,
    signal: null,
    gatewayReceived: null,
    gatewayDelay: null,
    satelliteUplink: null,
    satelliteDelay: null,
    status: "Delivered",
  },
];

export const HISTORY_KPIS = [
  { id: "total", label: "Total Events", value: "1,248", change: "+12%", tone: "blue", icon: "file" as IconName },
  { id: "movement", label: "Movement Logs", value: "426", change: "+8%", tone: "cyan", icon: "route" as IconName },
  { id: "alerts", label: "Alerts", value: "12", change: "+20%", tone: "amber", icon: "bolt" as IconName },
  { id: "sos", label: "SOS Events", value: "3", change: "+200%", tone: "red", icon: "bell" as IconName },
  { id: "casualty", label: "Casualty Detections", value: "2", change: "+100%", tone: "rose", icon: "heart" as IconName },
];
