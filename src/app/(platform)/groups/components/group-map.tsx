"use client";

import { useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  Marker,
  setWorkerUrl,
  type GeoJSONSource,
  type Map,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Icon from "@/components/ui/icon";
import { registerMapIcons } from "@/components/map/icons";
import { buildBaseStyle, type MapMode } from "@/components/map/styles";
import { bindGeofenceOverlay } from "@/components/map/geofence-overlay";
import type { PersonnelStatus } from "@/app/(platform)/components/command-data";
import type { GroupInfo, GroupMember } from "./groups-data";

let workerReady = false;
function ensureMapWorker() {
  if (workerReady || typeof window === "undefined") return;
  setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
  workerReady = true;
}

const PERSON_SVG =
  `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="3"/><path d="M5 19a7 7 0 0 1 14 0"/></svg>`;

const RESTRICTED: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { label: "⚠ Restricted Area" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [106.82, -6.22],
            [106.848, -6.218],
            [106.85, -6.238],
            [106.826, -6.242],
            [106.82, -6.22],
          ],
        ],
      },
    },
  ],
};

function personMarkerElement(id: string, status: PersonnelStatus) {
  const root = document.createElement("div");
  root.className = `mesh-node soldier status-${status}`;
  root.innerHTML = `<span class="mesh-node-dot">${PERSON_SVG}</span><span class="mesh-node-card"><strong>${id}</strong></span>`;
  return root;
}

function toAreaGeoJSON(group: GroupInfo): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { label: `${group.name} Area` },
        geometry: { type: "Polygon", coordinates: [group.areaPolygon] },
      },
    ],
  };
}

function hydrateLayers(map: Map, group: GroupInfo) {
  registerMapIcons(map);

  const area = toAreaGeoJSON(group);

  const upsert = (id: string, data: GeoJSON.FeatureCollection) => {
    const source = map.getSource(id) as GeoJSONSource | undefined;
    if (source) source.setData(data);
    else map.addSource(id, { type: "geojson", data });
  };

  upsert("group-area", area);
  upsert("group-restricted", RESTRICTED);

  if (map.getLayer("group-area-line")) map.removeLayer("group-area-line");

  if (!map.getLayer("group-area-fill")) {
    map.addLayer({
      id: "group-area-fill",
      type: "fill",
      source: "group-area",
      paint: { "fill-color": "#00D99A", "fill-opacity": 0.14 },
    });
    map.addLayer({
      id: "group-area-label",
      type: "symbol",
      source: "group-area",
      layout: {
        "text-field": ["get", "label"],
        "text-size": 12,
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
      },
      paint: {
        "text-color": "#d1fae5",
        "text-halo-color": "rgba(0,0,0,0.65)",
        "text-halo-width": 1.2,
      },
    });
    map.addLayer({
      id: "group-restricted-fill",
      type: "fill",
      source: "group-restricted",
      paint: { "fill-color": "#FF3B30", "fill-opacity": 0.18 },
    });
    map.addLayer({
      id: "group-restricted-line",
      type: "line",
      source: "group-restricted",
      paint: { "line-color": "#FF3B30", "line-width": 2, "line-dasharray": [2.2, 1.4] },
    });
    map.addLayer({
      id: "group-restricted-label",
      type: "symbol",
      source: "group-restricted",
      layout: {
        "text-field": ["get", "label"],
        "text-size": 11,
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
      },
      paint: { "text-color": "#fff", "text-halo-color": "#B91C1C", "text-halo-width": 2 },
    });
  }
}

function syncMemberMarkers(
  map: Map,
  members: GroupMember[],
  markersRef: { current: Marker[] },
) {
  for (const marker of markersRef.current) marker.remove();
  markersRef.current = [];

  for (const member of members) {
    const el = personMarkerElement(member.id, member.status);
    const marker = new Marker({ element: el, anchor: "center" })
      .setLngLat([member.lng, member.lat])
      .addTo(map);
    markersRef.current.push(marker);
  }
}

export default function GroupMap({ group }: { group: GroupInfo }) {
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
      center: [group.areaPolygon[0][0] + 0.015, group.areaPolygon[0][1] - 0.01],
      zoom: 12.6,
      pitch: 20,
      bearing: -4,
      attributionControl: false,
    });
    mapRef.current = map;
    const unbindGeofences = bindGeofenceOverlay(map);

    map.on("load", () => {
      hydrateLayers(map, group);
      syncMemberMarkers(map, group.members, markersRef);
      map.resize();
    });

    const ro = new ResizeObserver(() => map.resize());
    if (containerRef.current.parentElement) ro.observe(containerRef.current.parentElement);

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
    if (!map) return;
    map.setStyle(buildBaseStyle(mode));
    map.once("style.load", () => {
      hydrateLayers(map, group);
      syncMemberMarkers(map, group.members, markersRef);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    hydrateLayers(map, group);
    syncMemberMarkers(map, group.members, markersRef);
    const lngs = group.members.map((m) => m.lng);
    const lats = group.members.map((m) => m.lat);
    if (!lngs.length) return;
    map.fitBounds(
      [
        [Math.min(...lngs) - 0.01, Math.min(...lats) - 0.01],
        [Math.max(...lngs) + 0.01, Math.max(...lats) + 0.01],
      ],
      { padding: 48, duration: 700, pitch: 20 },
    );
  }, [group]);

  return (
    <div className="grp-map">
      <div ref={containerRef} className="maplibre-root" />
      <div className="tf-side-tools grp-map-tools">
        <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn({ duration: 200 })}>
          <Icon name="plus" size={16} />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut({ duration: 200 })}>
          −
        </button>
      </div>
      <div className="cmd-map-modes" role="group" aria-label="Map mode">
        {(["terrain", "satellite", "dark"] as const).map((item) => (
          <button key={item} type="button" className={mode === item ? "on" : ""} onClick={() => setMode(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
