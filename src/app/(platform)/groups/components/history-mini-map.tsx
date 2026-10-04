"use client";

import { useEffect, useRef } from "react";
import { Map as MapLibreMap, Marker, setWorkerUrl, type Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { buildBaseStyle } from "@/components/map/styles";
import { bindGeofenceOverlay } from "@/components/map/geofence-overlay";
import type { HistoryEvent } from "./history-data";

let workerReady = false;
function ensureMapWorker() {
  if (workerReady || typeof window === "undefined") return;
  setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
  workerReady = true;
}

export default function HistoryMiniMap({ event }: { event: HistoryEvent }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    ensureMapWorker();

    const map = new MapLibreMap({
      container: containerRef.current,
      style: buildBaseStyle("satellite"),
      center: [event.lng, event.lat],
      zoom: 14.2,
      pitch: 0,
      interactive: true,
      attributionControl: false,
    });
    mapRef.current = map;
    const unbindGeofences = bindGeofenceOverlay(map);

    const el = document.createElement("div");
    el.className = `hist-map-marker ${event.type.toLowerCase()}`;
    el.innerHTML = `<span>${event.type === "SOS" ? "SOS" : event.type.slice(0, 3).toUpperCase()}</span>`;
    markerRef.current = new Marker({ element: el, anchor: "center" })
      .setLngLat([event.lng, event.lat])
      .addTo(map);

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    return () => {
      unbindGeofences();
      ro.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ center: [event.lng, event.lat], duration: 500 });
    markerRef.current?.setLngLat([event.lng, event.lat]);
    const el = markerRef.current?.getElement();
    if (el) {
      el.className = `hist-map-marker ${event.type.toLowerCase()}`;
      el.innerHTML = `<span>${event.type === "SOS" ? "SOS" : event.type.slice(0, 3).toUpperCase()}</span>`;
    }
  }, [event]);

  return (
    <div className="hist-mini-map">
      <div ref={containerRef} className="maplibre-root" />
      <div className="hist-mini-map-tools">
        <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn({ duration: 180 })}>
          +
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut({ duration: 180 })}>
          −
        </button>
      </div>
    </div>
  );
}
