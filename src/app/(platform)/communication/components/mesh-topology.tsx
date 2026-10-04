"use client";

import { useEffect, useRef } from "react";
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Icon from "@/components/ui/icon";
import { buildBaseStyle } from "@/components/map/styles";
import { bindGeofenceOverlay } from "@/components/map/geofence-overlay";
import { MESH_LINKS, MESH_NODES, type MeshQuality } from "./mesh-data";

let workerReady = false;
function ensureMapWorker() {
  if (workerReady || typeof window === "undefined") return;
  setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
  workerReady = true;
}

const QUALITIES: MeshQuality[] = ["excellent", "good", "fair", "poor"];
const LINE_COLOR: Record<MeshQuality, string> = {
  excellent: "#22c55e",
  good: "#eab308",
  fair: "#f97316",
  poor: "#ef4444",
};

function linkCollection(quality: MeshQuality): GeoJSON.FeatureCollection {
  const byId = new Map(MESH_NODES.map((node) => [node.id, node]));
  return {
    type: "FeatureCollection",
    features: MESH_LINKS.filter((link) => link.quality === quality).flatMap((link) => {
      const from = byId.get(link.from);
      const to = byId.get(link.to);
      if (!from || !to) return [];
      return [
        {
          type: "Feature" as const,
          properties: { quality },
          geometry: {
            type: "LineString" as const,
            coordinates: [
              [from.lng, from.lat],
              [to.lng, to.lat],
            ],
          },
        },
      ];
    }),
  };
}

function markerElement(id: string, kind: "soldier" | "gateway", rssi: number, hops: number) {
  const root = document.createElement("div");
  root.className = `mesh-node ${kind}`;
  const icon =
    kind === "gateway"
      ? `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M12 20v-8M8 20h8M12 12 7 16M12 12l5 4M12 8 6 12M12 8l6 4"/><circle cx="12" cy="5.5" r="1.3" fill="#fff" stroke="none"/></svg>`
      : `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="3"/><path d="M5 19a7 7 0 0 1 14 0"/></svg>`;
  const rssiText = kind === "gateway" ? "" : `<small>${rssi} dBm</small><small class="hops">${hops} hop${hops === 1 ? "" : "s"}</small>`;
  root.innerHTML = `<span class="mesh-node-dot">${icon}</span><span class="mesh-node-card"><strong>${id}</strong>${rssiText}</span>`;
  return root;
}

export default function MeshTopology({ showHop }: { showHop: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    ensureMapWorker();

    const map = new MapLibreMap({
      container: containerRef.current,
      style: buildBaseStyle("terrain"),
      center: [106.808, -6.244],
      zoom: 12.6,
      pitch: 0,
      attributionControl: false,
    });
    mapRef.current = map;
    const unbindGeofences = bindGeofenceOverlay(map);

    const markers: Marker[] = [];

    map.on("load", () => {
      for (const quality of QUALITIES) {
        map.addSource(`mesh-link-${quality}`, { type: "geojson", data: linkCollection(quality) });
        map.addLayer({
          id: `mesh-link-${quality}`,
          type: "line",
          source: `mesh-link-${quality}`,
          paint: {
            "line-color": LINE_COLOR[quality],
            "line-width": 2.5,
            "line-opacity": 0.95,
            ...(quality === "fair" || quality === "poor" ? { "line-dasharray": [1.6, 1.2] } : {}),
          },
        });
      }

      const bounds = new LngLatBounds();
      for (const node of MESH_NODES) {
        bounds.extend([node.lng, node.lat]);
        const marker = new Marker({ element: markerElement(node.id, node.kind, node.rssi, node.hops), anchor: "center" })
          .setLngLat([node.lng, node.lat])
          .addTo(map);
        markers.push(marker);
      }
      map.fitBounds(bounds, { padding: 72, duration: 0, maxZoom: 13.4 });
      map.resize();
    });

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);

    return () => {
      unbindGeofences();
      observer.disconnect();
      markers.forEach((marker) => marker.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className={`mesh-topo${showHop ? "" : " is-hops-off"}`}>
      <div ref={containerRef} className="maplibre-root mesh-topo-map" />
      <div className="mesh-zoom">
        <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn({ duration: 200 })}>
          <Icon name="plus" size={14} />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut({ duration: 200 })}>
          −
        </button>
      </div>
      <div className="mesh-legend">
        <strong>Link Quality (RSSI)</strong>
        <span><i className="excellent" /> Excellent &gt; −70 dBm</span>
        <span><i className="good" /> Good −70 to −85 dBm</span>
        <span><i className="fair" /> Fair −85 to −100 dBm</span>
        <span><i className="poor" /> Poor &lt; −100 dBm</span>
      </div>
      <div className="mesh-scale">2 km</div>
    </div>
  );
}
