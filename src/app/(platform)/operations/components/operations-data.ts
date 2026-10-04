export type OpStatus = "Active" | "Ongoing" | "Planning" | "Completed" | "Cancelled";

export type OpLayers = {
  groups: boolean;
  personnel: boolean;
  weapons: boolean;
  geofences: boolean;
  routes: boolean;
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
  groupRows: { name: string; count: number; status: string }[];
  alertRows: { title: string; detail: string; level: string }[];
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

function scene(lng: number, lat: number, names: string[]) {
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
    days: "3 days",
    status: "Active",
    groups: 3,
    personnel: 24,
    weapons: 6,
    photo: PHOTOS[0],
    focus: "center",
    summary: "Reconnaissance and surveillance operation in Northern Sector to monitor potential movement and secure key routes.",
    createdBy: "Admin",
    createdAt: "02 Oct 2026 10:24",
    updatedAt: "03 Oct 2026 12:16",
    groupsActive: 2,
    personnelOnline: 22,
    weaponsOnline: 6,
    alerts: 2,
    critical: 1,
    groupRows: [
      { name: "Alpha-1", count: 8, status: "Active" },
      { name: "Alpha-2", count: 8, status: "Active" },
      { name: "Alpha-3", count: 8, status: "Active" },
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
    days: "3 days",
    status: "Ongoing",
    groups: 2,
    personnel: 16,
    weapons: 6,
    photo: PHOTOS[1],
    focus: "center",
    summary: "Coastal watch for Operation Bravo. Teams hold the shoreline approaches and report movement along the coastal road.",
    createdBy: "Admin",
    createdAt: "01 Oct 2026 09:10",
    updatedAt: "02 Oct 2026 11:40",
    groupsActive: 2,
    personnelOnline: 15,
    weaponsOnline: 6,
    alerts: 1,
    critical: 0,
    groupRows: [
      { name: "Bravo-1", count: 8, status: "Active" },
      { name: "Bravo-2", count: 8, status: "Active" },
    ],
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
    days: "3 days",
    status: "Planning",
    groups: 4,
    personnel: 28,
    weapons: 8,
    photo: PHOTOS[2],
    focus: "center 40%",
    summary: "Planned sweep of the Southern Sector. Routes and geofences are staged before the teams step off.",
    createdBy: "Admin",
    createdAt: "30 Sep 2026 15:00",
    updatedAt: "01 Oct 2026 08:12",
    groupsActive: 1,
    personnelOnline: 20,
    weaponsOnline: 7,
    alerts: 0,
    critical: 0,
    groupRows: [
      { name: "Charlie-1", count: 8, status: "Active" },
      { name: "Charlie-2", count: 8, status: "Planning" },
      { name: "Charlie-3", count: 6, status: "Planning" },
      { name: "Charlie-4", count: 6, status: "Planning" },
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
    days: "5 days",
    status: "Completed",
    groups: 3,
    personnel: 20,
    weapons: 6,
    photo: PHOTOS[0],
    focus: "center top",
    summary: "Eastern Ridge patrol. The operation closed after the ridge line was cleared and handed back.",
    createdBy: "Admin",
    createdAt: "27 Sep 2026 11:00",
    updatedAt: "02 Oct 2026 17:10",
    groupsActive: 0,
    personnelOnline: 0,
    weaponsOnline: 6,
    alerts: 0,
    critical: 0,
    groupRows: [
      { name: "Delta-1", count: 8, status: "Completed" },
      { name: "Delta-2", count: 6, status: "Completed" },
      { name: "Delta-3", count: 6, status: "Completed" },
    ],
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
    days: "4 days",
    status: "Completed",
    groups: 2,
    personnel: 14,
    weapons: 4,
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
      { name: "Echo-1", count: 8, status: "Completed" },
      { name: "Echo-2", count: 6, status: "Completed" },
    ],
    alertRows: [],
    gateway: "GW-05",
    gatewayPlace: "Valley Floor",
    uplink: "28 Sep 2026 18:00",
    signal: 3,
    timeline: [{ time: "18:00", text: "Operation Echo completed" }],
    ...scene(106.74, -6.22, ["Echo-1", "Echo-2"]),
  },
  {
    id: "foxtrot",
    name: "Operation Foxtrot",
    sector: "Border Patrol",
    start: "20 Sep 2026",
    end: "25 Sep 2026",
    startAt: "20 Sep 2026 04:00",
    endAt: "25 Sep 2026 12:00",
    days: "6 days",
    status: "Cancelled",
    groups: 3,
    personnel: 18,
    weapons: 6,
    photo: PHOTOS[0],
    focus: "center bottom",
    summary: "Border patrol that was cancelled before the second bound. Teams were recalled to base.",
    createdBy: "Admin",
    createdAt: "19 Sep 2026 16:40",
    updatedAt: "21 Sep 2026 09:15",
    groupsActive: 0,
    personnelOnline: 0,
    weaponsOnline: 0,
    alerts: 0,
    critical: 0,
    groupRows: [
      { name: "Foxtrot-1", count: 6, status: "Cancelled" },
      { name: "Foxtrot-2", count: 6, status: "Cancelled" },
      { name: "Foxtrot-3", count: 6, status: "Cancelled" },
    ],
    alertRows: [],
    gateway: "GW-06",
    gatewayPlace: "Border Post",
    uplink: "21 Sep 2026 09:15",
    signal: 2,
    timeline: [{ time: "09:15", text: "Operation Foxtrot cancelled" }],
    ...scene(106.88, -6.33, ["Foxtrot-1", "Foxtrot-2", "Foxtrot-3"]),
  },
  {
    id: "golf",
    name: "Operation Golf",
    sector: "River Line",
    start: "18 Sep 2026",
    end: "22 Sep 2026",
    startAt: "18 Sep 2026 07:00",
    endAt: "22 Sep 2026 17:00",
    days: "5 days",
    status: "Completed",
    groups: 2,
    personnel: 12,
    weapons: 4,
    photo: PHOTOS[1],
    focus: "center",
    summary: "River line observation. Both groups held the crossing points for the full window.",
    createdBy: "Admin",
    createdAt: "17 Sep 2026 10:00",
    updatedAt: "22 Sep 2026 17:20",
    groupsActive: 0,
    personnelOnline: 0,
    weaponsOnline: 4,
    alerts: 0,
    critical: 0,
    groupRows: [
      { name: "Golf-1", count: 6, status: "Completed" },
      { name: "Golf-2", count: 6, status: "Completed" },
    ],
    alertRows: [],
    gateway: "GW-02",
    gatewayPlace: "River Relay",
    uplink: "22 Sep 2026 17:00",
    signal: 4,
    timeline: [{ time: "17:00", text: "Operation Golf completed" }],
    ...scene(106.81, -6.19, ["Golf-1", "Golf-2"]),
  },
  {
    id: "hotel",
    name: "Operation Hotel",
    sector: "North Road",
    start: "06 Oct 2026",
    end: "08 Oct 2026",
    startAt: "06 Oct 2026 05:00",
    endAt: "08 Oct 2026 20:00",
    days: "3 days",
    status: "Planning",
    groups: 2,
    personnel: 16,
    weapons: 6,
    photo: PHOTOS[2],
    focus: "right center",
    summary: "Planned movement watch along the north road. Geofences are drafted and not yet live.",
    createdBy: "Sertu Arif",
    createdAt: "03 Oct 2026 18:00",
    updatedAt: "03 Oct 2026 18:40",
    groupsActive: 0,
    personnelOnline: 16,
    weaponsOnline: 6,
    alerts: 0,
    critical: 0,
    groupRows: [
      { name: "Alpha-1", count: 8, status: "Planning" },
      { name: "Bravo-1", count: 8, status: "Planning" },
    ],
    alertRows: [],
    gateway: "GW-01",
    gatewayPlace: "North Road",
    uplink: "03 Oct 2026 18:40",
    signal: 5,
    timeline: [{ time: "18:40", text: "Operation Hotel draft created" }],
    ...scene(106.86, -6.2, ["Alpha-1", "Bravo-1"]),
  },
];
