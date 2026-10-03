"use client";

import { useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  setWorkerUrl,
  type GeoJSONSource,
  type Map,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Icon from "@/components/ui/icon";
import { registerMapIcons } from "@/components/map/icons";
import { buildBaseStyle, type MapMode } from "@/components/map/styles";
import type { GroupInfo } from "./groups-data";

let workerReady = false;
function ensureMapWorker() {
  if (workerReady || typeof window === "undefined") return;
  setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
  workerReady = true;
}

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

function toPersonnelGeoJSON(group: GroupInfo): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: group.members.map((member, index) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [member.lng, member.lat] },
      properties: {
        id: member.id,
        status: member.status,
        name: member.name,
        role: index === 0 ? "danru" : "member",
      },
    })),
  };
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

function hydrate(map: Map, group: GroupInfo) {
  registerMapIcons(map);

  const area = toAreaGeoJSON(group);
  const personnel = toPersonnelGeoJSON(group);

  const upsert = (id: string, data: GeoJSON.FeatureCollection) => {
    const source = map.getSource(id) as GeoJSONSource | undefined;
    if (source) source.setData(data);
    else map.addSource(id, { type: "geojson", data, promoteId: id === "group-personnel" ? "id" : undefined });
  };

  upsert("group-area", area);
  upsert("group-restricted", RESTRICTED);
  upsert("group-personnel", personnel);

  if (!map.getLayer("group-area-fill")) {
    map.addLayer({
      id: "group-area-fill",
      type: "fill",
      source: "group-area",
      paint: { "fill-color": "#00D99A", "fill-opacity": 0.14 },
    });
    map.addLayer({
      id: "group-area-line",
      type: "line",
      source: "group-area",
      paint: { "line-color": "#34D399", "line-width": 2, "line-dasharray": [2, 1.2] },
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
    map.addLayer({
      id: "group-personnel-icons",
      type: "symbol",
      source: "group-personnel",
      layout: {
        "icon-image": [
          "match",
          ["get", "role"],
          "danru",
          "personnel-pin-leader",
          "personnel-pin-online",
        ],
        "icon-size": 0.48,
        "icon-anchor": "bottom",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "text-field": ["get", "id"],
        "text-offset": [0, 0.4],
        "text-size": 10,
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": "#e8eef6",
        "text-halo-color": "rgba(0,0,0,0.7)",
        "text-halo-width": 1,
      },
    });
  }
}

export default function GroupMap({ group }: { group: GroupInfo }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
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

    map.on("load", () => {
      hydrate(map, group);
      map.resize();
    });

    const ro = new ResizeObserver(() => map.resize());
    if (containerRef.current.parentElement) ro.observe(containerRef.current.parentElement);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(buildBaseStyle(mode));
    map.once("style.load", () => hydrate(map, group));
    // group is reapplied via hydrate after style load; avoid setStyle on every group switch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    hydrate(map, group);
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
