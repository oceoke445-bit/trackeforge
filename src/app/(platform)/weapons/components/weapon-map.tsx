"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  ScaleControl,
  setWorkerUrl,
  type GeoJSONSource,
  type Map,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Icon from "@/components/ui/icon";
import { registerMapIcons } from "@/components/map/icons";
import { buildBaseStyle, type MapMode } from "@/components/map/styles";
import {
  AREA_GREEN,
  AREA_RESTRICTED,
  matchesFilter,
  statusLabel,
  weapons,
  type MapFilter,
  type WeaponAsset,
} from "./weapons-data";

let workerReady = false;
function ensureMapWorker() {
  if (workerReady || typeof window === "undefined") return;
  setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
  workerReady = true;
}

function toWeaponsGeoJSON(list: WeaponAsset[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: list.map((weapon) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [weapon.lng, weapon.lat] },
      properties: {
        id: weapon.id,
        status: weapon.status,
        label: `${weapon.id} ${statusLabel(weapon.status)}`,
      },
    })),
  };
}

function statusColorExpr() {
  return [
    "match",
    ["get", "status"],
    "connected",
    "#3B82F6",
    "disconnected",
    "#FF3B4A",
    "unassigned",
    "#8B9AAF",
    "low-battery",
    "#FFB020",
    "maintenance",
    "#22D3EE",
    "#3B82F6",
  ] as const;
}

function hydrate(map: Map, list: WeaponAsset[], selectedId: string | null) {
  registerMapIcons(map);

  const upsert = (id: string, data: GeoJSON.FeatureCollection) => {
    const source = map.getSource(id) as GeoJSONSource | undefined;
    if (source) source.setData(data);
    else map.addSource(id, { type: "geojson", data, promoteId: id === "wpn-points" ? "id" : undefined });
  };

  upsert("wpn-area", AREA_GREEN);
  upsert("wpn-restricted", AREA_RESTRICTED);
  upsert("wpn-points", toWeaponsGeoJSON(list));

  if (!map.getLayer("wpn-area-fill")) {
    map.addLayer({
      id: "wpn-area-fill",
      type: "fill",
      source: "wpn-area",
      paint: { "fill-color": "#00D99A", "fill-opacity": 0.12 },
    });
    map.addLayer({
      id: "wpn-area-line",
      type: "line",
      source: "wpn-area",
      paint: { "line-color": "#34D399", "line-width": 2, "line-dasharray": [2, 1.2] },
    });
    map.addLayer({
      id: "wpn-restricted-fill",
      type: "fill",
      source: "wpn-restricted",
      paint: { "fill-color": "#FF3B30", "fill-opacity": 0.16 },
    });
    map.addLayer({
      id: "wpn-restricted-line",
      type: "line",
      source: "wpn-restricted",
      paint: { "line-color": "#FF3B30", "line-width": 2, "line-dasharray": [2.2, 1.4] },
    });
    map.addLayer({
      id: "wpn-halo",
      type: "circle",
      source: "wpn-points",
      paint: {
        "circle-radius": ["case", ["==", ["get", "id"], selectedId ?? ""], 20, 15],
        "circle-color": statusColorExpr() as unknown as string,
        "circle-opacity": 0.28,
        "circle-blur": 0.35,
      },
    });
    map.addLayer({
      id: "wpn-circle",
      type: "circle",
      source: "wpn-points",
      paint: {
        "circle-radius": ["case", ["==", ["get", "id"], selectedId ?? ""], 14, 12],
        "circle-color": statusColorExpr() as unknown as string,
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1.8,
      },
    });
    map.addLayer({
      id: "wpn-icons",
      type: "symbol",
      source: "wpn-points",
      layout: {
        "icon-image": "weapon-icon",
        "icon-size": 0.36,
        "icon-allow-overlap": true,
        "text-field": ["get", "label"],
        "text-offset": [0, 1.55],
        "text-size": 10,
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#e8eef6",
        "text-halo-color": "rgba(0,0,0,0.75)",
        "text-halo-width": 1.2,
      },
    });
  } else {
    map.setPaintProperty("wpn-halo", "circle-radius", [
      "case",
      ["==", ["get", "id"], selectedId ?? ""],
      20,
      15,
    ]);
    map.setPaintProperty("wpn-circle", "circle-radius", [
      "case",
      ["==", ["get", "id"], selectedId ?? ""],
      14,
      12,
    ]);
  }
}

type Props = {
  filter: MapFilter;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function WeaponMap({ filter, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [mode, setMode] = useState<MapMode>("satellite");
  const [query, setQuery] = useState("");
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const visible = useMemo(() => weapons.filter((w) => matchesFilter(w, filter)), [filter]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    ensureMapWorker();

    const map = new MapLibreMap({
      container: containerRef.current,
      style: buildBaseStyle(mode),
      center: [106.815, -6.245],
      zoom: 12.4,
      pitch: 18,
      bearing: -3,
      attributionControl: { compact: true },
    });
    map.addControl(new ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left");
    mapRef.current = map;

    const onClick = (e: MapLayerMouseEvent) => {
      const id = e.features?.[0]?.properties?.id as string | undefined;
      if (id) onSelectRef.current(id);
    };

    map.on("load", () => {
      hydrate(map, weapons.filter((w) => matchesFilter(w, filter)), selectedId);
      map.on("click", "wpn-circle", onClick);
      map.on("click", "wpn-icons", onClick);
      map.on("mouseenter", "wpn-circle", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "wpn-circle", () => {
        map.getCanvas().style.cursor = "";
      });
      map.resize();
    });

    const ro = new ResizeObserver(() => map.resize());
    if (containerRef.current.parentElement) ro.observe(containerRef.current.parentElement);

    return () => {
      ro.disconnect();
      map.off("click", "wpn-circle", onClick);
      map.off("click", "wpn-icons", onClick);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(buildBaseStyle(mode));
    map.once("style.load", () => hydrate(map, visible, selectedId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    hydrate(map, visible, selectedId);
  }, [visible, selectedId]);

  return (
    <div className="wpn-map">
      <div ref={containerRef} className="maplibre-root" />
      <div className="wpn-map-search">
        <Icon name="search" size={14} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search location..."
        />
      </div>
      <div className="tf-layers-wrap wpn-map-layers">
        <button type="button" className="cmd-map-chip">
          <Icon name="layers" size={14} /> Layers
        </button>
      </div>
      <div className="tf-side-tools wpn-map-tools">
        <button type="button" aria-label="Settings">
          <Icon name="settings" size={15} />
        </button>
        <button type="button" aria-label="Target">
          <Icon name="crosshair" size={15} />
        </button>
        <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn({ duration: 200 })}>
          <Icon name="plus" size={16} />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut({ duration: 200 })}>
          −
        </button>
        <button type="button" aria-label="Fullscreen">
          <Icon name="monitor" size={15} />
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
