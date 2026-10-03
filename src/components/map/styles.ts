import type { StyleSpecification } from "maplibre-gl";

export type MapMode = "terrain" | "satellite" | "dark";

/** Free DEM (Terrarium encoding) — no API key. */
export const TERRAIN_DEM = {
  type: "raster-dem" as const,
  tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
  encoding: "terrarium" as const,
  tileSize: 256,
  maxzoom: 15,
  attribution: "Elevation © Mapzen / AWS",
};

/** Free satellite imagery — Esri World Imagery. */
export const SATELLITE_RASTER = {
  type: "raster" as const,
  tiles: [
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  ],
  tileSize: 256,
  maxzoom: 19,
  attribution: "Tiles © Esri",
};

/** Place labels overlay on imagery. */
export const LABELS_RASTER = {
  type: "raster" as const,
  tiles: [
    "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  ],
  tileSize: 256,
  maxzoom: 19,
  attribution: "Labels © Esri",
};

const DARK_VECTOR = "https://tiles.openfreemap.org/styles/dark";

export function buildBaseStyle(mode: MapMode): string | StyleSpecification {
  if (mode === "dark") return DARK_VECTOR;

  return {
    version: 8,
    name: mode === "terrain" ? "Traxon Terrain" : "Traxon Satellite",
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      satellite: SATELLITE_RASTER,
      terrain: TERRAIN_DEM,
      labels: LABELS_RASTER,
    },
    layers: [
      {
        id: "satellite",
        type: "raster",
        source: "satellite",
        paint: {
          "raster-opacity": 1,
          "raster-saturation": mode === "terrain" ? -0.28 : -0.12,
          "raster-contrast": mode === "terrain" ? 0.14 : 0.08,
          "raster-brightness-min": mode === "terrain" ? 0.08 : 0.02,
          "raster-brightness-max": mode === "terrain" ? 0.78 : 0.9,
        },
      },
      {
        id: "terrain-hillshade",
        type: "hillshade",
        source: "terrain",
        paint: {
          "hillshade-exaggeration": mode === "terrain" ? 0.62 : 0.28,
          "hillshade-shadow-color": "#07110F",
          "hillshade-highlight-color": "#789083",
          "hillshade-accent-color": "#3d5248",
        },
      },
      {
        id: "labels",
        type: "raster",
        source: "labels",
        paint: { "raster-opacity": mode === "terrain" ? 0.55 : 0.7 },
      },
    ],
  };
}

export const MAP_CAMERA = {
  center: [106.825, -6.248] as [number, number],
  zoom: 12.1,
  pitch: 28,
  bearing: -6,
  maxPitch: 70,
};

export const TERRAIN_STATE = {
  source: "terrain",
  exaggeration: 0.7,
};
