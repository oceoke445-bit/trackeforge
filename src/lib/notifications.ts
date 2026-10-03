import type { IconName } from "@/components/ui/icon";

export type NoticeLevel = "critical" | "warning" | "info";
export type NoticeStatus = "unseen" | "unread" | "read";
export type NoticeCategory = "personnel" | "weapon" | "system" | "mission" | "gateway";

export type Notice = {
  id: string;
  title: string;
  detail: string;
  clock: string;
  relative: string;
  level: NoticeLevel;
  icon: IconName;
  href?: string;
  category: NoticeCategory;
  source: string;
  sourceKind: "personnel" | "weapon" | "gateway" | "system";
  lat: number;
  lng: number;
  area: string;
  alertType: string;
  hr: number | null;
  temp: number | null;
  battery: number | null;
  timeline: { time: string; text: string }[];
  initialStatus: NoticeStatus;
};

export const NOTICE_SUMMARY = {
  critical: { value: 4, meta: "+1 new" },
  warning: { value: 5, meta: "+2 new" },
  info: { value: 15, meta: "+6 new" },
  all: { value: 24, meta: "Last 24 hours" },
  unread: 12,
};

export const NOTICES: Notice[] = [
  {
    id: "n1",
    title: "SOS Activated",
    detail: "Emergency beacon triggered by personnel",
    clock: "16:52:31",
    relative: "2 min ago",
    level: "critical",
    icon: "bolt",
    href: "/overview",
    category: "personnel",
    source: "S-014",
    sourceKind: "personnel",
    lat: -6.2193,
    lng: 106.8436,
    area: "Sector North",
    alertType: "SOS",
    hr: 142,
    temp: 38.2,
    battery: 61,
    timeline: [
      { time: "16:52:31", text: "SOS beacon activated" },
      { time: "16:52:40", text: "SOC acknowledged alert" },
      { time: "16:53:05", text: "Nearest unit notified" },
    ],
    initialStatus: "unseen",
  },
  {
    id: "n2",
    title: "High Body Temperature",
    detail: "Personnel body temp exceeded threshold",
    clock: "16:51:18",
    relative: "3 min ago",
    level: "critical",
    icon: "heart",
    href: "/overview",
    category: "personnel",
    source: "S-014",
    sourceKind: "personnel",
    lat: -6.2191,
    lng: 106.8432,
    area: "Sector North",
    alertType: "Heat Stress",
    hr: 138,
    temp: 38.2,
    battery: 61,
    timeline: [
      { time: "16:50:02", text: "Temperature crossed 37.8°C" },
      { time: "16:51:18", text: "Critical heat stress alert raised" },
    ],
    initialStatus: "unseen",
  },
  {
    id: "n3",
    title: "Weapon Battery Critical",
    detail: "Weapon tracker battery below 15%",
    clock: "16:49:44",
    relative: "5 min ago",
    level: "warning",
    icon: "bolt",
    href: "/weapons",
    category: "weapon",
    source: "WPN-003",
    sourceKind: "weapon",
    lat: -6.236,
    lng: 106.81,
    area: "Sector North",
    alertType: "Low Battery",
    hr: null,
    temp: 31.2,
    battery: 12,
    timeline: [
      { time: "16:40:00", text: "Battery dropped below 20%" },
      { time: "16:49:44", text: "Critical battery threshold reached" },
    ],
    initialStatus: "unread",
  },
  {
    id: "n4",
    title: "Personnel Out of Zone",
    detail: "Left assigned operational area",
    clock: "16:48:12",
    relative: "6 min ago",
    level: "warning",
    icon: "pin",
    href: "/groups",
    category: "mission",
    source: "S-008",
    sourceKind: "personnel",
    lat: -6.246,
    lng: 106.818,
    area: "Sector East",
    alertType: "Geofence",
    hr: 118,
    temp: 37.4,
    battery: 44,
    timeline: [
      { time: "16:47:50", text: "Approached zone boundary" },
      { time: "16:48:12", text: "Exited assigned zone" },
    ],
    initialStatus: "unread",
  },
  {
    id: "n5",
    title: "Gateway Recovered",
    detail: "Mesh gateway back online",
    clock: "16:45:03",
    relative: "9 min ago",
    level: "info",
    icon: "link",
    href: "/overview",
    category: "gateway",
    source: "GW-002",
    sourceKind: "gateway",
    lat: -6.24,
    lng: 106.83,
    area: "HQ Relay",
    alertType: "Connectivity",
    hr: null,
    temp: null,
    battery: null,
    timeline: [
      { time: "16:30:00", text: "Gateway offline" },
      { time: "16:45:03", text: "Gateway recovered · latency 28ms" },
    ],
    initialStatus: "read",
  },
  {
    id: "n6",
    title: "Elevated Heart Rate",
    detail: "Heart rate sustained above 110 BPM",
    clock: "16:42:55",
    relative: "12 min ago",
    level: "warning",
    icon: "heart",
    href: "/groups",
    category: "personnel",
    source: "S-008",
    sourceKind: "personnel",
    lat: -6.2462,
    lng: 106.8184,
    area: "Sector East",
    alertType: "Vitals",
    hr: 118,
    temp: 37.4,
    battery: 44,
    timeline: [{ time: "16:42:55", text: "Elevated HR alert opened" }],
    initialStatus: "unread",
  },
  {
    id: "n7",
    title: "Weapon Disconnected",
    detail: "DMR telemetry link lost",
    clock: "16:40:20",
    relative: "14 min ago",
    level: "critical",
    icon: "crosshair",
    href: "/weapons",
    category: "weapon",
    source: "WPN-003",
    sourceKind: "weapon",
    lat: -6.244,
    lng: 106.812,
    area: "Sector North",
    alertType: "Disconnect",
    hr: null,
    temp: 30.8,
    battery: 45,
    timeline: [{ time: "16:40:20", text: "Weapon link lost" }],
    initialStatus: "unseen",
  },
  {
    id: "n8",
    title: "Geofence Breach",
    detail: "Entered restricted area",
    clock: "16:38:01",
    relative: "16 min ago",
    level: "critical",
    icon: "shield",
    href: "/overview",
    category: "mission",
    source: "S-014",
    sourceKind: "personnel",
    lat: -6.222,
    lng: 106.835,
    area: "Restricted Zone",
    alertType: "Geofence",
    hr: 142,
    temp: 38.2,
    battery: 61,
    timeline: [{ time: "16:38:01", text: "Restricted boundary crossed" }],
    initialStatus: "unread",
  },
  {
    id: "n9",
    title: "Alpha Checkpoint Cleared",
    detail: "Mission checkpoint confirmed",
    clock: "16:30:44",
    relative: "22 min ago",
    level: "info",
    icon: "check",
    href: "/groups",
    category: "mission",
    source: "Alpha",
    sourceKind: "system",
    lat: -6.236,
    lng: 106.8,
    area: "Sector North",
    alertType: "Mission",
    hr: null,
    temp: null,
    battery: null,
    timeline: [{ time: "16:30:44", text: "Checkpoint cleared by Alpha" }],
    initialStatus: "read",
  },
  {
    id: "n10",
    title: "Low Battery Warning",
    detail: "Personnel device battery at 18%",
    clock: "16:28:10",
    relative: "25 min ago",
    level: "warning",
    icon: "bolt",
    href: "/weapons",
    category: "weapon",
    source: "WPN-004",
    sourceKind: "weapon",
    lat: -6.248,
    lng: 106.816,
    area: "Sector North",
    alertType: "Low Battery",
    hr: null,
    temp: 33.1,
    battery: 18,
    timeline: [{ time: "16:28:10", text: "Battery warning issued" }],
    initialStatus: "unread",
  },
  {
    id: "n11",
    title: "Bravo Convoy Clear",
    detail: "Corridor B checkpoint passed",
    clock: "16:10:00",
    relative: "45 min ago",
    level: "info",
    icon: "users",
    href: "/groups",
    category: "mission",
    source: "Bravo",
    sourceKind: "system",
    lat: -6.242,
    lng: 106.834,
    area: "Corridor B",
    alertType: "Mission",
    hr: null,
    temp: null,
    battery: null,
    timeline: [{ time: "16:10:00", text: "Convoy cleared checkpoint" }],
    initialStatus: "read",
  },
  {
    id: "n12",
    title: "Weapon Unassigned",
    detail: "Pistol has no assigned operator",
    clock: "15:52:00",
    relative: "1 hr ago",
    level: "info",
    icon: "box",
    href: "/weapons",
    category: "weapon",
    source: "WPN-010",
    sourceKind: "weapon",
    lat: -6.258,
    lng: 106.79,
    area: "HQ",
    alertType: "Assignment",
    hr: null,
    temp: 28.4,
    battery: 96,
    timeline: [{ time: "15:52:00", text: "Weapon marked unassigned" }],
    initialStatus: "read",
  },
  {
    id: "n13",
    title: "Maintenance Due",
    detail: "Weapon scheduled for service",
    clock: "15:20:00",
    relative: "1 hr ago",
    level: "warning",
    icon: "settings",
    href: "/weapons",
    category: "weapon",
    source: "WPN-009",
    sourceKind: "weapon",
    lat: -6.268,
    lng: 106.81,
    area: "Staging Yard",
    alertType: "Maintenance",
    hr: null,
    temp: null,
    battery: null,
    timeline: [{ time: "15:20:00", text: "Maintenance window opened" }],
    initialStatus: "unread",
  },
  {
    id: "n14",
    title: "Comms Relay Healthy",
    detail: "Echo logistics sync completed",
    clock: "14:40:00",
    relative: "2 hr ago",
    level: "info",
    icon: "signal",
    href: "/groups",
    category: "system",
    source: "Echo",
    sourceKind: "system",
    lat: -6.258,
    lng: 106.79,
    area: "Headquarters",
    alertType: "System",
    hr: null,
    temp: null,
    battery: null,
    timeline: [{ time: "14:40:00", text: "Relay health check passed" }],
    initialStatus: "read",
  },
  {
    id: "n15",
    title: "Telemetry Synced",
    detail: "Weapon W-221 telemetry synced",
    clock: "14:10:00",
    relative: "3 hr ago",
    level: "info",
    icon: "refresh",
    href: "/weapons",
    category: "weapon",
    source: "WPN-221",
    sourceKind: "weapon",
    lat: -6.24,
    lng: 106.8,
    area: "Sector West",
    alertType: "Telemetry",
    hr: null,
    temp: 30.1,
    battery: 88,
    timeline: [{ time: "14:10:00", text: "Telemetry sync complete" }],
    initialStatus: "read",
  },
  {
    id: "n16",
    title: "QRF Readiness Check",
    detail: "Delta standby readiness passed",
    clock: "13:50:00",
    relative: "3 hr ago",
    level: "info",
    icon: "shield",
    href: "/groups",
    category: "mission",
    source: "Delta",
    sourceKind: "system",
    lat: -6.27,
    lng: 106.82,
    area: "Sector South",
    alertType: "Mission",
    hr: null,
    temp: null,
    battery: null,
    timeline: [{ time: "13:50:00", text: "QRF readiness confirmed" }],
    initialStatus: "read",
  },
];

export const STORAGE_KEY = "traxon-notifications-read";
export const STATUS_STORAGE_KEY = "traxon-notifications-status";

export function loadReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return new Set(NOTICES.filter((n) => n.initialStatus === "read").map((n) => n.id));
    }
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function saveReadIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function loadStatusMap(): Record<string, NoticeStatus> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STATUS_STORAGE_KEY);
    if (!raw) {
      return Object.fromEntries(NOTICES.map((n) => [n.id, n.initialStatus]));
    }
    return JSON.parse(raw) as Record<string, NoticeStatus>;
  } catch {
    return Object.fromEntries(NOTICES.map((n) => [n.id, n.initialStatus]));
  }
}

export function saveStatusMap(map: Record<string, NoticeStatus>) {
  localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(map));
}

export function levelLabel(level: NoticeLevel) {
  switch (level) {
    case "critical":
      return "Critical";
    case "warning":
      return "Warning";
    case "info":
      return "Info";
  }
}

export function statusLabel(status: NoticeStatus) {
  switch (status) {
    case "unseen":
      return "Unseen";
    case "unread":
      return "Unread";
    case "read":
      return "Read";
  }
}

export function getNoticeStatus(id: string, readIds: Set<string>, statusMap: Record<string, NoticeStatus>): NoticeStatus {
  if (readIds.has(id) || statusMap[id] === "read") return "read";
  return statusMap[id] ?? "unread";
}
