export type TrackSource = "GNSS" | "Dead Reckoning" | "Trilateration / RSSI" | "Stale / Unknown";
export type RecordKind = "Telemetry" | "Mesh Frame" | "Uplink" | "Beacon" | "Special" | "System";

export type TrackPoint = {
  index: number;
  soldierId: string;
  seconds: number;
  lng: number;
  lat: number;
  kind: RecordKind;
  source: TrackSource | null;
  hr: number;
  hrv: number;
  spo2: number;
  temp: number;
  battery: number;
  strap: boolean;
  gateway: string;
  hop: number;
  rssi: number;
  snr: number;
  receivedLag: number;
  seq: number;
  flags: number;
  event: boolean;
  sourceId?: number;
  eventUnix?: number;
};

export const TRACK_DAY = "03 Oct 2026";
export const TRACK_SOURCES: TrackSource[] = ["GNSS", "Dead Reckoning", "Trilateration / RSSI", "Stale / Unknown"];

export const SOURCE_COLOR: Record<TrackSource, string> = {
  GNSS: "#22c55e",
  "Dead Reckoning": "#3b82f6",
  "Trilateration / RSSI": "#f59e0b",
  "Stale / Unknown": "#94a3b8",
};

export const ALL_SOLDIERS = "All Soldiers";

export const SOLDIERS = [
  { id: "S-101", group: "Alpha 1-1" },
  { id: "S-102", group: "Alpha 1-2" },
  { id: "S-103", group: "Alpha 1-1" },
  { id: "S-104", group: "Alpha 1-2" },
  { id: "S-105", group: "Bravo 2-1" },
  { id: "S-106", group: "Bravo 2-1" },
  { id: "S-107", group: "Charlie" },
  { id: "S-108", group: "Delta" },
];

export const GROUPS = ["Alpha", "Bravo", "Charlie", "Delta"];
export const WEAPONS = ["W-01", "W-02", "W-03", "W-04"];

const WAYPOINTS: [number, number][] = [
  [106.8033, -6.2303],
  [106.8159, -6.2192],
  [106.8254, -6.2255],
  [106.8364, -6.2145],
  [106.8456, -6.2088],
  [106.857, -6.2018],
  [106.868, -6.2113],
  [106.8791, -6.1987],
  [106.8902, -6.1924],
];

const START = 8 * 3600 + 24 * 60;
const END = 20 * 3600 + 41 * 60;
const COUNT = 1248;
const NOON = 12 * 3600 + 17 * 60 + 32;

function shiftFor(id: string) {
  if (id === "S-104" || id === "Alpha") return 0;
  const n = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return ((n % 7) - 3) * 0.0035;
}

function segmentLengths() {
  const lengths = WAYPOINTS.slice(1).map((point, index) => {
    const [lng, lat] = WAYPOINTS[index];
    return Math.hypot((point[0] - lng) * 111, (point[1] - lat) * 111);
  });
  const total = lengths.reduce((sum, length) => sum + length, 0);
  return { lengths, total };
}

function along(progress: number, shift: number): [number, number] {
  const { lengths, total } = segmentLengths();
  let remain = progress * total;
  for (let index = 0; index < lengths.length; index += 1) {
    if (remain <= lengths[index] || index === lengths.length - 1) {
      const span = lengths[index] || 1;
      const t = Math.min(1, remain / span);
      const [lng1, lat1] = WAYPOINTS[index];
      const [lng2, lat2] = WAYPOINTS[index + 1];
      return [lng1 + (lng2 - lng1) * t + shift, lat1 + (lat2 - lat1) * t - shift * 0.6];
    }
    remain -= lengths[index];
  }
  const last = WAYPOINTS[WAYPOINTS.length - 1];
  return [last[0] + shift, last[1] - shift * 0.6];
}

export function formatClock(seconds: number, withSeconds = true) {
  const safe = ((Math.round(seconds) % 86400) + 86400) % 86400;
  const hour = Math.floor(safe / 3600);
  const minute = Math.floor((safe % 3600) / 60);
  const second = safe % 60;
  const base = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return withSeconds ? `${base}:${String(second).padStart(2, "0")}` : base;
}

function kindFor(index: number): RecordKind {
  const slot = index % 48;
  if (slot === 1) return "Mesh Frame";
  if (slot === 2) return "Uplink";
  if (slot === 3) return "Beacon";
  if (slot === 4) return "Special";
  if (slot === 5) return "System";
  return "Telemetry";
}

function positionSource(index: number): TrackSource {
  if (index % 7 !== 0) return "GNSS";
  return TRACK_SOURCES[Math.floor(index / 7) % TRACK_SOURCES.length];
}

export function hasPayload(point: TrackPoint) {
  return point.kind === "Telemetry" || point.kind === "Mesh Frame";
}

export function buildTrack(id: string): TrackPoint[] {
  if (id === ALL_SOLDIERS) {
    return SOLDIERS.flatMap((soldier, offset) => (
      buildTrack(soldier.id).filter((point) => point.index % SOLDIERS.length === offset)
    )).sort((a, b) => a.seconds - b.seconds || a.soldierId.localeCompare(b.soldierId))
      .map((point, index) => ({ ...point, index }));
  }
  const shift = shiftFor(id);
  const points: TrackPoint[] = [];
  for (let index = 0; index < COUNT; index += 1) {
    const progress = index / (COUNT - 1);
    const seconds = Math.round(START + (END - START) * progress);
    const geo = progress < 0.317 ? (progress / 0.317) * 0.5 : 0.5 + ((progress - 0.317) / 0.683) * 0.5;
    const [lng, lat] = along(geo, shift);
    const kind = kindFor(index);
    const source = kind === "Telemetry" || kind === "Mesh Frame" ? positionSource(index) : null;
    points.push({
      index,
      soldierId: id,
      seconds,
      lng,
      lat,
      kind,
      source,
      hr: Math.round(86 + 10 * Math.sin(progress * 11) + 4 * Math.sin(progress * 27)),
      hrv: Math.round(34 + 10 * Math.sin(progress * 8)),
      spo2: 96 + (index % 4),
      temp: Math.round((36.4 + 0.5 * Math.sin(progress * 7) + 0.15 * Math.sin(progress * 19)) * 10) / 10,
      battery: Math.round(86 - progress * 28 + 2 * Math.sin(progress * 15)),
      strap: index % 240 !== 90,
      gateway: index % 5 === 0 ? "GW-02" : "GW-01",
      hop: 1 + (index % 3),
      rssi: -78 - (index % 24),
      snr: Math.round((4 + (index % 9) * 0.8) * 10) / 10,
      receivedLag: kind === "Uplink" ? 600 + (index % 180) : index % 17,
      seq: 200 + index,
      flags: index % 240 === 90 ? 0x04 : 0x20,
      event: kind === "System",
    });
  }
  if (id === "S-104") {
    const noon = noonIndex(points);
    points[noon] = {
      ...points[noon],
      seconds: NOON,
      lat: -6.2088,
      lng: 106.8456,
      hr: 82,
      hrv: 36,
      spo2: 98,
      temp: 36.7,
      battery: 78,
      strap: true,
      gateway: "GW-01",
      hop: 2,
      rssi: -91,
      snr: 7.2,
      receivedLag: (30 * 60 + 8) - (17 * 60 + 32),
      seq: 381,
      flags: 0x20,
      kind: "Telemetry",
      source: "GNSS",
      event: false,
    };
  }
  return points;
}

export function noonIndex(points: TrackPoint[]) {
  if (!points.length) return 0;
  return points.reduce((best, point, index) => (
    Math.abs(point.seconds - NOON) < Math.abs(points[best].seconds - NOON) ? index : best
  ), 0);
}

export function inRange(point: TrackPoint, range: "1h" | "6h" | "24h" | "7d" | "custom") {
  if (range === "24h" || range === "7d" || range === "custom") return true;
  const window = range === "1h" ? 3600 : 6 * 3600;
  return point.seconds >= END - window;
}

function kmBetween(a: TrackPoint, b: TrackPoint) {
  const lat = (b.lat - a.lat) * 110.574;
  const lng = (b.lng - a.lng) * 111.32 * Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180);
  return Math.hypot(lat, lng);
}

export function summarize(points: TrackPoint[]) {
  if (!points.length) return { distance: 0, hr: 0, battery: 0, count: 0 };
  const distance = points.slice(1).reduce((sum, point, index) => sum + kmBetween(points[index], point), 0);
  const avg = (pick: (point: TrackPoint) => number) => points.reduce((sum, point) => sum + pick(point), 0) / points.length;
  return {
    distance: Math.round(distance * 10) / 10,
    hr: Math.round(avg((point) => point.hr)),
    battery: Math.round(avg((point) => point.battery)),
    count: points.length,
  };
}

export function groupFor(id: string) {
  return SOLDIERS.find((item) => item.id === id)?.group ?? "Alpha 1-2";
}

export function membersOf(group: string) {
  return SOLDIERS.filter((item) => item.group.startsWith(group)).map((item) => item.id);
}

export function positionUncertainty(source: TrackSource) {
  if (source === "GNSS") return "±5–10 m";
  if (source === "Dead Reckoning") return "Estimated";
  if (source === "Trilateration / RSSI") return "Mesh estimate";
  return "Stale";
}

export function deliveryLabel(point: TrackPoint) {
  if (point.kind === "Uplink" || point.receivedLag >= 120) return "Delayed / Store-and-Carry";
  return "Live";
}

export function payloadHex(seq: number) {
  return Array.from({ length: 21 }, (_, index) => ((seq * 17 + index * 13) & 255).toString(16).padStart(2, "0")).join(" ").toUpperCase();
}
