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
  { id: "weapons", label: "Weapons", defaultOn: false, layers: ["weapons-status", "weapons-icons"] },
  { id: "vehicles", label: "Vehicles", defaultOn: true, layers: ["vehicles-halo", "vehicles-status", "vehicles-icons"] },
  { id: "gateways", label: "Gateways", defaultOn: true, layers: ["gateways-halo", "gateways-status", "gateways-icons"] },
  { id: "alerts", label: "Alerts", defaultOn: true, layers: ["alerts-ring"] },
  { id: "restricted", label: "Restricted Areas", defaultOn: true, layers: ["restricted-fill", "restricted-outline", "restricted-label"] },
  { id: "operation", label: "Operation Boundary", defaultOn: false, layers: ["operation-fill", "operation-outline"] },
  { id: "coverage", label: "Blue Zone", defaultOn: true, layers: ["coverage-fill", "coverage-outline"] },
  { id: "geofence", label: "Green Zone", defaultOn: true, layers: ["geofence-fill", "geofence-outline"] },
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

const statusColor = [
  "match",
  ["get", "status"],
  "online",
  "#00D99A",
  "warning",
  "#FFB020",
  "critical",
  "#FF3B4A",
  "offline",
  "#8B9AAF",
  "#8B9AAF",
] as const;

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
    layout: { visibility: "none" },
    paint: {
      "circle-radius": 11,
      "circle-color": [
        "match",
        ["get", "status"],
        "connected",
        "#22d3ee",
        "disconnected",
        "#FF3B4A",
        "low_battery",
        "#FFB020",
        "unassigned",
        "#8B9AAF",
        "#8B9AAF",
      ],
      "circle-stroke-color": "rgba(255,255,255,0.8)",
      "circle-stroke-width": 1.5,
    },
  });
  addLayerSafe(map, {
    id: "weapons-icons",
    type: "symbol",
    source: "weapons",
    layout: {
      visibility: "none",
      "icon-image": "weapon-icon",
      "icon-size": 0.38,
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

  // Personnel
  addLayerSafe(map, {
    id: "personnel-halo",
    type: "circle",
    source: "personnel",
    paint: {
      "circle-radius": [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        22,
        18,
      ],
      "circle-color": statusColor as unknown as string,
      "circle-opacity": 0.3,
      "circle-blur": 0.4,
    },
  });

  addLayerSafe(map, {
    id: "personnel-status",
    type: "circle",
    source: "personnel",
    paint: {
      "circle-radius": [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        16,
        14,
      ],
      "circle-color": statusColor as unknown as string,
      "circle-stroke-color": "rgba(255,255,255,0.9)",
      "circle-stroke-width": 2.2,
    },
  });

  addLayerSafe(map, {
    id: "personnel-icons",
    type: "symbol",
    source: "personnel",
    layout: {
      "icon-image": "personnel-bell",
      "icon-size": 0.4,
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
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
