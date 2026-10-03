import type { FilterSpecification, GeoJSONSource, Map } from "maplibre-gl";
import {
  alertsGeoJSON,
  coverageGeoJSON,
  gatewaysGeoJSON,
  geofenceGeoJSON,
  operationBoundaryGeoJSON,
  personnelGeoJSON,
  personnelTrackGeoJSON,
  restrictedAreaGeoJSON,
  squadTrackGeoJSON,
  vehiclesGeoJSON,
  weaponsGeoJSON,
} from "./geojson";
import { TERRAIN_DEM } from "./styles";

export type LayerGroupId =
  | "personnel"
  | "weapons"
  | "vehicles"
  | "gateways"
  | "alerts"
  | "restricted"
  | "operation"
  | "coverage"
  | "geofence"
  | "tracks"
  | "terrain";

export const LAYER_GROUPS: { id: LayerGroupId; label: string; defaultOn: boolean; layers: string[] }[] = [
  { id: "personnel", label: "Personnel", defaultOn: true, layers: ["personnel-halo", "personnel-status", "personnel-icons"] },
  { id: "weapons", label: "Weapons", defaultOn: true, layers: ["weapons-status", "weapons-icons"] },
  { id: "vehicles", label: "Vehicles", defaultOn: false, layers: ["vehicles-halo", "vehicles-status", "vehicles-icons"] },
  { id: "gateways", label: "Gateways", defaultOn: true, layers: ["gateways-halo", "gateways-status", "gateways-icons"] },
  { id: "alerts", label: "Alerts", defaultOn: false, layers: ["alerts-ring"] },
  { id: "restricted", label: "Restricted Areas", defaultOn: false, layers: ["restricted-fill", "restricted-outline", "restricted-label"] },
  { id: "operation", label: "Operation Boundary", defaultOn: false, layers: ["operation-fill", "operation-outline"] },
  { id: "coverage", label: "Blue Zone", defaultOn: false, layers: ["coverage-fill", "coverage-outline"] },
  { id: "geofence", label: "Green Zone", defaultOn: false, layers: ["geofence-fill", "geofence-outline"] },
  { id: "tracks", label: "Personnel Tracks", defaultOn: false, layers: ["personnel-track", "squad-track"] },
  { id: "terrain", label: "Terrain / Hillshade", defaultOn: true, layers: ["terrain-hillshade"] },
];

export const INTERACTIVE_LAYERS = [
  "personnel-status",
  "personnel-icons",
  "weapons-status",
  "vehicles-status",
  "vehicles-icons",
  "gateways-status",
  "gateways-icons",
];

function upsertSource(
  map: Map,
  id: string,
  data: GeoJSON.FeatureCollection,
  options?: { promoteId?: string },
) {
  const existing = map.getSource(id) as GeoJSONSource | undefined;
  if (existing) {
    existing.setData(data);
    return;
  }
  map.addSource(id, {
    type: "geojson",
    data,
    promoteId: options?.promoteId,
  });
}

function addLayerSafe(map: Map, layer: Parameters<Map["addLayer"]>[0]) {
  if (!map.getLayer(layer.id as string)) map.addLayer(layer);
}

export function ensureTerrainSource(map: Map) {
  if (!map.getSource("terrain")) {
    map.addSource("terrain", TERRAIN_DEM);
  }
  if (!map.getLayer("terrain-hillshade")) {
    const beforeId = map.getLayer("labels") ? "labels" : undefined;
    map.addLayer(
      {
        id: "terrain-hillshade",
        type: "hillshade",
        source: "terrain",
        paint: {
          "hillshade-exaggeration": 0.5,
          "hillshade-shadow-color": "#07110F",
          "hillshade-highlight-color": "#789083",
          "hillshade-accent-color": "#3d5248",
        },
      },
      beforeId,
    );
  }
}

export function addOperationalLayers(map: Map) {
  upsertSource(map, "operation-boundary", operationBoundaryGeoJSON);
  upsertSource(map, "restricted-areas", restrictedAreaGeoJSON);
  upsertSource(map, "coverage", coverageGeoJSON);
  upsertSource(map, "geofence", geofenceGeoJSON);
  upsertSource(map, "personnel", personnelGeoJSON, { promoteId: "id" });
  upsertSource(map, "weapons", weaponsGeoJSON);
  upsertSource(map, "vehicles", vehiclesGeoJSON);
  upsertSource(map, "gateways", gatewaysGeoJSON);
  upsertSource(map, "alerts", alertsGeoJSON);
  upsertSource(map, "personnel-tracks", personnelTrackGeoJSON);
  upsertSource(map, "squad-tracks", squadTrackGeoJSON);

  addLayerSafe(map, {
    id: "operation-fill",
    type: "fill",
    source: "operation-boundary",
    layout: { visibility: "none" },
    paint: { "fill-color": "#00D99A", "fill-opacity": 0.05 },
  });
  addLayerSafe(map, {
    id: "operation-outline",
    type: "line",
    source: "operation-boundary",
    layout: { visibility: "none" },
    paint: { "line-color": "#00D99A", "line-width": 1.2, "line-opacity": 0.45, "line-dasharray": [2, 1.4] },
  });

  addLayerSafe(map, {
    id: "coverage-fill",
    type: "fill",
    source: "coverage",
    paint: { "fill-color": "#3B82F6", "fill-opacity": 0.14 },
  });
  addLayerSafe(map, {
    id: "coverage-outline",
    type: "line",
    source: "coverage",
    paint: { "line-color": "#60A5FA", "line-width": 2, "line-opacity": 0.85 },
  });

  addLayerSafe(map, {
    id: "geofence-fill",
    type: "fill",
    source: "geofence",
    paint: { "fill-color": "#00D99A", "fill-opacity": 0.14 },
  });
  addLayerSafe(map, {
    id: "geofence-outline",
    type: "line",
    source: "geofence",
    paint: { "line-color": "#34D399", "line-width": 2, "line-opacity": 0.9 },
  });

  addLayerSafe(map, {
    id: "restricted-fill",
    type: "fill",
    source: "restricted-areas",
    paint: { "fill-color": "#FF3B30", "fill-opacity": 0.2 },
  });
  addLayerSafe(map, {
    id: "restricted-outline",
    type: "line",
    source: "restricted-areas",
    paint: {
      "line-color": "#FF3B30",
      "line-width": 2.5,
      "line-opacity": 0.95,
      "line-dasharray": [2.2, 1.4],
    },
  });
  addLayerSafe(map, {
    id: "restricted-label",
    type: "symbol",
    source: "restricted-areas",
    layout: {
      "text-field": ["get", "label"],
      "text-size": 12,
      "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
      "text-anchor": "center",
      "text-allow-overlap": true,
    },
    paint: {
      "text-color": "#ffffff",
      "text-halo-color": "#B91C1C",
      "text-halo-width": 2.4,
      "text-halo-blur": 0.4,
    },
  });

  addLayerSafe(map, {
    id: "personnel-track",
    type: "line",
    source: "personnel-tracks",
    layout: { visibility: "none" },
    paint: { "line-color": "#00D9FF", "line-width": 3, "line-opacity": 0.75 },
  });
  addLayerSafe(map, {
    id: "squad-track",
    type: "line",
    source: "squad-tracks",
    layout: { visibility: "none" },
    paint: { "line-color": "#60a5fa", "line-width": 2.5, "line-opacity": 0.55, "line-dasharray": [1.5, 1.2] },
  });

  // Gateways
  addLayerSafe(map, {
    id: "gateways-halo",
    type: "circle",
    source: "gateways",
    paint: {
      "circle-radius": 16,
      "circle-color": "#3B82F6",
      "circle-opacity": 0.28,
      "circle-blur": 0.35,
    },
  });
  addLayerSafe(map, {
    id: "gateways-status",
    type: "circle",
    source: "gateways",
    paint: {
      "circle-radius": 14,
      "circle-color": "#3B82F6",
      "circle-stroke-color": "rgba(255,255,255,0.85)",
      "circle-stroke-width": 2,
    },
  });
  addLayerSafe(map, {
    id: "gateways-icons",
    type: "symbol",
    source: "gateways",
    layout: {
      "icon-image": "gateway-tower",
      "icon-size": 0.42,
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });

  // Vehicles
  addLayerSafe(map, {
    id: "vehicles-halo",
    type: "circle",
    source: "vehicles",
    paint: {
      "circle-radius": 16,
      "circle-color": ["match", ["get", "status"], "online", "#3B82F6", "idle", "#FFB020", "#8B9AAF"],
      "circle-opacity": 0.28,
      "circle-blur": 0.35,
    },
  });
  addLayerSafe(map, {
    id: "vehicles-status",
    type: "circle",
    source: "vehicles",
    paint: {
      "circle-radius": 14,
      "circle-color": ["match", ["get", "status"], "online", "#3B82F6", "idle", "#FFB020", "#8B9AAF"],
      "circle-stroke-color": "rgba(255,255,255,0.85)",
      "circle-stroke-width": 2,
    },
  });
  addLayerSafe(map, {
    id: "vehicles-icons",
    type: "symbol",
    source: "vehicles",
    layout: {
      "icon-image": "vehicle-car",
      "icon-size": 0.42,
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });

  // Weapons (optional)
  addLayerSafe(map, {
    id: "weapons-status",
    type: "circle",
    source: "weapons",
    paint: {
      "circle-radius": 16,
      "circle-color": "#000000",
      "circle-opacity": 0,
    },
  });
  addLayerSafe(map, {
    id: "weapons-icons",
    type: "symbol",
    source: "weapons",
    layout: {
      "icon-image": [
        "match",
        ["get", "status"],
        "connected",
        "weapon-mark-connected",
        "disconnected",
        "weapon-mark-disconnected",
        "low_battery",
        "weapon-mark-low-battery",
        "low-battery",
        "weapon-mark-low-battery",
        "unassigned",
        "weapon-mark-unassigned",
        "maintenance",
        "weapon-mark-maintenance",
        "weapon-mark-connected",
      ],
      "icon-size": 0.58,
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });

  addLayerSafe(map, {
    id: "alerts-ring",
    type: "circle",
    source: "alerts",
    paint: {
      "circle-radius": ["case", ["==", ["get", "level"], "critical"], 26, 22],
      "circle-color": ["case", ["==", ["get", "level"], "critical"], "#FF3B4A", "#FFB020"],
      "circle-opacity": 0.2,
      "circle-blur": 0.2,
    },
  });

  // Personnel — circular status disc + id label. Circles stay for hit-testing only.
  addLayerSafe(map, {
    id: "personnel-halo",
    type: "circle",
    source: "personnel",
    paint: {
      "circle-radius": 10,
      "circle-color": "#000000",
      "circle-opacity": 0,
    },
  });

  addLayerSafe(map, {
    id: "personnel-status",
    type: "circle",
    source: "personnel",
    paint: {
      "circle-radius": 18,
      "circle-color": "#000000",
      "circle-opacity": 0,
    },
  });

  addLayerSafe(map, {
    id: "personnel-icons",
    type: "symbol",
    source: "personnel",
    layout: {
      "icon-image": [
        "case",
        ["==", ["get", "role"], "danru"],
        "personnel-pin-leader",
        [
          "match",
          ["get", "status"],
          "online",
          "personnel-pin-online",
          "warning",
          "personnel-pin-warning",
          "critical",
          "personnel-pin-critical",
          "offline",
          "personnel-pin-offline",
          "personnel-pin-offline",
        ],
      ],
      "icon-size": 0.01,
      "icon-anchor": "center",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
    paint: {
      // Overview uses HTML mesh-style markers; keep this layer for hit-testing only.
      "icon-opacity": 0,
    },
  });
}

export function setGroupVisibility(map: Map, groupId: LayerGroupId, visible: boolean) {
  const group = LAYER_GROUPS.find((item) => item.id === groupId);
  if (!group) return;
  const value = visible ? "visible" : "none";
  for (const layerId of group.layers) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", value);
    }
  }
  if (groupId === "terrain") {
    if (visible && map.getSource("terrain")) {
      map.setTerrain({ source: "terrain", exaggeration: 0.65 });
    } else {
      map.setTerrain(null);
    }
  }
}

export function setPersonnelStatusFilter(map: Map, status: "all" | string) {
  const filter: FilterSpecification | null =
    status === "all" ? null : ["==", ["get", "status"], status];
  for (const layerId of ["personnel-halo", "personnel-status", "personnel-icons"]) {
    if (map.getLayer(layerId)) map.setFilter(layerId, filter);
  }
}
