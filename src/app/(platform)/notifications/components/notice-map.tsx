"use client";

import { useEffect, useRef } from "react";
import { Map as MapLibreMap, setWorkerUrl, type GeoJSONSource, type Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { buildBaseStyle } from "@/components/map/styles";
import { bindGeofenceOverlay } from "@/components/map/geofence-overlay";

let workerReady = false;
function ensureMapWorker() {
  if (workerReady || typeof window === "undefined") return;
  setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
  workerReady = true;
}

export default function NoticeMap({ lat, lng }: { lat: number; lng: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    ensureMapWorker();
    const map = new MapLibreMap({
      container: containerRef.current,
      style: buildBaseStyle("satellite"),
      center: [lng, lat],
      zoom: 14.2,
      pitch: 0,
      interactive: false,
      attributionControl: false,
    });
    mapRef.current = map;
    const unbindGeofences = bindGeofenceOverlay(map);

    map.on("load", () => {
      map.addSource("notice-point", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "Point", coordinates: [lng, lat] },
          properties: {},
        },
      });
      map.addLayer({
        id: "notice-halo",
        type: "circle",
        source: "notice-point",
        paint: {
          "circle-radius": 28,
          "circle-color": "#FF3B4A",
          "circle-opacity": 0.22,
          "circle-blur": 0.4,
        },
      });
      map.addLayer({
        id: "notice-dot",
        type: "circle",
        source: "notice-point",
        paint: {
          "circle-radius": 8,
          "circle-color": "#FF3B4A",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2,
        },
      });
      map.resize();
    });

    const ro = new ResizeObserver(() => map.resize());
    if (containerRef.current.parentElement) ro.observe(containerRef.current.parentElement);

    return () => {
      unbindGeofences();
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource("notice-point") as GeoJSONSource | undefined;
    source?.setData({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: {},
    });
    map.easeTo({ center: [lng, lat], duration: 500 });
  }, [lat, lng]);

  return (
    <div className="ntf-mini-map">
      <div ref={containerRef} className="maplibre-root" />
    </div>
  );
}
