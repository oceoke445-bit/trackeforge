export type OpStatus = "Active" | "Planning" | "Completed" | "On Hold" | "Cancelled";

export type OpLayers = {
  groups: boolean;
  personnel: boolean;
};

export type OpGroupRow = {
  name: string;
  count: number;
  commander: string;
  status: string;
  members: string[];
};

const MEMBER_NAMES = [
  "Andi", "Budi", "Citra", "Dewi", "Eko", "Fajar", "Gita", "Hadi",
  "Indra", "Joko", "Kirana", "Laras", "Maya", "Nanda", "Omar", "Putri",
];

export function membersFor(commander: string, count: number, seed = 0): string[] {
  const ranks = ["Pvt.", "Cpl.", "Sgt.", "Spc."];
  const members = [commander];
  for (let index = 1; index < count; index += 1) {
    const rank = ranks[(index + seed) % ranks.length];
    const name = MEMBER_NAMES[(index + seed) % MEMBER_NAMES.length];
    members.push(`${rank} ${name}`);
  }
  return members;
}

function groupRow(name: string, count: number, commander: string, status: string, seed = 0): OpGroupRow {
  return { name, count, commander, status, members: membersFor(commander, count, seed) };
}

export type OpGeofenceRow = {
  id?: number;
  name: string;
  type: "POLYGON" | "CIRCLE";
};

export type OpTicketRow = {
  id: number;
  code: string;
  status: string;
  priority: string;
  alertType: string;
};

export type Operation = {
  id: string;
  name: string;
  sector: string;
  start: string;
  end: string;
  startAt: string;
  endAt: string;
  days: string;
  status: OpStatus;
  groups: number;
  personnel: number;
  weapons: number;
  geofences: number;
  devices: number;
  photo: string;
  focus: string;
  summary: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  groupsActive: number;
  personnelOnline: number;
  weaponsOnline: number;
  alerts: number;
  critical: number;
  groupRows: OpGroupRow[];
  geofenceRows: OpGeofenceRow[];
  alertRows: { id?: number; title: string; detail: string; level: string; status?: string }[];
  ticketRows?: OpTicketRow[];
  startAtIso?: string;
  endAtIso?: string;
  groupIds?: number[];
  geofenceIds?: number[];
  gateway: string;
  gatewayPlace: string;
  uplink: string;
  signal: number;
  timeline: { time: string; text: string }[];
  center: [number, number];
  ring: [number, number][];
  route: [number, number][];
  pins: { name: string; lng: number; lat: number }[];
  people: [number, number][];
  weaponPins: [number, number][];
  alertPins: [number, number][];
  gatewayPin: [number, number];
};

export const OP_STATUSES: OpStatus[] = ["Active", "Planning", "Completed", "On Hold", "Cancelled"];

export const CATALOG_GROUPS = [
  { id: "alpha", name: "Alpha", personnel: 12, commander: "Lt. Rina" },
  { id: "bravo", name: "Bravo", personnel: 10, commander: "Sgt. Dimas" },
  { id: "charlie", name: "Charlie", personnel: 8, commander: "Cpl. Fajar" },
  { id: "delta", name: "Delta", personnel: 9, commander: "Lt. Arif" },
  { id: "echo", name: "Echo", personnel: 7, commander: "Sgt. Maya" },
  { id: "weapons", name: "Weapons", personnel: 6, commander: "WO Budi" },
];

export const CATALOG_GEOFENCES = [
  { id: "north", name: "North Perimeter", type: "POLYGON" as const },
  { id: "recon", name: "Recon Zone", type: "POLYGON" as const },
  { id: "staging", name: "Staging Area", type: "CIRCLE" as const },
  { id: "coastal", name: "Coastal Watch", type: "POLYGON" as const },
  { id: "ridge", name: "Eastern Ridge", type: "POLYGON" as const },
  { id: "valley", name: "Western Valley", type: "CIRCLE" as const },
];

function diamond(lng: number, lat: number): [number, number][] {
  const ring: [number, number][] = [
    [lng - 0.018, lat + 0.008],
    [lng + 0.016, lat + 0.006],
    [lng + 0.012, lat - 0.014],
    [lng - 0.014, lat - 0.01],
  ];
  ring.push(ring[0]);
  return ring;
}

export function scene(lng: number, lat: number, names: string[]) {
  const ring = diamond(lng, lat);
  const pins = names.map((name, index) => ({
    name,
    lng: lng - 0.01 + index * 0.01,
    lat: lat + 0.002 - index * 0.006,
  }));
  return {
    center: [lng, lat] as [number, number],
    ring,
    route: pins.map((pin) => [pin.lng, pin.lat] as [number, number]),
    pins,
    people: pins.flatMap((pin) => [[pin.lng + 0.003, pin.lat + 0.002], [pin.lng - 0.002, pin.lat - 0.003]] as [number, number][]),
    weaponPins: pins.map((pin) => [pin.lng + 0.004, pin.lat - 0.002] as [number, number]),
    alertPins: [[lng, lat - 0.002], [lng + 0.006, lat + 0.001]] as [number, number][],
    gatewayPin: [lng + 0.014, lat + 0.006] as [number, number],
  };
}

const PHOTOS = ["/images/login-hero.jpg", "/images/login-map.png", "/images/weapon-rifle.jpg"];

export const OPERATIONS: Operation[] = [
  {
    id: "alpha",
    name: "Operation Alpha",
    sector: "Northern Sector",
    start: "03 Oct 2026",
    end: "05 Oct 2026",
    startAt: "03 Oct 2026 08:00",
    endAt: "05 Oct 2026 16:00",
    days: "2 days",
    status: "Active",
    groups: 3,
    personnel: 24,
    weapons: 6,
    geofences: 2,
    devices: 18,
    photo: PHOTOS[0],
    focus: "center",
    summary: "Reconnaissance and surveillance operation in Northern Sector to monitor potential movement and secure key routes.",
    createdBy: "Admin User",
    createdAt: "02 Oct 2026 10:24",
    updatedAt: "03 Oct 2026 12:16",
    groupsActive: 2,
    personnelOnline: 22,
    weaponsOnline: 6,
    alerts: 2,
    critical: 1,
    groupRows: [
      groupRow("Alpha-1", 8, "Lt. Rina", "Active", 0),
      groupRow("Alpha-2", 8, "Sgt. Dimas", "Active", 3),
      groupRow("Alpha-3", 8, "Cpl. Fajar", "Active", 6),
    ],
    geofenceRows: [
      { name: "North Perimeter", type: "POLYGON" },
      { name: "Recon Zone", type: "POLYGON" },
    ],
    alertRows: [
      { title: "Personnel Inactive", detail: "Alpha-2 · 15 min ago", level: "Critical" },
      { title: "Out of Geofence", detail: "Alpha-3 · 42 min ago", level: "Medium" },
    ],
    gateway: "GW-01",
    gatewayPlace: "Northern Ridge",
    uplink: "03 Oct 2026 14:26",
    signal: 4,
    timeline: [
      { time: "14:26", text: "Alpha-1 entered operation area" },
      { time: "14:12", text: "Personnel inactive alert (Alpha-2)" },
      { time: "13:40", text: "New geofence applied" },
      { time: "08:00", text: "Operation Alpha started" },
    ],
    ...scene(106.845, -6.255, ["Alpha-1", "Alpha-2", "Alpha-3"]),
  },
  {
    id: "bravo",
    name: "Operation Bravo",
    sector: "Coastal Area",
    start: "02 Oct 2026",
    end: "04 Oct 2026",
    startAt: "02 Oct 2026 06:00",
    endAt: "04 Oct 2026 18:00",
    days: "2 days",
    status: "Planning",
    groups: 2,
    personnel: 16,
    weapons: 6,
    geofences: 1,
    devices: 12,
    photo: PHOTOS[1],
    focus: "center",
    summary: "Coastal watch for Operation Bravo. Teams hold the shoreline approaches and report movement along the coastal road.",
    createdBy: "Admin User",
    createdAt: "01 Oct 2026 09:10",
    updatedAt: "02 Oct 2026 11:40",
    groupsActive: 2,
    personnelOnline: 15,
    weaponsOnline: 6,
    alerts: 1,
    critical: 0,
    groupRows: [
      groupRow("Bravo-1", 8, "Lt. Arif", "Active", 1),
      groupRow("Bravo-2", 8, "Sgt. Maya", "Active", 4),
    ],
    geofenceRows: [{ name: "Coastal Watch", type: "POLYGON" }],
    alertRows: [{ title: "Route deviation", detail: "Bravo-2 · 28 min ago", level: "Medium" }],
    gateway: "GW-02",
    gatewayPlace: "Coastal Ridge",
    uplink: "02 Oct 2026 16:05",
    signal: 5,
    timeline: [
      { time: "16:05", text: "Bravo-1 reached the coastal checkpoint" },
      { time: "06:00", text: "Operation Bravo started" },
    ],
    ...scene(106.9, -6.28, ["Bravo-1", "Bravo-2"]),
  },
  {
    id: "charlie",
    name: "Operation Charlie",
    sector: "Southern Sector",
    start: "01 Oct 2026",
    end: "03 Oct 2026",
    startAt: "01 Oct 2026 07:00",
    endAt: "03 Oct 2026 19:00",
    days: "2 days",
    status: "On Hold",
    groups: 4,
    personnel: 28,
    weapons: 8,
    geofences: 2,
    devices: 20,
    photo: PHOTOS[2],
    focus: "center 40%",
    summary: "Planned sweep of the Southern Sector. Routes and geofences are staged before the teams step off.",
    createdBy: "Admin User",
    createdAt: "30 Sep 2026 15:00",
    updatedAt: "01 Oct 2026 08:12",
    groupsActive: 1,
    personnelOnline: 20,
    weaponsOnline: 7,
    alerts: 0,
    critical: 0,
    groupRows: [
      groupRow("Charlie-1", 8, "Lt. Rina", "Active", 2),
      groupRow("Charlie-2", 8, "Sgt. Dimas", "Planning", 5),
      groupRow("Charlie-3", 6, "Cpl. Fajar", "Planning", 8),
      groupRow("Charlie-4", 6, "WO Budi", "Planning", 11),
    ],
    geofenceRows: [
      { name: "Staging Area", type: "CIRCLE" },
      { name: "Recon Zone", type: "POLYGON" },
    ],
    alertRows: [],
    gateway: "GW-03",
    gatewayPlace: "South Relay",
    uplink: "01 Oct 2026 08:12",
    signal: 3,
    timeline: [{ time: "08:12", text: "Operation Charlie plan saved" }],
    ...scene(106.78, -6.31, ["Charlie-1", "Charlie-2", "Charlie-3"]),
  },
  {
    id: "delta",
    name: "Operation Delta",
    sector: "Eastern Ridge",
    start: "28 Sep 2026",
    end: "02 Oct 2026",
    startAt: "28 Sep 2026 05:30",
    endAt: "02 Oct 2026 17:00",
    days: "4 days",
    status: "Completed",
    groups: 3,
    personnel: 20,
    weapons: 6,
    geofences: 1,
    devices: 14,
    photo: PHOTOS[0],
    focus: "center top",
    summary: "Eastern Ridge patrol. The operation closed after the ridge line was cleared and handed back.",
    createdBy: "Admin User",
    createdAt: "27 Sep 2026 11:00",
    updatedAt: "02 Oct 2026 17:10",
    groupsActive: 0,
    personnelOnline: 0,
    weaponsOnline: 6,
    alerts: 0,
    critical: 0,
    groupRows: [
      groupRow("Delta-1", 8, "Lt. Arif", "Completed", 0),
      groupRow("Delta-2", 6, "Sgt. Maya", "Completed", 7),
      groupRow("Delta-3", 6, "Cpl. Fajar", "Completed", 10),
    ],
    geofenceRows: [{ name: "Eastern Ridge", type: "POLYGON" }],
    alertRows: [],
    gateway: "GW-04",
    gatewayPlace: "Eastern Ridge",
    uplink: "02 Oct 2026 17:00",
    signal: 4,
    timeline: [{ time: "17:00", text: "Operation Delta completed" }],
    ...scene(106.96, -6.24, ["Delta-1", "Delta-2", "Delta-3"]),
  },
  {
    id: "echo",
    name: "Operation Echo",
    sector: "Western Valley",
    start: "25 Sep 2026",
    end: "28 Sep 2026",
    startAt: "25 Sep 2026 06:00",
    endAt: "28 Sep 2026 18:00",
    days: "3 days",
    status: "Completed",
    groups: 2,
    personnel: 14,
    weapons: 4,
    geofences: 1,
    devices: 10,
    photo: PHOTOS[1],
    focus: "left center",
    summary: "Western Valley reconnaissance. Both groups finished the route and returned to base.",
    createdBy: "Sertu Arif",
    createdAt: "24 Sep 2026 13:20",
    updatedAt: "28 Sep 2026 18:05",
    groupsActive: 0,
    personnelOnline: 0,
    weaponsOnline: 4,
    alerts: 0,
    critical: 0,
    groupRows: [
      groupRow("Echo-1", 8, "Sgt. Maya", "Completed", 2),
      groupRow("Echo-2", 6, "WO Budi", "Completed", 9),
    ],
    geofenceRows: [{ name: "Western Valley", type: "CIRCLE" }],
    alertRows: [],
    gateway: "GW-05",
    gatewayPlace: "Valley Floor",
    uplink: "28 Sep 2026 18:00",
    signal: 3,
    timeline: [{ time: "18:00", text: "Operation Echo completed" }],
    ...scene(106.74, -6.22, ["Echo-1", "Echo-2"]),
  },
];
