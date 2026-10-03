import type { IconName } from "@/components/ui/icon";
import type { PersonnelStatus } from "@/app/(platform)/components/command-data";

export type GroupId = "alpha" | "bravo" | "charlie" | "delta" | "echo";

export type GroupMember = {
  id: string;
  name: string;
  rank: string;
  status: PersonnelStatus;
  hr: number | null;
  temp: number | null;
  battery: number | null;
  weapon: string;
  lastSeen: string;
  lng: number;
  lat: number;
};

export type GroupWeapon = {
  id: string;
  type: string;
  status: "connected" | "disconnected" | "unassigned";
  assignedTo: string;
};

export type GroupHistoryCategory = "mission" | "alert" | "asset" | "location" | "comms";

export type GroupHistoryEvent = {
  id: string;
  time: string;
  date: string;
  category: GroupHistoryCategory;
  title: string;
  detail: string;
  actor: string;
  tone: "green" | "red" | "orange" | "blue";
};

export type GroupInfo = {
  id: GroupId;
  name: string;
  emblem: IconName;
  tone: "green" | "blue" | "amber" | "violet" | "cyan";
  status: "Active" | "Standby" | "Off Duty";
  platoon: string;
  sector: string;
  mission: string;
  commander: string;
  callSign: string;
  brief: string;
  startTime: string;
  duration: string;
  area: string;
  missionStatus: "On Mission" | "Staging" | "Complete";
  coverage: number;
  latency: string;
  members: GroupMember[];
  weapons: GroupWeapon[];
  history: GroupHistoryEvent[];
  areaPolygon: [number, number][];
};

const alphaMembers: GroupMember[] = [
  { id: "S-001", name: "Rizky Pratama", rank: "Sgt", status: "online", hr: 78, temp: 36.5, battery: 92, weapon: "WPN-001", lastSeen: "Just now", lng: 106.798, lat: -6.236 },
  { id: "S-002", name: "Budi Santoso", rank: "Cpl", status: "online", hr: 82, temp: 36.6, battery: 88, weapon: "WPN-002", lastSeen: "8 sec", lng: 106.804, lat: -6.24 },
  { id: "S-003", name: "Andi Wijaya", rank: "Pvt", status: "online", hr: 76, temp: 36.4, battery: 85, weapon: "WPN-003", lastSeen: "14 sec", lng: 106.81, lat: -6.244 },
  { id: "S-004", name: "Dimas Arief", rank: "Cpl", status: "warning", hr: 118, temp: 37.3, battery: 41, weapon: "WPN-004", lastSeen: "22 sec", lng: 106.816, lat: -6.248 },
  { id: "S-005", name: "Fajar Malik", rank: "Pvt", status: "online", hr: 80, temp: 36.5, battery: 90, weapon: "WPN-005", lastSeen: "31 sec", lng: 106.808, lat: -6.252 },
  { id: "S-006", name: "Hendra Putra", rank: "Pvt", status: "online", hr: 74, temp: 36.4, battery: 79, weapon: "WPN-006", lastSeen: "40 sec", lng: 106.8, lat: -6.246 },
  { id: "S-007", name: "Gilang Saputra", rank: "Cpl", status: "online", hr: 83, temp: 36.7, battery: 22, weapon: "WPN-007", lastSeen: "55 sec", lng: 106.814, lat: -6.238 },
  { id: "S-008", name: "Yoga Firmansyah", rank: "Pvt", status: "online", hr: 77, temp: 36.5, battery: 95, weapon: "WPN-008", lastSeen: "1 min", lng: 106.806, lat: -6.234 },
];

function offsetMembers(base: GroupMember[], dLng: number, dLat: number, prefix: string): GroupMember[] {
  return base.map((member, i) => ({
    ...member,
    id: `${prefix}${String(i + 1).padStart(3, "0")}`,
    weapon: `WPN-${prefix.slice(1)}${String(i + 1).padStart(2, "0")}`,
    lng: member.lng + dLng,
    lat: member.lat + dLat,
  }));
}

export const groups: GroupInfo[] = [
  {
    id: "alpha",
    name: "Alpha",
    emblem: "shield",
    tone: "green",
    status: "Active",
    platoon: "1st Platoon",
    sector: "Sector North",
    mission: "Secure perimeter & recon",
    commander: "Cpt. Andi Pratama",
    callSign: "ALPHA-01",
    brief: "Lead element for perimeter security and early warning. Maintain coverage across Sector North and report all contacts.",
    startTime: "03 Oct 2026, 06:00 WIB",
    duration: "12 hours",
    area: "Sector North · Zone Alpha",
    missionStatus: "On Mission",
    coverage: 94,
    latency: "28ms",
    members: alphaMembers,
    weapons: [
      { id: "WPN-001", type: "Assault Rifle", status: "connected", assignedTo: "S-001" },
      { id: "WPN-002", type: "Assault Rifle", status: "connected", assignedTo: "S-002" },
      { id: "WPN-003", type: "DMR", status: "disconnected", assignedTo: "S-003" },
      { id: "WPN-004", type: "Assault Rifle", status: "connected", assignedTo: "S-004" },
      { id: "WPN-005", type: "Assault Rifle", status: "connected", assignedTo: "S-005" },
      { id: "WPN-006", type: "Sidearm", status: "connected", assignedTo: "S-006" },
      { id: "WPN-007", type: "Assault Rifle", status: "connected", assignedTo: "S-007" },
      { id: "WPN-008", type: "Assault Rifle", status: "connected", assignedTo: "S-008" },
    ],
    history: [
      { id: "AH-01", time: "16:54:12", date: "04 Oct 2026", category: "location", title: "S-003 location updated", detail: "Grid N-14 · Sector North perimeter sweep", actor: "S-003", tone: "blue" },
      { id: "AH-02", time: "16:52:40", date: "04 Oct 2026", category: "asset", title: "WPN-003 disconnected", detail: "DMR link lost · last RSSI −98 dBm", actor: "WPN-003", tone: "red" },
      { id: "AH-03", time: "16:50:18", date: "04 Oct 2026", category: "alert", title: "S-007 low battery warning", detail: "Wearable battery at 22% · recommend swap", actor: "S-007", tone: "orange" },
      { id: "AH-04", time: "16:48:05", date: "04 Oct 2026", category: "mission", title: "Checkpoint cleared", detail: "Alpha Area north gate secured", actor: "ALPHA-01", tone: "green" },
      { id: "AH-05", time: "16:45:33", date: "04 Oct 2026", category: "alert", title: "S-004 vitals elevated", detail: "HR 118 BPM · Temp 37.3°C", actor: "S-004", tone: "orange" },
      { id: "AH-06", time: "16:42:10", date: "04 Oct 2026", category: "mission", title: "Mission status confirmed", detail: "Status set to On Mission", actor: "ALPHA-01", tone: "green" },
      { id: "AH-07", time: "16:28:44", date: "04 Oct 2026", category: "comms", title: "Mesh hop path refreshed", detail: "S-001 → GW-002 · 2 hops · excellent", actor: "Mesh", tone: "blue" },
      { id: "AH-08", time: "15:10:02", date: "04 Oct 2026", category: "mission", title: "Patrol route assigned", detail: "Route North-A loaded to squad terminals", actor: "Cpt. Andi Pratama", tone: "green" },
      { id: "AH-09", time: "06:00:00", date: "04 Oct 2026", category: "mission", title: "Group Alpha deployed", detail: "Mission window started · 12h duration", actor: "HQ", tone: "blue" },
    ],
    areaPolygon: [
      [106.792, -6.228],
      [106.822, -6.226],
      [106.826, -6.252],
      [106.798, -6.258],
      [106.792, -6.228],
    ],
  },
  {
    id: "bravo",
    name: "Bravo",
    emblem: "users",
    tone: "blue",
    status: "Active",
    platoon: "1st Platoon",
    sector: "Sector East",
    mission: "Route security",
    commander: "Lt. Sari Wibowo",
    callSign: "BRAVO-01",
    brief: "Provide route security along eastern corridor and escort logistics movements.",
    startTime: "03 Oct 2026, 07:30 WIB",
    duration: "10 hours",
    area: "Sector East · Corridor B",
    missionStatus: "On Mission",
    coverage: 91,
    latency: "32ms",
    members: offsetMembers(alphaMembers, 0.03, -0.01, "B-"),
    weapons: [
      { id: "WPN-B01", type: "Assault Rifle", status: "connected", assignedTo: "B-001" },
      { id: "WPN-B02", type: "Assault Rifle", status: "connected", assignedTo: "B-002" },
      { id: "WPN-B03", type: "DMR", status: "connected", assignedTo: "B-003" },
      { id: "WPN-B04", type: "Assault Rifle", status: "disconnected", assignedTo: "B-004" },
      { id: "WPN-B05", type: "Assault Rifle", status: "connected", assignedTo: "B-005" },
      { id: "WPN-B06", type: "Sidearm", status: "connected", assignedTo: "B-006" },
    ],
    history: [
      { id: "BH-01", time: "16:51:02", date: "04 Oct 2026", category: "mission", title: "Convoy cleared checkpoint", detail: "Eastern corridor checkpoint B-2 green", actor: "BRAVO-01", tone: "green" },
      { id: "BH-02", time: "16:47:18", date: "04 Oct 2026", category: "asset", title: "WPN-B04 link lost", detail: "Assault rifle offline · retrying mesh sync", actor: "WPN-B04", tone: "red" },
      { id: "BH-03", time: "16:44:40", date: "04 Oct 2026", category: "location", title: "B-002 entered Corridor B", detail: "Route security sector entry logged", actor: "B-002", tone: "blue" },
      { id: "BH-04", time: "16:20:11", date: "04 Oct 2026", category: "comms", title: "Escort channel synced", detail: "Logistics radio net joined", actor: "Lt. Sari Wibowo", tone: "blue" },
      { id: "BH-05", time: "15:55:30", date: "04 Oct 2026", category: "alert", title: "B-004 signal degraded", detail: "RSSI dropped below −90 dBm", actor: "B-004", tone: "orange" },
      { id: "BH-06", time: "07:30:00", date: "04 Oct 2026", category: "mission", title: "Group Bravo deployed", detail: "Route security mission started", actor: "HQ", tone: "green" },
    ],
    areaPolygon: [
      [106.828, -6.232],
      [106.858, -6.23],
      [106.86, -6.258],
      [106.83, -6.262],
      [106.828, -6.232],
    ],
  },
  {
    id: "charlie",
    name: "Charlie",
    emblem: "crosshair",
    tone: "amber",
    status: "Active",
    platoon: "2nd Platoon",
    sector: "Sector West",
    mission: "Overwatch & support",
    commander: "Lt. Reza Mahendra",
    callSign: "CHARLIE-01",
    brief: "Overwatch and fire support for Alpha. Monitor restricted boundary approaches.",
    startTime: "03 Oct 2026, 06:15 WIB",
    duration: "12 hours",
    area: "Sector West · Ridge Line",
    missionStatus: "On Mission",
    coverage: 88,
    latency: "35ms",
    members: offsetMembers(alphaMembers.slice(0, 7), -0.02, 0.012, "C-"),
    weapons: [
      { id: "WPN-C01", type: "DMR", status: "connected", assignedTo: "C-001" },
      { id: "WPN-C02", type: "Assault Rifle", status: "connected", assignedTo: "C-002" },
      { id: "WPN-C03", type: "Assault Rifle", status: "connected", assignedTo: "C-003" },
      { id: "WPN-C04", type: "Sidearm", status: "unassigned", assignedTo: "—" },
      { id: "WPN-C05", type: "Assault Rifle", status: "connected", assignedTo: "C-005" },
    ],
    history: [
      { id: "CH-01", time: "16:53:20", date: "04 Oct 2026", category: "mission", title: "Overwatch established", detail: "Ridge line OP-2 occupied", actor: "CHARLIE-01", tone: "green" },
      { id: "CH-02", time: "16:49:11", date: "04 Oct 2026", category: "alert", title: "Contact near ridge", detail: "Unverified movement · west approach", actor: "C-001", tone: "orange" },
      { id: "CH-03", time: "16:30:05", date: "04 Oct 2026", category: "asset", title: "WPN-C04 unassigned", detail: "Sidearm staged at support cache", actor: "WPN-C04", tone: "blue" },
      { id: "CH-04", time: "15:40:22", date: "04 Oct 2026", category: "location", title: "C-002 repositioned", detail: "Moved to overwatch secondary", actor: "C-002", tone: "blue" },
      { id: "CH-05", time: "06:15:00", date: "04 Oct 2026", category: "mission", title: "Group Charlie deployed", detail: "Fire support window opened", actor: "HQ", tone: "green" },
    ],
    areaPolygon: [
      [106.77, -6.22],
      [106.798, -6.218],
      [106.8, -6.245],
      [106.772, -6.248],
      [106.77, -6.22],
    ],
  },
  {
    id: "delta",
    name: "Delta",
    emblem: "bolt",
    tone: "violet",
    status: "Standby",
    platoon: "2nd Platoon",
    sector: "Sector South",
    mission: "QRF standby",
    commander: "Cpt. Nadia Putri",
    callSign: "DELTA-01",
    brief: "Quick reaction force on standby. Ready to reinforce Alpha or Bravo within 8 minutes.",
    startTime: "03 Oct 2026, 08:00 WIB",
    duration: "8 hours",
    area: "Sector South · Staging Yard",
    missionStatus: "Staging",
    coverage: 96,
    latency: "24ms",
    members: offsetMembers(alphaMembers.slice(0, 6), 0.01, 0.02, "D-"),
    weapons: [
      { id: "WPN-D01", type: "Assault Rifle", status: "connected", assignedTo: "D-001" },
      { id: "WPN-D02", type: "Assault Rifle", status: "connected", assignedTo: "D-002" },
      { id: "WPN-D03", type: "Assault Rifle", status: "connected", assignedTo: "D-003" },
      { id: "WPN-D04", type: "Sidearm", status: "connected", assignedTo: "D-004" },
    ],
    history: [
      { id: "DH-01", time: "16:40:00", date: "04 Oct 2026", category: "mission", title: "Delta remains on standby", detail: "QRF posture unchanged · 8 min response", actor: "DELTA-01", tone: "blue" },
      { id: "DH-02", time: "16:20:14", date: "04 Oct 2026", category: "mission", title: "QRF readiness check passed", detail: "Vehicles, weapons, and med kit green", actor: "Cpt. Nadia Putri", tone: "green" },
      { id: "DH-03", time: "14:05:40", date: "04 Oct 2026", category: "comms", title: "Staging yard net check", detail: "All Delta nodes acknowledged", actor: "Mesh", tone: "blue" },
      { id: "DH-04", time: "08:00:00", date: "04 Oct 2026", category: "mission", title: "Group Delta staged", detail: "Standby window started", actor: "HQ", tone: "green" },
    ],
    areaPolygon: [
      [106.8, -6.26],
      [106.835, -6.258],
      [106.838, -6.282],
      [106.798, -6.284],
      [106.8, -6.26],
    ],
  },
  {
    id: "echo",
    name: "Echo",
    emblem: "signal",
    tone: "cyan",
    status: "Off Duty",
    platoon: "Support",
    sector: "HQ",
    mission: "Comms & logistics",
    commander: "Lt. Fauzan Malik",
    callSign: "ECHO-01",
    brief: "Communications relay and logistics coordination from HQ. Limited field deployment.",
    startTime: "03 Oct 2026, 05:00 WIB",
    duration: "24 hours",
    area: "Headquarters",
    missionStatus: "Staging",
    coverage: 99,
    latency: "18ms",
    members: offsetMembers(alphaMembers.slice(0, 5), -0.015, -0.018, "E-"),
    weapons: [
      { id: "WPN-E01", type: "Sidearm", status: "connected", assignedTo: "E-001" },
      { id: "WPN-E02", type: "Sidearm", status: "connected", assignedTo: "E-002" },
      { id: "WPN-E03", type: "Assault Rifle", status: "unassigned", assignedTo: "—" },
    ],
    history: [
      { id: "EH-01", time: "16:30:00", date: "04 Oct 2026", category: "mission", title: "Logistics sync complete", detail: "Resupply manifest pushed to field units", actor: "ECHO-01", tone: "green" },
      { id: "EH-02", time: "16:10:22", date: "04 Oct 2026", category: "comms", title: "Comms relay healthy", detail: "HQ uplink latency 18ms", actor: "Mesh", tone: "blue" },
      { id: "EH-03", time: "12:15:08", date: "04 Oct 2026", category: "asset", title: "WPN-E03 unassigned", detail: "Spare rifle held at armory", actor: "WPN-E03", tone: "blue" },
      { id: "EH-04", time: "05:00:00", date: "04 Oct 2026", category: "mission", title: "Echo watch started", detail: "24h comms & logistics shift", actor: "HQ", tone: "green" },
    ],
    areaPolygon: [
      [106.78, -6.25],
      [106.8, -6.248],
      [106.802, -6.268],
      [106.778, -6.27],
      [106.78, -6.25],
    ],
  },
];

export function groupStats(group: GroupInfo) {
  const online = group.members.filter((m) => m.status === "online").length;
  const alerts = group.members.filter((m) => m.status === "warning" || m.status === "critical").length;
  const connected = group.weapons.filter((w) => w.status === "connected").length;
  return {
    personnel: group.members.length,
    online,
    alerts,
    weapons: group.weapons.length,
    connected,
  };
}
