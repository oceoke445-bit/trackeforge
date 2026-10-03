import type { IconName } from "@/components/ui/icon";

export type PersonnelStatus = "online" | "warning" | "critical" | "offline";

export type Personnel = {
  id: string;
  name: string;
  status: PersonnelStatus;
  squad: string;
  hr: number | null;
  temp: number | null;
  battery: number | null;
  lastSeen: string;
  lng: number;
  lat: number;
};

export const commandStats = [
  { label: "Total Personnel", value: "48", meta: "↑ 2 from yesterday", tone: "green", icon: "users" as IconName },
  { label: "Online", value: "45", meta: "93.8% online", tone: "cyan", icon: "signal" as IconName, ring: 94 },
  { label: "Alert", value: "4", meta: "1 critical · 3 warning", tone: "red", icon: "bell" as IconName },
  { label: "Total Weapons", value: "46", meta: "↑ 1 from yesterday", tone: "blue", icon: "crosshair" as IconName },
  { label: "Connected", value: "43", meta: "93.5% connected", tone: "green", icon: "link" as IconName, ring: 94 },
  { label: "Registered Assets", value: "12", meta: "All operational", tone: "violet", icon: "box" as IconName },
];

export const personnel: Personnel[] = [
  { id: "S-001", name: "Ahmad Rizki", status: "online", squad: "Alpha", hr: 78, temp: 36.5, battery: 92, lastSeen: "Just now", lng: 106.792, lat: -6.232 },
  { id: "S-004", name: "Budi Santoso", status: "online", squad: "Alpha", hr: 84, temp: 36.7, battery: 81, lastSeen: "12 sec", lng: 106.802, lat: -6.24 },
  { id: "S-008", name: "Citra Dewi", status: "warning", squad: "Bravo", hr: 118, temp: 37.4, battery: 44, lastSeen: "28 sec", lng: 106.818, lat: -6.246 },
  { id: "S-011", name: "Dimas Pratama", status: "online", squad: "Bravo", hr: 72, temp: 36.4, battery: 88, lastSeen: "41 sec", lng: 106.828, lat: -6.238 },
  { id: "S-014", name: "Eka Nugraha", status: "critical", squad: "Charlie", hr: 142, temp: 38.2, battery: 61, lastSeen: "Just now", lng: 106.812, lat: -6.252 },
  { id: "S-017", name: "Fajar Malik", status: "online", squad: "Charlie", hr: 80, temp: 36.6, battery: 76, lastSeen: "1 min", lng: 106.84, lat: -6.255 },
  { id: "S-019", name: "Intan Sari", status: "online", squad: "Bravo", hr: 75, temp: 36.5, battery: 87, lastSeen: "22 sec", lng: 106.825, lat: -6.262 },
  { id: "S-021", name: "Gita Lestari", status: "offline", squad: "Delta", hr: null, temp: null, battery: 12, lastSeen: "18 min", lng: 106.786, lat: -6.258 },
  { id: "S-023", name: "Joko Widodo", status: "warning", squad: "Alpha", hr: 121, temp: 37.2, battery: 38, lastSeen: "45 sec", lng: 106.798, lat: -6.25 },
  { id: "S-025", name: "Hendra Wijaya", status: "online", squad: "Delta", hr: 76, temp: 36.5, battery: 95, lastSeen: "8 sec", lng: 106.855, lat: -6.242 },
  { id: "S-028", name: "Kirana Putri", status: "online", squad: "Charlie", hr: 79, temp: 36.6, battery: 90, lastSeen: "15 sec", lng: 106.808, lat: -6.228 },
  { id: "S-031", name: "Lutfi Hakim", status: "online", squad: "Delta", hr: 81, temp: 36.4, battery: 73, lastSeen: "33 sec", lng: 106.848, lat: -6.268 },
];

export const activeAlerts = [
  { title: "SOS Activated", subject: "S-014 · Eka Nugraha", time: "2 min ago", level: "critical", icon: "bolt" as IconName },
  { title: "Heat Stress Detected", subject: "S-014 · Body temp 38.2°C", time: "3 min ago", level: "critical", icon: "heart" as IconName },
  { title: "Elevated Heart Rate", subject: "S-008 · Citra Dewi · 118 BPM", time: "6 min ago", level: "high", icon: "heart" as IconName },
  { title: "Low Battery Warning", subject: "S-021 · Device 12%", time: "11 min ago", level: "medium", icon: "bolt" as IconName },
  { title: "Geofence Breach", subject: "S-014 entered Restricted Area", time: "14 min ago", level: "high", icon: "shield" as IconName },
];

export const liveFeed = [
  { time: "16:42:18", text: "S-014 location updated", tag: "Personnel", tone: "red" },
  { time: "16:41:55", text: "SOS beacon acknowledged by SOC", tag: "Alert", tone: "red" },
  { time: "16:40:12", text: "Weapon W-221 telemetry synced", tag: "Weapon", tone: "green" },
  { time: "16:39:48", text: "Gateway GW-002 recovered", tag: "Infrastructure", tone: "green" },
  { time: "16:38:05", text: "S-008 vitals elevated", tag: "Personnel", tone: "orange" },
  { time: "16:36:40", text: "Squad Bravo checkpoint reached", tag: "Personnel", tone: "blue" },
];

export const healthBreakdown = [
  { label: "Normal", value: 39, pct: "81.3%", color: "#34d399" },
  { label: "Elevated", value: 6, pct: "12.5%", color: "#fbbf24" },
  { label: "Critical", value: 1, pct: "2.1%", color: "#f87171" },
  { label: "No Data", value: 2, pct: "4.1%", color: "#64748b" },
];

export const assetBreakdown = [
  { label: "Connected", value: 43, color: "#34d399" },
  { label: "Disconnected", value: 2, color: "#f87171" },
  { label: "Unassigned", value: 1, color: "#94a3b8" },
];
