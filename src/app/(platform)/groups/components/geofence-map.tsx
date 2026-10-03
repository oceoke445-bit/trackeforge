"use client";

import { useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  Marker,
  setWorkerUrl,
  type GeoJSONSource,
  type Map,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Icon from "@/components/ui/icon";
import { buildBaseStyle, type MapMode } from "@/components/map/styles";
import {
  MAP_UNITS,
  toZonesGeoJSON,
  zoneCenter,
  type GeofenceType,
  type GeofenceZone,
} from "./geofence-data";

let workerReady = false;
function ensureMapWorker() {
  if (workerReady || typeof window === "undefined") return;
  setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
  workerReady = true;
}

function unitElement(unit: (typeof MAP_UNITS)[number]) {
  const el = document.createElement("div");
  el.className = `gfn-unit-dot ${unit.online ? "online" : "offline"}${unit.alert ? " alert" : ""}`;
  el.title = unit.id;
  return el;
}

function zoneMarkerElement(type: GeofenceType, selected: boolean) {
  const el = document.createElement("div");
  el.className = `gfn-zone-marker ${type}${selected ? " on" : ""}`;
  const icon =
    type === "safe"
      ? `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12.5 9.5 17 19 7"/></svg>`
      : type === "silent"
        ? `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m12 3 9 16H3Z"/><path d="M12 10v4M12 17h.01"/></svg>`
        : `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m12 3 9 16H3Z"/><path d="M12 10v4M12 17h.01"/></svg>`;
  el.innerHTML = icon;
  return el;
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
  }
}

export default function GeofenceMap({
  zones,
  selectedId,
  onSelect,
}: {
  zones: GeofenceZone[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const unitMarkersRef = useRef<Marker[]>([]);
  const zoneMarkersRef = useRef<Marker[]>([]);
  const [mode, setMode] = useState<MapMode>("satellite");
  const zonesRef = useRef(zones);
  const selectedRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  zonesRef.current = zones;
  selectedRef.current = selectedId;
  onSelectRef.current = onSelect;

  function syncZoneMarkers(map: Map, nextZones: GeofenceZone[], nextSelected: string) {
    zoneMarkersRef.current.forEach((marker) => marker.remove());
    zoneMarkersRef.current = nextZones.map((zone) => {
      const el = zoneMarkerElement(zone.type, zone.id === nextSelected);
      el.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelectRef.current(zone.id);
      });
      return new Marker({ element: el, anchor: "center" }).setLngLat(zoneCenter(zone)).addTo(map);
    });
  }

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
      unitMarkersRef.current = MAP_UNITS.map((unit) =>
        new Marker({ element: unitElement(unit), anchor: "center" })
          .setLngLat([unit.lng, unit.lat])
          .addTo(map),
      );
      syncZoneMarkers(map, zonesRef.current, selectedRef.current);
    });

    const click = (event: MapLayerMouseEvent) => {
      const id = event.features?.[0]?.properties?.id as string | undefined;
      if (id) onSelectRef.current(id);
    };
    map.on("click", "gfn-fill", click);
    map.on("mouseenter", "gfn-fill", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "gfn-fill", () => {
      map.getCanvas().style.cursor = "";
    });

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.off("click", "gfn-fill", click);
      unitMarkersRef.current.forEach((marker) => marker.remove());
      zoneMarkersRef.current.forEach((marker) => marker.remove());
      unitMarkersRef.current = [];
      zoneMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    hydrate(map, zones, selectedId);
    syncZoneMarkers(map, zones, selectedId);
  }, [zones, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(buildBaseStyle(mode));
    map.once("style.load", () => {
      hydrate(map, zonesRef.current, selectedRef.current);
      unitMarkersRef.current.forEach((marker) => marker.remove());
      unitMarkersRef.current = MAP_UNITS.map((unit) =>
        new Marker({ element: unitElement(unit), anchor: "center" })
          .setLngLat([unit.lng, unit.lat])
          .addTo(map),
      );
      syncZoneMarkers(map, zonesRef.current, selectedRef.current);
    });
  }, [mode]);

  return (
    <div className="gfn-map">
      <div ref={containerRef} className="maplibre-root" />
      <div className="gfn-map-tools">
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
        <span><i className="online" /> Unit (Online)</span>
        <span><i className="offline" /> Unit (Offline)</span>
        <span><i className="alert" /> Alert / Violation</span>
        <span><i className="active-fence" /> Geofence (Active)</span>
        <span><i className="inactive-fence" /> Geofence (Inactive)</span>
      </div>
    </div>
  );
}
