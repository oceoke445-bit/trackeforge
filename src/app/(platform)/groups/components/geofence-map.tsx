"use client";

import { useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  setWorkerUrl,
  type GeoJSONSource,
  type Map,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, FeatureCollection } from "geojson";
import Icon from "@/components/ui/icon";
import { buildBaseStyle, type MapMode } from "@/components/map/styles";
import {
  toZonesGeoJSON,
  zoneCenter,
  type GeofenceZone,
} from "./geofence-data";

let workerReady = false;
function ensureMapWorker() {
  if (workerReady || typeof window === "undefined") return;
  setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
  workerReady = true;
}

function hydrate(map: Map, zones: GeofenceZone[], selectedId: string) {
  const data = toZonesGeoJSON(zones, selectedId);
  const source = map.getSource("gfn-zones") as GeoJSONSource | undefined;
  if (source) source.setData(data);
  else map.addSource("gfn-zones", { type: "geojson", data });

  if (!map.getLayer("gfn-fill")) {
    map.addLayer({
      id: "gfn-fill",
      type: "fill",
      source: "gfn-zones",
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": [
          "case",
          ["==", ["get", "selected"], 1],
          0.3,
          ["==", ["get", "status"], "inactive"],
          0.07,
          0.18,
        ],
      },
    });
    map.addLayer({
      id: "gfn-line",
      type: "line",
      source: "gfn-zones",
      paint: {
        "line-color": ["get", "color"],
        "line-width": ["case", ["==", ["get", "selected"], 1], 3.2, 2.2],
        "line-dasharray": [2.4, 1.8],
      },
    });
    map.addLayer({
      id: "gfn-label",
      type: "symbol",
      source: "gfn-zones",
      layout: {
        "text-field": ["get", "label"],
        "text-size": 12,
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
      },
      paint: {
        "text-color": "#f8fafc",
        "text-halo-color": "rgba(2, 6, 23, 0.75)",
        "text-halo-width": 1.2,
      },
    });
  }
}

function paintDraft(map: Map, points: [number, number][], color: string) {
  const ring = points.length === 3 ? [...points, points[0]] : points;
  const features: Feature[] = points.map((point) => ({
    type: "Feature",
    properties: {},
    geometry: { type: "Point", coordinates: point },
  }));
  if (points.length >= 2) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: ring },
    });
  }
  if (points.length === 3) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [ring] },
    });
  }
  const data: FeatureCollection = { type: "FeatureCollection", features };
  const source = map.getSource("gfn-draft") as GeoJSONSource | undefined;
  if (source) source.setData(data);
  else map.addSource("gfn-draft", { type: "geojson", data });

  if (map.getLayer("gfn-draft-vertex")) map.removeLayer("gfn-draft-vertex");

  if (!map.getLayer("gfn-draft-fill")) {
    map.addLayer({
      id: "gfn-draft-fill",
      type: "fill",
      source: "gfn-draft",
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: { "fill-color": color, "fill-opacity": 0.28 },
    });
    map.addLayer({
      id: "gfn-draft-line",
      type: "line",
      source: "gfn-draft",
      filter: ["==", ["geometry-type"], "LineString"],
      paint: { "line-color": color, "line-width": 2.6 },
    });
  } else {
    map.setPaintProperty("gfn-draft-fill", "fill-color", color);
    map.setPaintProperty("gfn-draft-line", "line-color", color);
  }
}

export default function GeofenceMap({
  zones,
  selectedId,
  onSelect,
  drawing = false,
  draftPoints = [],
  draftColor = "#ef4444",
  onDraftPoint,
}: {
  zones: GeofenceZone[];
  selectedId: string;
  onSelect: (id: string) => void;
  drawing?: boolean;
  draftPoints?: [number, number][];
  draftColor?: string;
  onDraftPoint?: (point: [number, number]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [mode, setMode] = useState<MapMode>("satellite");
  const [placing, setPlacing] = useState(false);
  const zonesRef = useRef(zones);
  const selectedRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  const drawingRef = useRef(drawing);
  const placingRef = useRef(placing);
  const draftPointsRef = useRef(draftPoints);
  const draftColorRef = useRef(draftColor);
  const onDraftPointRef = useRef(onDraftPoint);
  zonesRef.current = zones;
  selectedRef.current = selectedId;
  onSelectRef.current = onSelect;
  drawingRef.current = drawing;
  placingRef.current = placing;
  draftPointsRef.current = draftPoints;
  draftColorRef.current = draftColor;
  onDraftPointRef.current = onDraftPoint;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    ensureMapWorker();

    const map = new MapLibreMap({
      container: containerRef.current,
      style: buildBaseStyle("satellite"),
      center: [118.2, -4.8],
      zoom: 4.55,
      pitch: 0,
      attributionControl: false,
    });
    mapRef.current = map;

    map.on("load", () => {
      hydrate(map, zonesRef.current, selectedRef.current);
      paintDraft(map, draftPointsRef.current, draftColorRef.current);
    });

    const click = (event: MapLayerMouseEvent) => {
      if (drawingRef.current) return;
      const id = event.features?.[0]?.properties?.id as string | undefined;
      if (id) onSelectRef.current(id);
    };
    const placeCorner = (event: MapLayerMouseEvent) => {
      if (!drawingRef.current || !placingRef.current || draftPointsRef.current.length >= 3) return;
      onDraftPointRef.current?.([event.lngLat.lng, event.lngLat.lat]);
    };
    map.on("click", "gfn-fill", click);
    map.on("click", placeCorner);
    map.on("mouseenter", "gfn-fill", () => {
      map.getCanvas().style.cursor = placingRef.current ? "crosshair" : "pointer";
    });
    map.on("mouseleave", "gfn-fill", () => {
      map.getCanvas().style.cursor = placingRef.current ? "crosshair" : "";
    });

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.off("click", "gfn-fill", click);
      map.off("click", placeCorner);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    hydrate(map, zones, selectedId);
  }, [zones, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(buildBaseStyle(mode));
    map.once("style.load", () => {
      hydrate(map, zonesRef.current, selectedRef.current);
      paintDraft(map, draftPointsRef.current, draftColorRef.current);
    });
  }, [mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const paint = () => {
      if (!map.isStyleLoaded()) return;
      paintDraft(map, draftPoints, draftColor);
      map.getCanvas().style.cursor = placing ? "crosshair" : "";
    };
    if (map.isStyleLoaded()) paint();
    else map.once("idle", paint);
  }, [draftColor, draftPoints, placing]);

  useEffect(() => {
    if (!drawing || draftPoints.length >= 3) setPlacing(false);
  }, [drawing, draftPoints.length]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const action = placing ? "disable" : "enable";
    map.dragPan[action]();
    map.dragRotate[action]();
    map.doubleClickZoom[action]();
    map.touchZoomRotate[action]();
    map.keyboard[action]();
    map.getCanvas().style.cursor = placing ? "crosshair" : "";
  }, [placing]);

  return (
    <div className="gfn-map">
      <div ref={containerRef} className="maplibre-root" />
      {drawing ? (
        <p className="gfn-draw-hint">
          {draftPoints.length >= 3
            ? "Triangle placed. The map can move again."
            : placing
              ? `Map locked. Click corner ${draftPoints.length + 1} of 3`
              : "Press Draw to lock the map, then place 3 corners."}
        </p>
      ) : null}
      <div className="gfn-map-tools">
        {drawing ? (
          <button
            type="button"
            className={placing ? "on" : ""}
            aria-pressed={placing}
            aria-label={placing ? "Finish drawing" : "Draw triangle"}
            disabled={draftPoints.length >= 3}
            onClick={() => setPlacing((on) => !on)}
          >
            <Icon name="pencil" size={14} />
          </button>
        ) : null}
        <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn({ duration: 180 })}>
          +
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut({ duration: 180 })}>
          −
        </button>
        <button
          type="button"
          aria-label="Recenter"
          onClick={() => mapRef.current?.easeTo({ center: [118.2, -4.8], zoom: 4.55, duration: 400 })}
        >
          <Icon name="crosshair" size={14} />
        </button>
        <button
          type="button"
          aria-label="Layers"
          onClick={() => setMode((m) => (m === "satellite" ? "dark" : m === "dark" ? "terrain" : "satellite"))}
        >
          <Icon name="layers" size={14} />
        </button>
        <button
          type="button"
          aria-label="Fit zones"
          onClick={() => {
            const map = mapRef.current;
            if (!map || !zones.length) return;
            const lngs = zones.flatMap((z) => z.polygon?.map((p) => p[0]) ?? [zoneCenter(z)[0]]);
            const lats = zones.flatMap((z) => z.polygon?.map((p) => p[1]) ?? [zoneCenter(z)[1]]);
            map.fitBounds(
              [
                [Math.min(...lngs) - 1, Math.min(...lats) - 1],
                [Math.max(...lngs) + 1, Math.max(...lats) + 1],
              ],
              { padding: 40, duration: 450 },
            );
          }}
        >
          <Icon name="compass" size={14} />
        </button>
      </div>
      <div className="gfn-legend">
        <span><i className="active-fence" /> Active</span>
        <span><i className="inactive-fence" /> Inactive</span>
      </div>
    </div>
  );
}
