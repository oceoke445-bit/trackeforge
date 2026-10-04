"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, Marker, setWorkerUrl, type GeoJSONSource, type Map, type MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Icon from "@/components/ui/icon";
import { buildBaseStyle, type MapMode } from "@/components/map/styles";
import { bindGeofenceOverlay } from "@/components/map/geofence-overlay";
import { formatClock, positionUncertainty, SOURCE_COLOR, type TrackPoint } from "./history-track";

let workerReady = false;
function ensureMapWorker() {
  if (workerReady || typeof window === "undefined") return;
  setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
  workerReady = true;
}

function collection(points: TrackPoint[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: points.map((point) => ({
      type: "Feature",
      properties: { index: point.index, source: point.source, event: point.event ? 1 : 0 },
      geometry: { type: "Point", coordinates: [point.lng, point.lat] },
    })),
  };
}

function line(points: TrackPoint[]): GeoJSON.Feature {
  const bySoldier: Record<string, TrackPoint[]> = {};
  points.forEach((point) => {
    (bySoldier[point.soldierId] ??= []).push(point);
  });
  const lines: [number, number][][] = [];
  Object.values(bySoldier).forEach((soldierPoints) => {
    let current: [number, number][] = [];
    soldierPoints.forEach((point, index) => {
      const previous = soldierPoints[index - 1];
      const now = point.eventUnix ?? point.seconds;
      const then = previous ? (previous.eventUnix ?? previous.seconds) : now;
      const split = !previous || now - then > 15 * 60;
      if (split && current.length > 1) lines.push(current);
      if (split) current = [[point.lng, point.lat]];
      else current.push([point.lng, point.lat]);
    });
    if (current.length > 1) lines.push(current);
  });
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "MultiLineString", coordinates: lines },
  };
}

function popup(point: TrackPoint) {
  const node = document.createElement("div");
  node.className = "trk-now";
  const vital = point.strap ? `HR ${point.hr} bpm` : "TANPA VITAL";
  node.innerHTML = `<div class="trk-pop"><strong>${formatClock(point.seconds)}</strong><span>${vital}</span><span>${point.source ?? "—"} (${positionUncertainty(point.source ?? "Stale / Unknown")})</span></div><i></i>`;
  return node;
}

function endMarker(kind: "start" | "end", label: string) {
  const node = document.createElement("div");
  node.className = `trk-end ${kind}`;
  node.innerHTML = `<b>${kind === "start" ? "S" : "E"}</b><small>${label}</small>`;
  return node;
}

export default function HistoryTrackMap({
  points,
  selected,
  onSelect,
}: {
  points: TrackPoint[];
  selected: TrackPoint | null;
  onSelect: (index: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const endsRef = useRef<Marker[]>([]);
  const pointsRef = useRef(points);
  const selectedRef = useRef(selected);
  const onSelectRef = useRef(onSelect);
  const [mode, setMode] = useState<MapMode>("terrain");
  const modeReady = useRef(false);
  pointsRef.current = points;
  selectedRef.current = selected;
  onSelectRef.current = onSelect;

  function draw(map: Map, fit: boolean) {
    if (!map.isStyleLoaded()) return;
    const current = pointsRef.current;
    const lineSource = map.getSource("trk-line") as GeoJSONSource | undefined;
    const pointSource = map.getSource("trk-pts") as GeoJSONSource | undefined;
    if (lineSource && pointSource) {
      lineSource.setData(line(current));
      pointSource.setData(collection(current));
    } else {
      map.addSource("trk-line", { type: "geojson", data: line(current) });
      map.addSource("trk-pts", { type: "geojson", data: collection(current) });
      map.addLayer({
        id: "trk-line",
        type: "line",
        source: "trk-line",
        paint: { "line-color": "#60a5fa", "line-width": 3 },
      });
      map.addLayer({
        id: "trk-pts",
        type: "circle",
        source: "trk-pts",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 3, 18, 5, 21, 6],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
          "circle-color": [
            "case",
            ["==", ["get", "event"], 1],
            "#ef4444",
            ["match", ["get", "source"], "GNSS", SOURCE_COLOR.GNSS, "Dead Reckoning", SOURCE_COLOR["Dead Reckoning"], "Trilateration / RSSI", SOURCE_COLOR["Trilateration / RSSI"], "Stale / Unknown", SOURCE_COLOR["Stale / Unknown"], "#94a3b8"],
          ],
        },
      });
    }
    if (map.getLayer("trk-line")) map.moveLayer("trk-line");
    if (map.getLayer("trk-pts")) map.moveLayer("trk-pts");
    endsRef.current.forEach((marker) => marker.remove());
    endsRef.current = [];
    if (current.length) {
      const bySoldier: Record<string, TrackPoint[]> = {};
      current.forEach((point) => {
        (bySoldier[point.soldierId] ??= []).push(point);
      });
      endsRef.current = Object.values(bySoldier).flatMap((list) => {
        const first = list[0];
        const last = list[list.length - 1];
        const markers = [
          new Marker({ element: endMarker("start", formatClock(first.seconds, false)), anchor: "center" }).setLngLat([first.lng, first.lat]).addTo(map),
        ];
        if (list.length > 1) {
          markers.push(new Marker({ element: endMarker("end", formatClock(last.seconds, false)), anchor: "center" }).setLngLat([last.lng, last.lat]).addTo(map));
        }
        return markers;
      });
      if (fit) frameTrack(map, current);
    }
    placeSelected(map);
  }

  function frameTrack(map: Map, points: TrackPoint[]) {
    const width = map.getCanvas().clientWidth;
    const height = map.getCanvas().clientHeight;
    if (width < 40 || height < 40) return;
    const lngs = points.map((point) => point.lng);
    const lats = points.map((point) => point.lat);
    const pad = Math.min(28, Math.floor(Math.min(width, height) / 8));
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: pad, duration: 0, maxZoom: 22 },
    );
  }

function placeSelected(map: Map) {
    markerRef.current?.remove();
    markerRef.current = null;
    const point = selectedRef.current;
    if (!point) return;
    markerRef.current = new Marker({ element: popup(point), anchor: "bottom" }).setLngLat([point.lng, point.lat]).addTo(map);
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    ensureMapWorker();
    const map = new MapLibreMap({
      container: containerRef.current,
      style: buildBaseStyle("terrain"),
      center: [106.8456, -6.2088],
      zoom: 13,
      attributionControl: false,
    });
    mapRef.current = map;
    const unbind = bindGeofenceOverlay(map);
    const pick = (event: MapMouseEvent) => {
      if (!map.getLayer("trk-pts")) return;
      const hits = map.queryRenderedFeatures(event.point, { layers: ["trk-pts"] });
      const index = Number(hits[0]?.properties?.index);
      if (Number.isFinite(index)) onSelectRef.current(index);
    };
    map.on("click", pick);
    map.on("mousemove", (event) => {
      if (!map.getLayer("trk-pts")) return;
      const hits = map.queryRenderedFeatures(event.point, { layers: ["trk-pts"] });
      map.getCanvas().style.cursor = hits.length ? "pointer" : "";
    });
    let styled = false;
    const redraw = () => {
      if (!map.isStyleLoaded()) return;
      styled = true;
      draw(map, true);
    };
    map.on("style.load", redraw);
    map.on("idle", () => {
      if (map.isStyleLoaded() && !map.getLayer("trk-pts")) draw(map, true);
    });
    const observer = new ResizeObserver(() => {
      map.resize();
      if (styled) redraw();
    });
    observer.observe(containerRef.current);
    return () => {
      unbind();
      observer.disconnect();
      map.off("style.load", redraw);
      map.off("click", pick);
      markerRef.current?.remove();
      endsRef.current.forEach((marker) => marker.remove());
      map.remove();
      mapRef.current = null;
      modeReady.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.isStyleLoaded()) draw(map, true);
    else map.once("style.load", () => draw(map, true));
  }, [points]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    placeSelected(map);
  }, [selected]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!modeReady.current) {
      modeReady.current = true;
      return;
    }
    map.setStyle(buildBaseStyle(mode));
    map.once("style.load", () => draw(map, false));
  }, [mode]);

  return (
    <div className="trk-map">
      <div ref={containerRef} className="maplibre-root" />
      <div className="trk-legend">
        <strong><i className="line" /> Track Path</strong>
        {(Object.keys(SOURCE_COLOR) as (keyof typeof SOURCE_COLOR)[]).map((source) => (
          <span key={source}><i style={{ background: SOURCE_COLOR[source] }} /> {source}</span>
        ))}
        <span><i className="event" /> Event Marker</span>
      </div>
      <div className="trk-basemap">
        <button type="button" className={mode === "terrain" ? "on" : ""} onClick={() => setMode("terrain")}>Map</button>
        <button type="button" className={mode === "satellite" ? "on" : ""} onClick={() => setMode("satellite")}>Satellite</button>
      </div>
      <div className="trk-map-tools">
        <button type="button" aria-label="Reset north" onClick={() => mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 200 })}><Icon name="compass" size={15} /></button>
        <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn({ duration: 180 })}><Icon name="plus" size={15} /></button>
        <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut({ duration: 180 })}><span>−</span></button>
      </div>
      <span className="trk-scale">2 km</span>
    </div>
  );
}

export function HistoryZoomMap({ point }: { point: TrackPoint | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const pointRef = useRef(point);
  pointRef.current = point;

  useEffect(() => {
    const start = pointRef.current;
    if (!containerRef.current || mapRef.current || !start) return;
    ensureMapWorker();
    const map = new MapLibreMap({
      container: containerRef.current,
      style: buildBaseStyle("satellite"),
      center: [start.lng, start.lat],
      zoom: 15.2,
      attributionControl: false,
    });
    mapRef.current = map;
    const unbind = bindGeofenceOverlay(map);
    const node = document.createElement("div");
    node.className = "trk-zoom-dot";
    markerRef.current = new Marker({ element: node, anchor: "center" }).setLngLat([start.lng, start.lat]).addTo(map);
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);
    return () => {
      unbind();
      observer.disconnect();
      markerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!point) return;
    mapRef.current?.easeTo({ center: [point.lng, point.lat], duration: 400 });
    markerRef.current?.setLngLat([point.lng, point.lat]);
  }, [point]);

  return (
    <div className="trk-zoom">
      <div ref={containerRef} className="maplibre-root" />
      <span>200 m</span>
    </div>
  );
}
