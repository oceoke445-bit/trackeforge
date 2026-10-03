import type { IconName } from "@/components/ui/icon";

export type WeaponStatus = "connected" | "disconnected" | "unassigned" | "low-battery" | "maintenance";

export type WeaponType =
  | "Assault Rifle (M4)"
  | "DMR"
  | "LMG"
  | "Shotgun"
  | "Sniper Rifle"
  | "Pistol";

export type WeaponAsset = {
  id: string;
  serial: string;
  type: WeaponType;
  status: WeaponStatus;
  battery: number | null;
  assignedTo: string;
  squad: string;
  lastSeen: string;
  temperature: number | null;
  lng: number;
  lat: number;
};

export type MapFilter = "all" | WeaponStatus;

export const weaponStats: {
  label: string;
  value: string;
  meta: string;
  tone: string;
  icon: IconName;
}[] = [
  { label: "Total Weapons", value: "46", meta: "↑ 2 from yesterday", tone: "blue", icon: "crosshair" },
  { label: "Connected", value: "43", meta: "93.5% online", tone: "green", icon: "signal" },
  { label: "Disconnected", value: "2", meta: "↑ 4.3% offline", tone: "red", icon: "bolt" },
  { label: "Unassigned", value: "1", meta: "↑ 2.2% unassigned", tone: "slate", icon: "box" },
  { label: "Low Battery", value: "3", meta: "↑ 6.5% < 20%", tone: "amber", icon: "heart" },
  { label: "Maintenance", value: "2", meta: "In service", tone: "cyan", icon: "settings" },
];

export const weaponTypeBreakdown: { type: WeaponType; count: number; pct: number; color: string }[] = [
  { type: "Assault Rifle (M4)", count: 32, pct: 69.6, color: "#3b82f6" },
  { type: "DMR", count: 6, pct: 13.0, color: "#8b5cf6" },
  { type: "LMG", count: 4, pct: 8.7, color: "#f87171" },
  { type: "Shotgun", count: 2, pct: 4.3, color: "#fbbf24" },
  { type: "Sniper Rifle", count: 1, pct: 2.2, color: "#22d3ee" },
];

export const weaponStatusBreakdown = [
  { label: "Connected", value: 43, color: "#34d399" },
  { label: "Disconnected", value: 2, color: "#f87171" },
  { label: "Unassigned", value: 1, color: "#94a3b8" },
  { label: "Low Battery", value: 3, color: "#fbbf24" },
  { label: "Maintenance", value: 2, color: "#22d3ee" },
];

export const weapons: WeaponAsset[] = [
  { id: "WPN-001", serial: "M4-ALP-001", type: "Assault Rifle (M4)", status: "connected", battery: 87, assignedTo: "S-001", squad: "Alpha", lastSeen: "4 mins ago", temperature: 32.4, lng: 106.798, lat: -6.236 },
  { id: "WPN-002", serial: "M4-ALP-002", type: "Assault Rifle (M4)", status: "connected", battery: 92, assignedTo: "S-002", squad: "Alpha", lastSeen: "5 sec ago", temperature: 31.2, lng: 106.804, lat: -6.24 },
  { id: "WPN-003", serial: "DMR-ALP-003", type: "DMR", status: "disconnected", battery: 45, assignedTo: "S-003", squad: "Alpha", lastSeen: "18 mins ago", temperature: 30.8, lng: 106.812, lat: -6.244 },
  { id: "WPN-004", serial: "M4-ALP-004", type: "Assault Rifle (M4)", status: "low-battery", battery: 14, assignedTo: "S-004", squad: "Alpha", lastSeen: "22 sec ago", temperature: 33.1, lng: 106.816, lat: -6.248 },
  { id: "WPN-005", serial: "LMG-BRV-005", type: "LMG", status: "connected", battery: 78, assignedTo: "B-001", squad: "Bravo", lastSeen: "12 sec ago", temperature: 31.8, lng: 106.828, lat: -6.242 },
  { id: "WPN-006", serial: "M4-BRV-006", type: "Assault Rifle (M4)", status: "connected", battery: 88, assignedTo: "B-002", squad: "Bravo", lastSeen: "8 sec ago", temperature: 30.5, lng: 106.834, lat: -6.246 },
  { id: "WPN-007", serial: "SGP-CHR-007", type: "Shotgun", status: "connected", battery: 71, assignedTo: "C-001", squad: "Charlie", lastSeen: "1 min ago", temperature: 31.0, lng: 106.786, lat: -6.228 },
  { id: "WPN-008", serial: "SNP-CHR-008", type: "Sniper Rifle", status: "connected", battery: 65, assignedTo: "C-002", squad: "Charlie", lastSeen: "40 sec ago", temperature: 29.9, lng: 106.79, lat: -6.232 },
  { id: "WPN-009", serial: "M4-DLT-009", type: "Assault Rifle (M4)", status: "maintenance", battery: null, assignedTo: "—", squad: "Delta", lastSeen: "2 hours ago", temperature: null, lng: 106.81, lat: -6.268 },
  { id: "WPN-010", serial: "PST-ECH-010", type: "Pistol", status: "unassigned", battery: 96, assignedTo: "—", squad: "Echo", lastSeen: "3 hours ago", temperature: 28.4, lng: 106.79, lat: -6.258 },
  { id: "WPN-011", serial: "DMR-BRV-011", type: "DMR", status: "connected", battery: 81, assignedTo: "B-003", squad: "Bravo", lastSeen: "15 sec ago", temperature: 31.4, lng: 106.84, lat: -6.25 },
  { id: "WPN-012", serial: "LMG-ALP-012", type: "LMG", status: "low-battery", battery: 11, assignedTo: "S-007", squad: "Alpha", lastSeen: "55 sec ago", temperature: 34.2, lng: 106.808, lat: -6.252 },
  { id: "WPN-013", serial: "M4-CHR-013", type: "Assault Rifle (M4)", status: "disconnected", battery: 38, assignedTo: "C-004", squad: "Charlie", lastSeen: "42 mins ago", temperature: 30.1, lng: 106.782, lat: -6.238 },
  { id: "WPN-014", serial: "M4-DLT-014", type: "Assault Rifle (M4)", status: "maintenance", battery: null, assignedTo: "D-002", squad: "Delta", lastSeen: "5 hours ago", temperature: null, lng: 106.818, lat: -6.272 },
  { id: "WPN-015", serial: "M4-ALP-015", type: "Assault Rifle (M4)", status: "connected", battery: 90, assignedTo: "S-005", squad: "Alpha", lastSeen: "9 sec ago", temperature: 31.6, lng: 106.802, lat: -6.234 },
  { id: "WPN-016", serial: "M4-BRV-016", type: "Assault Rifle (M4)", status: "low-battery", battery: 18, assignedTo: "B-005", squad: "Bravo", lastSeen: "28 sec ago", temperature: 32.8, lng: 106.836, lat: -6.254 },
];

export const AREA_GREEN: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { label: "Ops Zone" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [106.792, -6.228],
            [106.842, -6.226],
            [106.848, -6.262],
            [106.794, -6.266],
            [106.792, -6.228],
          ],
        ],
      },
    },
  ],
};

export const AREA_RESTRICTED: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { label: "⚠ Restricted" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [106.82, -6.22],
            [106.848, -6.218],
            [106.85, -6.238],
            [106.826, -6.242],
            [106.82, -6.22],
          ],
        ],
      },
    },
  ],
};

export function statusLabel(status: WeaponStatus) {
  switch (status) {
    case "connected":
      return "Connected";
    case "disconnected":
      return "Disconnected";
    case "unassigned":
      return "Unassigned";
    case "low-battery":
      return "Low Battery";
    case "maintenance":
      return "Maintenance";
  }
}

export function matchesFilter(weapon: WeaponAsset, filter: MapFilter) {
  return filter === "all" || weapon.status === filter;
}
