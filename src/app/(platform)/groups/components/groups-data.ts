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
  activity: { time: string; text: string; tone: "green" | "red" | "orange" | "blue" }[];
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
    activity: [
      { time: "16:54:12", text: "S-003 location updated", tone: "blue" },
      { time: "16:52:40", text: "WPN-003 disconnected", tone: "red" },
      { time: "16:50:18", text: "S-007 low battery warning", tone: "orange" },
      { time: "16:48:05", text: "Alpha Area checkpoint cleared", tone: "green" },
      { time: "16:45:33", text: "S-004 vitals elevated", tone: "orange" },
      { time: "16:42:10", text: "Mission status confirmed On Mission", tone: "green" },
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
    activity: [
      { time: "16:51:02", text: "Bravo convoy cleared checkpoint", tone: "green" },
      { time: "16:47:18", text: "WPN-B04 link lost", tone: "red" },
      { time: "16:44:40", text: "B-002 entered Corridor B", tone: "blue" },
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
    activity: [
      { time: "16:53:20", text: "Charlie overwatch established", tone: "green" },
      { time: "16:49:11", text: "Contact reported near ridge", tone: "orange" },
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
    activity: [
      { time: "16:40:00", text: "Delta remains on standby", tone: "blue" },
      { time: "16:20:14", text: "QRF readiness check passed", tone: "green" },
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
    activity: [
      { time: "16:30:00", text: "Echo logistics sync complete", tone: "green" },
      { time: "16:10:22", text: "Comms relay healthy", tone: "blue" },
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
