"use client";

import { useEffect, useRef } from "react";
import { Map as MapLibreMap, Marker, setWorkerUrl, type Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Icon from "@/components/ui/icon";
import { buildBaseStyle } from "@/components/map/styles";

let workerReady = false;
function ensureMapWorker() {
  if (workerReady || typeof window === "undefined") return;
  setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
  workerReady = true;
}

export default function AlertMap({ lng, lat, soldier }: { lng: number; lat: number; soldier: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    ensureMapWorker();
    const map = new MapLibreMap({
      container: containerRef.current,
      style: buildBaseStyle("terrain"),
      center: [lng, lat],
      zoom: 13,
      attributionControl: false,
    });
    mapRef.current = map;

    const sos = document.createElement("div");
    sos.className = "alt-pin sos";
    sos.textContent = "SOS";
    const who = document.createElement("div");
    who.className = "alt-pin who";
    who.textContent = soldier;

    const markers = [
      new Marker({ element: sos, anchor: "center" }).setLngLat([lng, lat]).addTo(map),
      new Marker({ element: who, anchor: "center" }).setLngLat([lng + 0.004, lat + 0.002]).addTo(map),
    ];

    map.on("load", () => map.resize());
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      markers.forEach((marker) => marker.remove());
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, soldier]);

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
