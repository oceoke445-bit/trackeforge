"use client";

import { useEffect, useRef } from "react";
import { Map as MapLibreMap, Marker, setWorkerUrl, type GeoJSONSource, type Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Icon from "@/components/ui/icon";
import { buildBaseStyle } from "@/components/map/styles";
import { bindGeofenceOverlay } from "@/components/map/geofence-overlay";
import type { Operation, OpLayers } from "./operations-data";

let workerReady = false;
function ensureMapWorker() {
  if (workerReady || typeof window === "undefined") return;
  setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
  workerReady = true;
}

function pin(className: string, label: string) {
  const el = document.createElement("div");
  el.className = `ops-pin ${className}`;
  el.innerHTML = `<span></span><b>${label}</b>`;
  return el;
}

export default function OperationsMap({ operation, layers }: { operation: Operation; layers: OpLayers }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const opRef = useRef(operation);
  const layersRef = useRef(layers);
  const fitted = useRef("");
  opRef.current = operation;
  layersRef.current = layers;

  function paint(map: Map) {
    const op = opRef.current;
    const show = layersRef.current;
    const area = { type: "Feature" as const, properties: {}, geometry: { type: "Polygon" as const, coordinates: [op.ring] } };
    const route = { type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: op.route } };
    const areaSource = map.getSource("ops-area") as GeoJSONSource | undefined;
    const routeSource = map.getSource("ops-route") as GeoJSONSource | undefined;
    if (areaSource) areaSource.setData(area);
    else map.addSource("ops-area", { type: "geojson", data: area });
    if (routeSource) routeSource.setData(route);
    else map.addSource("ops-route", { type: "geojson", data: route });

    if (!map.getLayer("ops-fill")) {
      map.addLayer({ id: "ops-fill", type: "fill", source: "ops-area", paint: { "fill-color": "#ef4444", "fill-opacity": 0.18 } });
      map.addLayer({ id: "ops-line", type: "line", source: "ops-area", paint: { "line-color": "#f87171", "line-width": 2 } });
      map.addLayer({ id: "ops-route", type: "line", source: "ops-route", paint: { "line-color": "#60a5fa", "line-width": 2.4, "line-dasharray": [1.2, 1.2] } });
    }
    map.setLayoutProperty("ops-fill", "visibility", show.geofences ? "visible" : "none");
    map.setLayoutProperty("ops-line", "visibility", show.geofences ? "visible" : "none");
    map.setLayoutProperty("ops-route", "visibility", show.routes ? "visible" : "none");

    for (const marker of markersRef.current) marker.remove();
    markersRef.current = [];
    const add = (el: HTMLElement, lng: number, lat: number) => {
      markersRef.current.push(new Marker({ element: el, anchor: "center" }).setLngLat([lng, lat]).addTo(map));
    };
    if (show.groups) {
      for (const item of op.pins) add(pin("group", item.name), item.lng, item.lat);
      add(pin("gw", op.gateway), op.gatewayPin[0], op.gatewayPin[1]);
    }
    if (show.personnel) for (const [lng, lat] of op.people) add(pin("person", ""), lng, lat);
    if (show.weapons) for (const [lng, lat] of op.weaponPins) add(pin("weapon", ""), lng, lat);
    for (const [lng, lat] of op.alertPins) add(pin("alert", ""), lng, lat);

    if (fitted.current !== op.id) {
      fitted.current = op.id;
      const lngs = op.ring.map((point) => point[0]);
      const lats = op.ring.map((point) => point[1]);
      map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 46, duration: 500 });
    }
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    ensureMapWorker();
    const map = new MapLibreMap({
      container: containerRef.current,
      style: buildBaseStyle("satellite"),
      center: operation.center,
      zoom: 13,
      pitch: 0,
      attributionControl: false,
    });
    mapRef.current = map;
    const unbindGeofences = bindGeofenceOverlay(map);
    map.on("load", () => paint(map));
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);
    return () => {
      unbindGeofences();
      ro.disconnect();
      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    paint(map);
  });

  return (
    <div className="ops-map">
      <div ref={containerRef} className="ops-map-canvas" />
      <div className="ops-zoom">
        <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()}><Icon name="plus" size={14} /></button>
        <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()}>−</button>
      </div>
      <span className="ops-scale">5 km</span>
    </div>
  );
}
