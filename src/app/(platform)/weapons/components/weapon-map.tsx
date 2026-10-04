"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

/** Clear side-profile gun shapes (stock → receiver → barrel → mag → grip). */
function weaponGlyph(type: WeaponAsset["type"]) {
  if (type === "Pistol") {
    return [
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">',
      '<path fill="#fff" d="M4.8 7.2h12.6l1.8 1.4v3.6H4.8z"/>',
      '<path fill="#fff" d="M4.8 12.2h4.4L8.2 20H5.6c-.5 0-.9-.4-.8-.9L6 12.2z"/>',
      '<path fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" d="M9.4 12.2v2.4c0 1.3 1.1 2 2.3 1.5"/>',
      '<rect x="14.6" y="5.8" width="1.5" height="1.6" fill="#fff"/>',
      "</svg>",
    ].join("");
  }

  if (type === "DMR" || type === "Sniper Rifle") {
    return [
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">',
      // stock
      '<path fill="#fff" d="M1.5 10.1 5.2 9.4l1.2 1.6v2.5l-1.4 1-3.5.9z"/>',
      // receiver
      '<path fill="#fff" d="M5.8 9.2h7.6l.7 1.5v2.4l-.9 1.3H6.4l-.6-1.3z"/>',
      // long barrel + muzzle
      '<rect x="13.4" y="10.55" width="8.2" height="1.55" rx=".35" fill="#fff"/>',
      '<rect x="21" y="10.15" width="1.7" height="2.35" rx=".3" fill="#fff"/>',
      // front sight
      '<rect x="17.4" y="8.1" width="1.15" height="2.7" fill="#fff"/>',
      // scope body
      '<rect x="8" y="6.5" width="5" height="2.7" rx=".55" fill="#fff"/>',
      '<circle cx="9.1" cy="7.85" r=".75" fill="#0b1a14"/>',
      '<circle cx="12" cy="7.85" r=".75" fill="#0b1a14"/>',
      // magazine + grip
      '<path fill="#fff" d="M8.8 14.4h2.5l.55 5.3H8.5z"/>',
      '<path fill="#fff" d="M6.2 14.4h2.3l-.65 4.9H5.7z"/>',
      "</svg>",
    ].join("");
  }

  // Assault rifle / LMG / shotgun
  return [
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">',
    // stock
    '<path fill="#fff" d="M1.4 10.2 5.3 9.5l1.25 1.65v2.55l-1.45 1.05-3.7.95z"/>',
    // receiver / handguard
    '<path fill="#fff" d="M5.9 9.3h8.4l.75 1.55v2.45l-.95 1.35H6.7L5.9 13.3z"/>',
    // barrel + muzzle brake
    '<rect x="14.3" y="10.7" width="6.6" height="1.5" rx=".35" fill="#fff"/>',
    '<rect x="20.5" y="10.3" width="1.8" height="2.3" rx=".3" fill="#fff"/>',
    // front sight
    '<rect x="17.1" y="8.15" width="1.2" height="2.8" fill="#fff"/>',
    // carry handle / optic
    '<path fill="#fff" d="M8.5 7.45h4.4v2H8.5z"/>',
    '<path fill="none" stroke="#fff" stroke-width="1.55" stroke-linecap="round" d="M9.1 7.45c1.15-1.55 2.85-1.55 4 0"/>',
    // magazine + pistol grip
    '<path fill="#fff" d="M9.1 14.6h2.55l.6 5.45H8.8z"/>',
    '<path fill="#fff" d="M6.35 14.6h2.45l-.7 5.05H5.8z"/>',
    "</svg>",
  ].join("");
}

function weaponMarkerElement(
  weapon: WeaponAsset,
  onSelect: (id: string) => void,
) {
  const root = document.createElement("div");
  root.className = `mesh-node weapon status-${weapon.status}`;
  root.innerHTML = `<span class="mesh-node-dot">${weaponGlyph(weapon.type)}</span><span class="mesh-node-card"><strong>${weapon.id}</strong><small>${statusLabel(weapon.status)}</small></span>`;
  root.addEventListener("click", (event) => {
    event.stopPropagation();
    onSelect(weapon.id);
  });
  return root;
}

function hydrateLayers(map: Map) {
  registerMapIcons(map);

  const upsert = (id: string, data: GeoJSON.FeatureCollection) => {
    const source = map.getSource(id) as GeoJSONSource | undefined;
    if (source) source.setData(data);
    else map.addSource(id, { type: "geojson", data });
  };

  upsert("wpn-area", AREA_GREEN);
  upsert("wpn-restricted", AREA_RESTRICTED);

  if (map.getLayer("wpn-area-line")) map.removeLayer("wpn-area-line");

  if (!map.getLayer("wpn-area-fill")) {
    map.addLayer({
      id: "wpn-area-fill",
      type: "fill",
      source: "wpn-area",
      paint: { "fill-color": "#00D99A", "fill-opacity": 0.12 },
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
  }
}

function syncWeaponMarkers(
  map: Map,
  list: WeaponAsset[],
  markersRef: { current: Marker[] },
  onSelect: (id: string) => void,
) {
  for (const marker of markersRef.current) marker.remove();
  markersRef.current = [];

  for (const weapon of list) {
    const el = weaponMarkerElement(weapon, onSelect);
    const marker = new Marker({ element: el, anchor: "center" })
      .setLngLat([weapon.lng, weapon.lat])
      .addTo(map);
    markersRef.current.push(marker);
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
  const markersRef = useRef<Marker[]>([]);
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
      attributionControl: false,
    });
    mapRef.current = map;

    map.on("load", () => {
      hydrateLayers(map);
      syncWeaponMarkers(map, weapons.filter((w) => matchesFilter(w, filter)), markersRef, (id) =>
        onSelectRef.current(id),
      );
      map.resize();
    });

    const ro = new ResizeObserver(() => map.resize());
    if (containerRef.current.parentElement) ro.observe(containerRef.current.parentElement);

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
      hydrateLayers(map);
      syncWeaponMarkers(map, visible, markersRef, (id) => onSelectRef.current(id));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    hydrateLayers(map);
    syncWeaponMarkers(map, visible, markersRef, (id) => onSelectRef.current(id));
  }, [visible]);

  useEffect(() => {
    for (const marker of markersRef.current) {
      const el = marker.getElement();
      const id = el.querySelector("strong")?.textContent;
      el.classList.toggle("is-selected", Boolean(selectedId && id === selectedId));
    }
  }, [selectedId, visible]);

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
      <div className="tf-side-tools wpn-map-tools">
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
