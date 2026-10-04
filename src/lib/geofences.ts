import type { GeofenceStatus, GeofenceZone } from "@/app/(platform)/groups/components/geofence-data";

export const GEOFENCE_CHANGED = "traxon-geofences-changed";

type ApiGeofence = {
  id: number;
  name: string;
  description: string;
  status: GeofenceStatus;
  groups: string[];
  polygon: [number, number][];
  area_km2: number;
  triggered_24h: number;
  last_triggered: string | null;
};

export type GeofenceDraft = {
  name: string;
  description: string;
  status: GeofenceStatus;
  groups: string[];
  polygon: [number, number][];
};

function closedRing(points: [number, number][]): [number, number][] {
  if (points.length < 3) return points;
  const first = points[0];
  const last = points[points.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return points;
  return [...points, first];
}

export function toGeofenceZone(item: ApiGeofence): GeofenceZone {
  return {
    id: String(item.id),
    name: item.name,
    type: "silent",
    status: item.status,
    groups: item.groups,
    areaKm2: item.area_km2,
    triggered24h: item.triggered_24h,
    lastTriggered: item.last_triggered,
    description: item.description,
    shape: "polygon",
    color: item.status === "active" ? "#f59e0b" : "#94a3b8",
    polygon: closedRing(item.polygon),
  };
}

export function polygonAreaKm2(points: [number, number][]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const [lng, lat] = points[index];
    const [nextLng, nextLat] = points[(index + 1) % points.length];
    area += lng * nextLat - nextLng * lat;
  }
  const meanLat = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  const kmLat = 111.32;
  const kmLng = 111.32 * Math.cos((meanLat * Math.PI) / 180);
  return Math.round((Math.abs(area) / 2) * kmLat * kmLng * 10) / 10;
}

export function notifyGeofencesChanged() {
  window.dispatchEvent(new Event(GEOFENCE_CHANGED));
}

export async function fetchGeofences(): Promise<GeofenceZone[]> {
  const response = await fetch("/api/geofences", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load geofences");
  const body = (await response.json()) as { items: ApiGeofence[] };
  return body.items.map(toGeofenceZone);
}

export async function createGeofence(draft: GeofenceDraft): Promise<GeofenceZone> {
  const response = await fetch("/api/geofences", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: draft.name,
      description: draft.description,
      status: draft.status,
      groups: draft.groups,
      polygon: draft.polygon.slice(0, 3),
    }),
  });
  if (!response.ok) throw new Error("Could not save geofence");
  return toGeofenceZone((await response.json()) as ApiGeofence);
}

export async function deleteGeofence(id: string): Promise<void> {
  const response = await fetch(`/api/geofences/${id}`, { method: "DELETE" });
  if (!response.ok && response.status !== 204) throw new Error("Could not delete geofence");
}
