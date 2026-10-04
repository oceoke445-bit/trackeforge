export type GeofenceType = "restricted" | "silent" | "safe";
export type GeofenceStatus = "active" | "inactive";
export type GeofenceShape = "polygon" | "circle";

export type GeofenceZone = {
  id: string;
  name: string;
  type: GeofenceType;
  status: GeofenceStatus;
  groups: string[];
  areaKm2: number;
  triggered24h: number;
  lastTriggered: string | null;
  description: string;
  shape: GeofenceShape;
  polygon?: [number, number][];
  center?: [number, number];
  radiusKm?: number;
  color: string;
};

export const GEOFENCE_TYPES: GeofenceType[] = ["restricted", "silent", "safe"];
export const GROUPS = ["Alpha", "Bravo", "Charlie", "Delta", "Echo"] as const;

export const TYPE_META: Record<
  GeofenceType,
  { label: string; color: string; hint: string }
> = {
  restricted: {
    label: "Restricted",
    color: "#ef4444",
    hint: "Trigger alert when unit enters",
  },
  silent: {
    label: "Silent",
    color: "#f59e0b",
    hint: "Monitor only (no alert, EMCON)",
  },
  safe: {
    label: "Safe Zone",
    color: "#22c55e",
    hint: "Designated safe area",
  },
};

function circlePolygon(center: [number, number], radiusKm: number, steps = 64): [number, number][] {
  const [lng, lat] = center;
  const latRad = (lat * Math.PI) / 180;
  const dLat = radiusKm / 111.32;
  const dLng = radiusKm / (111.32 * Math.cos(latRad));
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    ring.push([lng + Math.cos(a) * dLng, lat + Math.sin(a) * dLat]);
  }
  return ring;
}

export function zoneRing(zone: GeofenceZone): [number, number][] {
  if (zone.shape === "circle" && zone.center && zone.radiusKm != null) {
    return circlePolygon(zone.center, zone.radiusKm);
  }
  return zone.polygon ?? [];
}

export function zoneCenter(zone: GeofenceZone): [number, number] {
  if (zone.center) return zone.center;
  const pts = zoneRing(zone).slice(0, -1);
  if (!pts.length) return [106.83, -6.245];
  const lng = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
  const lat = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
  return [lng, lat];
}

/** Demo set aligned to the Geofences mock (12 zones, 8 active, 3 inactive + 1 standby counted in total). */
export const GEOFENCES: GeofenceZone[] = [
  {
    id: "gf-01",
    name: "Restricted Area Alpha",
    type: "restricted",
    status: "active",
    groups: ["Alpha"],
    areaKm2: 12.5,
    triggered24h: 3,
    lastTriggered: "2026-10-03 21:14:22",
    description: "No entry zone. Enemy territory.",
    shape: "polygon",
    color: "#ef4444",
    polygon: [
      [113.8, -1.2],
      [117.2, -0.9],
      [117.6, -3.6],
      [114.0, -4.0],
      [113.8, -1.2],
    ],
  },
  {
    id: "gf-02",
    name: "Safe Zone Bravo",
    type: "safe",
    status: "active",
    groups: ["Bravo"],
    areaKm2: 8.2,
    triggered24h: 0,
    lastTriggered: null,
    description: "Friendly base area.",
    shape: "circle",
    color: "#22c55e",
    center: [106.845, -6.215],
    radiusKm: 55,
  },
  {
    id: "gf-03",
    name: "Silent Zone Charlie",
    type: "silent",
    status: "active",
    groups: ["Charlie"],
    areaKm2: 25.1,
    triggered24h: 0,
    lastTriggered: null,
    description: "Recon area (EMCON).",
    shape: "circle",
    color: "#f59e0b",
    center: [122.5, -7.8],
    radiusKm: 90,
  },
  {
    id: "gf-04",
    name: "Restricted Area Delta",
    type: "restricted",
    status: "inactive",
    groups: ["Delta"],
    areaKm2: 18.7,
    triggered24h: 1,
    lastTriggered: "2026-10-02 14:33:10",
    description: "Artillery range.",
    shape: "polygon",
    color: "#ef4444",
    polygon: [
      [128.5, -3.2],
      [131.8, -2.8],
      [132.2, -5.4],
      [128.8, -5.8],
      [128.5, -3.2],
    ],
  },
  {
    id: "gf-05",
    name: "Safe Zone Echo",
    type: "safe",
    status: "active",
    groups: ["Echo"],
    areaKm2: 6.4,
    triggered24h: 0,
    lastTriggered: null,
    description: "Evacuation point.",
    shape: "circle",
    color: "#22c55e",
    center: [110.4, -7.0],
    radiusKm: 40,
  },
  {
    id: "gf-06",
    name: "Silent Zone North",
    type: "silent",
    status: "inactive",
    groups: ["Alpha", "Bravo"],
    areaKm2: 22.1,
    triggered24h: 0,
    lastTriggered: "2026-09-28 09:12:44",
    description: "Northern EMCON lane — currently suspended.",
    shape: "circle",
    color: "#f59e0b",
    center: [108.2, -2.8],
    radiusKm: 70,
  },
  {
    id: "gf-07",
    name: "Patrol Box Foxtrot",
    type: "restricted",
    status: "active",
    groups: ["Charlie", "Delta"],
    areaKm2: 9.8,
    triggered24h: 0,
    lastTriggered: "2026-10-01 20:01:18",
    description: "High-risk ridge corridor.",
    shape: "polygon",
    color: "#3b82f6",
    polygon: [
      [118.8, -4.6],
      [121.4, -4.3],
      [121.7, -6.2],
      [119.0, -6.5],
      [118.8, -4.6],
    ],
  },
  {
    id: "gf-08",
    name: "Safe Zone HQ",
    type: "safe",
    status: "active",
    groups: ["Alpha"],
    areaKm2: 3.1,
    triggered24h: 0,
    lastTriggered: null,
    description: "Command post perimeter.",
    shape: "circle",
    color: "#22c55e",
    center: [106.75, -6.12],
    radiusKm: 22,
  },
  {
    id: "gf-09",
    name: "Silent Zone East",
    type: "silent",
    status: "active",
    groups: ["Echo"],
    areaKm2: 11.6,
    triggered24h: 0,
    lastTriggered: "2026-10-03 16:20:33",
    description: "Eastern approach — radio silence preferred.",
    shape: "circle",
    color: "#f59e0b",
    center: [115.2, -8.6],
    radiusKm: 55,
  },
  {
    id: "gf-10",
    name: "Restricted Area Golf",
    type: "restricted",
    status: "active",
    groups: ["Bravo"],
    areaKm2: 7.3,
    triggered24h: 0,
    lastTriggered: "2026-10-01 11:05:00",
    description: "River crossing denial zone.",
    shape: "polygon",
    color: "#ef4444",
    polygon: [
      [104.6, -2.8],
      [106.2, -2.5],
      [106.5, -4.0],
      [104.8, -4.3],
      [104.6, -2.8],
    ],
  },
  {
    id: "gf-11",
    name: "Safe Zone Lima",
    type: "safe",
    status: "inactive",
    groups: ["Delta"],
    areaKm2: 4.6,
    triggered24h: 0,
    lastTriggered: null,
    description: "Alternate rally point — standby.",
    shape: "circle",
    color: "#22c55e",
    center: [119.4, -1.8],
    radiusKm: 35,
  },
  {
    id: "gf-12",
    name: "AO Boundary Hotel",
    type: "safe",
    status: "active",
    groups: ["Charlie"],
    areaKm2: 14.2,
    triggered24h: 0,
    lastTriggered: null,
    description: "Southern operating area boundary.",
    shape: "polygon",
    color: "#3b82f6",
    polygon: [
      [109.2, -7.6],
      [112.0, -7.3],
      [112.4, -9.4],
      [109.5, -9.7],
      [109.2, -7.6],
    ],
  },
];

export type MapUnit = {
  id: string;
  lng: number;
  lat: number;
  online: boolean;
  alert?: boolean;
};

export const MAP_UNITS: MapUnit[] = [
  { id: "U-01", lng: 106.82, lat: -6.2, online: true },
  { id: "U-02", lng: 106.95, lat: -6.35, online: true },
  { id: "U-03", lng: 110.35, lat: -7.05, online: false },
  { id: "U-04", lng: 122.4, lat: -7.9, online: true, alert: true },
  { id: "U-05", lng: 115.1, lat: -8.55, online: true },
  { id: "U-06", lng: 119.9, lat: -5.2, online: false },
  { id: "U-07", lng: 115.5, lat: -2.4, online: true, alert: true },
  { id: "U-08", lng: 130.2, lat: -4.4, online: true },
];

export function toZonesGeoJSON(zones: GeofenceZone[], selectedId?: string): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: zones.map((zone) => {
      const activeColor = zone.type === "restricted" ? "#ef4444" : zone.type === "silent" ? "#f59e0b" : zone.type === "safe" ? "#22c55e" : zone.color;
      return {
        type: "Feature" as const,
        properties: {
          id: zone.id,
          label: zone.name,
          type: zone.type,
          color: zone.status === "active" ? activeColor : "#94a3b8",
          selected: zone.id === selectedId ? 1 : 0,
          status: zone.status,
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [zoneRing(zone)],
        },
      };
    }),
  };
}

export function geofenceStats() {
  return {
    total: 12,
    active: 8,
    inactive: 3,
    triggeredToday: 4,
    activePct: "66.7",
    inactivePct: "25.0",
  };
}
