"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, Marker, setWorkerUrl, type Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Icon from "@/components/ui/icon";
import { buildBaseStyle, type MapMode } from "@/components/map/styles";
import { personalProfiles, type PersonalProfile } from "./personal-data";

let workerReady = false;
function ensureMapWorker() {
  if (workerReady || typeof window === "undefined") return;
  setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
  workerReady = true;
}

const PERSON_SVG =
  `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="3"/><path d="M5 19a7 7 0 0 1 14 0"/></svg>`;

export default function PersonalMap({ person }: { person: PersonalProfile }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [mode, setMode] = useState<MapMode>("satellite");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    ensureMapWorker();

    const map = new MapLibreMap({
      container: containerRef.current,
      style: buildBaseStyle(mode),
      center: [person.lng, person.lat],
      zoom: 13.6,
      pitch: 28,
      bearing: -8,
      attributionControl: false,
    });
    mapRef.current = map;

    map.on("load", () => {
      for (const item of personalProfiles) {
        const el = document.createElement("div");
        el.className = `mesh-node soldier status-${item.status}${item.id === person.id ? " is-selected" : ""}`;
        el.innerHTML = `<span class="mesh-node-dot">${PERSON_SVG}</span><span class="mesh-node-card"><strong>${item.code}</strong></span>`;
        const marker = new Marker({ element: el, anchor: "center" })
          .setLngLat([item.lng, item.lat])
          .addTo(map);
        markersRef.current.push(marker);
      }
    });

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    return () => {
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
    if (!map) return;
    map.setStyle(buildBaseStyle(mode));
    map.once("style.load", () => {
      for (const marker of markersRef.current) marker.addTo(map);
    });
  }, [mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ center: [person.lng, person.lat], zoom: 13.8, duration: 800 });
    for (const marker of markersRef.current) {
      const el = marker.getElement();
      const code = el.querySelector("strong")?.textContent;
      const profile = personalProfiles.find((item) => item.code === code);
      if (!profile) continue;
      el.className = `mesh-node soldier status-${profile.status}${profile.id === person.id ? " is-selected" : ""}`;
    }
  }, [person]);

  return (
    <div className="prs-hero-map">
      <div ref={containerRef} className="maplibre-root" />
      <div className="prs-map-modes">
        {(["satellite", "terrain", "dark"] as const).map((item) => (
          <button key={item} type="button" className={mode === item ? "on" : ""} onClick={() => setMode(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      <div className="prs-map-tools">
        <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn({ duration: 180 })}>
          +
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut({ duration: 180 })}>
          −
        </button>
        <button type="button" aria-label="Layers">
          <Icon name="layers" size={14} />
        </button>
      </div>
    </div>
  );
}
