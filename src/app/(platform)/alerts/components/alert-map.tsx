"use client";

import { useEffect, useRef } from "react";
import { Map as MapLibreMap, Marker, setWorkerUrl, type Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Icon from "@/components/ui/icon";
import { buildBaseStyle } from "@/components/map/styles";
import { bindGeofenceOverlay } from "@/components/map/geofence-overlay";
import type { AlertType, Severity } from "./alerts-data";

const PIN_LABEL: Record<string, string> = {
  SOS: "SOS",
  Casualty: "CAS",
  Arrhythmia: "ARR",
  Health: "HLT",
  "Low Battery": "LOW",
  "Out of Geofence": "GEO",
  "No Movement": "STILL",
  "Device Issue": "DEV",
  "High Temperature": "HEAT",
  "Heat Stress": "HEAT",
  "Strap Disconnected": "STRAP",
  "No Contact": "NONE",
  Others: "!",
};

let workerReady = false;
function ensureMapWorker() {
  if (workerReady || typeof window === "undefined") return;
  setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
  workerReady = true;
}

export default function AlertMap({
  lng,
  lat,
  soldier,
  type,
  severity,
}: {
  lng: number;
  lat: number;
  soldier: string;
  type: AlertType | string;
  severity: Severity;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const place = useRef({ lng, lat });
  place.current = { lng, lat };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    ensureMapWorker();
    const map = new MapLibreMap({
      container: containerRef.current,
      style: buildBaseStyle("terrain"),
      center: [place.current.lng, place.current.lat],
      zoom: 13,
      attributionControl: false,
    });
    mapRef.current = map;
    const unbindGeofences = bindGeofenceOverlay(map);
    map.on("load", () => map.resize());
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);

    return () => {
      unbindGeofences();
      observer.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setCenter([lng, lat]);
    markerRef.current?.remove();
    const pin = document.createElement("div");
    pin.className = `alt-pin ${severity}`;
    pin.textContent = PIN_LABEL[type] ?? type.slice(0, 3).toUpperCase();
    pin.title = `${type} · ${soldier}`;
    markerRef.current = new Marker({ element: pin, anchor: "center" }).setLngLat([lng, lat]).addTo(map);
  }, [lat, lng, severity, soldier, type]);

  return (
    <div className="alt-map">
      <div ref={containerRef} className="maplibre-root" />
      <div className="alt-map-zoom">
        <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn({ duration: 200 })}>
          <Icon name="plus" size={14} />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut({ duration: 200 })}>
          −
        </button>
      </div>
      <span className="alt-map-scale">2 km</span>
    </div>
  );
}
