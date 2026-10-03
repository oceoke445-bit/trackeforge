"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  ScaleControl,
  setWorkerUrl,
  type Map,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Icon from "@/components/ui/icon";
import { personnel, type PersonnelStatus } from "@/app/(platform)/components/command-data";
import { registerMapIcons } from "./icons";
import {
  INTERACTIVE_LAYERS,
  LAYER_GROUPS,
  addOperationalLayers,
  ensureTerrainSource,
  setGroupVisibility,
  setPersonnelStatusFilter,
  type LayerGroupId,
} from "./layers";
import { MAP_CAMERA, TERRAIN_STATE, buildBaseStyle, type MapMode } from "./styles";

let workerReady = false;
function ensureMapWorker() {
  if (workerReady || typeof window === "undefined") return;
  setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.mjs");
  workerReady = true;
}

type PopupState = {
  id: string;
  name: string;
  status: string;
  hr: number | null;
  temperature: number | null;
  battery: number | null;
  kind: "personnel" | "weapon" | "vehicle" | "gateway";
};

const defaultVisibility = Object.fromEntries(LAYER_GROUPS.map((group) => [group.id, group.defaultOn])) as Record<
  LayerGroupId,
  boolean
>;

function applyVisibility(map: Map, visibility: Record<LayerGroupId, boolean>) {
  for (const group of LAYER_GROUPS) {
    setGroupVisibility(map, group.id, visibility[group.id]);
  }
}

function hydrateMap(map: Map, mode: MapMode, visibility: Record<LayerGroupId, boolean>) {
  ensureTerrainSource(map);
  registerMapIcons(map);
  addOperationalLayers(map);
  applyVisibility(map, visibility);

  if (visibility.terrain && map.getSource("terrain")) {
    map.setTerrain(mode === "dark" ? { source: "terrain", exaggeration: 0.35 } : TERRAIN_STATE);
  } else {
    map.setTerrain(null);
  }
}

export default function TraxonMap({
  selected,
  onSelect,
  statusFilter = "all",
}: {
  selected: number;
  onSelect: (n: number) => void;
  statusFilter?: "all" | PersonnelStatus;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const selectedRef = useRef(selected);
  const onSelectRef = useRef(onSelect);
  const [mode, setMode] = useState<MapMode>("terrain");
  const [query, setQuery] = useState("");
  const [layersOpen, setLayersOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | PersonnelStatus>(statusFilter);
  const [visibility, setVisibility] = useState(defaultVisibility);
  const visibilityRef = useRef(visibility);
  const filterRef = useRef(filter);
  const [popup, setPopup] = useState<PopupState | null>(null);

  selectedRef.current = selected;
  onSelectRef.current = onSelect;
  visibilityRef.current = visibility;
  filterRef.current = filter;

  const counts = useMemo(
    () => ({
      online: personnel.filter((p) => p.status === "online").length,
      alert: personnel.filter((p) => p.status === "warning" || p.status === "critical").length,
      offline: personnel.filter((p) => p.status === "offline").length,
      total: personnel.length,
    }),
    [],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    ensureMapWorker();

    const map = new MapLibreMap({
      container: containerRef.current,
      style: buildBaseStyle(mode),
      center: MAP_CAMERA.center,
      zoom: MAP_CAMERA.zoom,
      pitch: MAP_CAMERA.pitch,
      bearing: MAP_CAMERA.bearing,
      maxPitch: MAP_CAMERA.maxPitch,
      attributionControl: { compact: true },
    });

    map.addControl(new ScaleControl({ maxWidth: 110, unit: "metric" }), "bottom-left");
    mapRef.current = map;

    map.on("load", () => {
      hydrateMap(map, mode, visibilityRef.current);
      setPersonnelStatusFilter(map, filterRef.current === "all" ? "all" : filterRef.current);
      map.resize();
    });

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    if (containerRef.current.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }

    const onClick = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature || feature.geometry.type !== "Point") return;
      const props = feature.properties ?? {};
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      const id = String(props.id ?? "");
      const personIndex = personnel.findIndex((item) => item.id === id);

      if (personIndex >= 0) {
        onSelectRef.current(personIndex);
        const person = personnel[personIndex];
        setPopup({
          id: person.id,
          name: person.name,
          status: person.status,
          hr: person.hr,
          temperature: person.temp,
          battery: person.battery,
          kind: "personnel",
        });
        map.easeTo({ center: [lng, lat], duration: 450 });
        return;
      }

      setPopup({
        id,
        name: String(props.label ?? props.id ?? "Asset"),
        status: String(props.status ?? "online"),
        hr: null,
        temperature: null,
        battery: null,
        kind: feature.source === "weapons" ? "weapon" : feature.source === "vehicles" ? "vehicle" : "gateway",
      });
    };

    const onMove = (event: MapLayerMouseEvent) => {
      map.getCanvas().style.cursor = event.features?.length ? "pointer" : "";
    };

    const onLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    for (const layerId of INTERACTIVE_LAYERS) {
      map.on("click", layerId, onClick);
      map.on("mousemove", layerId, onMove);
      map.on("mouseleave", layerId, onLeave);
    }

    return () => {
      resizeObserver.disconnect();
      for (const layerId of INTERACTIVE_LAYERS) {
        map.off("click", layerId, onClick);
        map.off("mousemove", layerId, onMove);
        map.off("mouseleave", layerId, onLeave);
      }
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
      hydrateMap(map, mode, visibilityRef.current);
      setPersonnelStatusFilter(map, filterRef.current === "all" ? "all" : filterRef.current);
    });
  }, [mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    applyVisibility(map, visibility);
  }, [visibility]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("personnel-status")) return;
    const next = filter === "warning" ? "warning" : filter;
    // "alert" UI maps to both warning+critical via custom handling
    if (filter === "all") setPersonnelStatusFilter(map, "all");
    else if (filter === "online" || filter === "offline") setPersonnelStatusFilter(map, filter);
    else {
      // warning filter shows warning + critical
      const alertFilter = ["in", ["get", "status"], ["literal", ["warning", "critical"]]] as never;
      for (const layerId of ["personnel-halo", "personnel-status", "personnel-icons"]) {
        if (map.getLayer(layerId)) map.setFilter(layerId, alertFilter);
      }
    }
    void next;
  }, [filter]);

  useEffect(() => {
    const map = mapRef.current;
    const person = personnel[selected];
    if (!person) return;

    setPopup({
      id: person.id,
      name: person.name,
      status: person.status,
      hr: person.hr,
      temperature: person.temp,
      battery: person.battery,
      kind: "personnel",
    });

    if (!map || !map.getSource("personnel")) return;
    for (const item of personnel) {
      map.setFeatureState({ source: "personnel", id: item.id }, { selected: item.id === person.id });
    }
  }, [selected]);

  function toggleGroup(id: LayerGroupId) {
    setVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function searchAndFly() {
    const map = mapRef.current;
    if (!map || !query.trim()) return;
    const q = query.trim().toLowerCase();
    const person = personnel.find(
      (item) => item.id.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.squad.toLowerCase().includes(q),
    );
    if (!person) return;
    onSelect(personnel.indexOf(person));
    map.flyTo({ center: [person.lng, person.lat], zoom: 14.2, pitch: 36, duration: 1100 });
  }

  function toggleFullscreen() {
    const root = containerRef.current?.parentElement;
    if (!root) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else root.requestFullscreen?.();
  }

  const statusLabel =
    popup?.status === "critical"
      ? "Critical"
      : popup?.status === "warning"
        ? "Warning"
        : popup?.status === "offline"
          ? "Offline"
          : popup?.status === "online"
            ? "Online"
            : popup?.status ?? "";

  return (
    <div className="map-canvas cmd-map tf-map">
      <div className="tf-topbar">
        <div className="tf-top-left">
          <button type="button" className="cmd-map-select">
            All Personnel ({counts.total})
            <Icon name="chevron" size={13} />
          </button>
          <div className="tf-status-pills">
            <button type="button" className={`tf-pill online${filter === "online" ? " on" : ""}`} onClick={() => setFilter(filter === "online" ? "all" : "online")}>
              <i /> Online {counts.online}
            </button>
            <button type="button" className={`tf-pill alert${filter === "warning" ? " on" : ""}`} onClick={() => setFilter(filter === "warning" ? "all" : "warning")}>
              <i /> Alert {counts.alert}
            </button>
            <button type="button" className={`tf-pill offline${filter === "offline" ? " on" : ""}`} onClick={() => setFilter(filter === "offline" ? "all" : "offline")}>
              <i /> Offline {counts.offline}
            </button>
          </div>
        </div>

        <div className="tf-top-right">
          <label className="cmd-map-search">
            <Icon name="search" size={14} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchAndFly()}
              placeholder="Search location..."
            />
          </label>
          <div className="tf-layers-wrap">
            <button type="button" className="cmd-map-chip" onClick={() => setLayersOpen((v) => !v)}>
              <Icon name="layers" size={14} />
              Layers
              <Icon name="chevron" size={12} />
            </button>
            {layersOpen && (
              <div className="tf-layers-panel" role="dialog" aria-label="Map layers">
                <strong>MAP LAYERS</strong>
                {LAYER_GROUPS.map((group) => (
                  <label key={group.id}>
                    <input type="checkbox" checked={visibility[group.id]} onChange={() => toggleGroup(group.id)} />
                    <span>{group.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <button type="button" className="tf-icon-btn" aria-label="Fullscreen" onClick={toggleFullscreen}>
            <Icon name="monitor" size={15} />
          </button>
          <button
            type="button"
            className="tf-icon-btn"
            aria-label="Recenter"
            onClick={() =>
              mapRef.current?.easeTo({
                center: MAP_CAMERA.center,
                zoom: MAP_CAMERA.zoom,
                pitch: MAP_CAMERA.pitch,
                bearing: MAP_CAMERA.bearing,
                duration: 500,
              })
            }
          >
            <Icon name="pin" size={15} />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="maplibre-root" />

      {popup && (
        <div className={`cmd-map-popup tf-popup${popup.status === "critical" ? " critical" : ""}`}>
          <div className="cmd-map-popup-head">
            <span className="cmd-avatar">{popup.id.replace(/\D/g, "").slice(-2) || "TF"}</span>
            <div>
              <strong>{popup.id}</strong>
              <small>{popup.name}</small>
            </div>
            <em className={popup.status}>{statusLabel}</em>
          </div>
          {popup.kind === "personnel" ? (
            <div className="cmd-map-popup-stats">
              <span>
                <small>HR</small>
                <strong className="hr">
                  {popup.hr ?? "—"}
                  {popup.hr ? " BPM" : ""}
                </strong>
              </span>
              <span>
                <small>Temp</small>
                <strong className="temp">
                  {popup.temperature ?? "—"}
                  {popup.temperature ? " °C" : ""}
                </strong>
              </span>
              <span>
                <small>Battery</small>
                <strong className="bat">
                  {popup.battery ?? "—"}
                  {popup.battery != null ? "%" : ""}
                </strong>
              </span>
            </div>
          ) : (
            <p className="tf-popup-note">
              {popup.kind[0].toUpperCase() + popup.kind.slice(1)} · {statusLabel || popup.status}
            </p>
          )}
        </div>
      )}

      <div className="tf-side-tools">
        <button type="button" aria-label="Settings">
          <Icon name="settings" size={16} />
        </button>
        <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn({ duration: 200 })}>
          <Icon name="plus" size={17} />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut({ duration: 200 })}>
          −
        </button>
        <button type="button" aria-label="Layers" onClick={() => setLayersOpen((v) => !v)}>
          <Icon name="layers" size={16} />
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
