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

export const GEOFENCE_TYPES: GeofenceType[] = ["silent"];
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
    label: "Silent Zone",
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

export const GEOFENCES: GeofenceZone[] = [
  {
    id: "gf-01",
    name: "Silent Zone Alpha",
    type: "silent",
    status: "active",
    groups: ["Alpha"],
    areaKm2: 8.2,
    triggered24h: 0,
    lastTriggered: null,
    description: "Monitor only. No alert.",
    shape: "polygon",
    color: "#f59e0b",
    polygon: [
      [116.6, -3.4],
      [120.2, -3.6],
      [118.2, -6.4],
      [116.6, -3.4],
    ],
  },
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
  const total = GEOFENCES.length;
  const active = GEOFENCES.filter((zone) => zone.status === "active").length;
  const inactive = GEOFENCES.filter((zone) => zone.status === "inactive").length;
  const triggeredToday = GEOFENCES.filter((zone) => zone.triggered24h > 0).length;
  const pct = (count: number) => (total ? ((count / total) * 100).toFixed(1) : "0");
  return {
    total,
    active,
    inactive,
    triggeredToday,
    activePct: pct(active),
    inactivePct: pct(inactive),
  };
}
