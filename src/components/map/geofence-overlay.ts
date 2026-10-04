import type { GeoJSONSource, Map } from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import { fetchGeofences, GEOFENCE_CHANGED } from "@/lib/geofences";
import type { GeofenceZone } from "@/app/(platform)/groups/components/geofence-data";

function overlayData(zones: GeofenceZone[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: zones.map((zone) => ({
      type: "Feature" as const,
      properties: {
        color: zone.status === "active" ? "#f59e0b" : "#94a3b8",
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [zone.polygon ?? []],
      },
    })),
  };
}

function paint(map: Map, zones: GeofenceZone[]) {
  if (!map.isStyleLoaded()) return;
  const data = overlayData(zones);
  const source = map.getSource("saved-gfn") as GeoJSONSource | undefined;
  if (source) source.setData(data);
  else map.addSource("saved-gfn", { type: "geojson", data });

  if (!map.getLayer("saved-gfn-fill")) {
    map.addLayer({
      id: "saved-gfn-fill",
      type: "fill",
      source: "saved-gfn",
      paint: { "fill-color": ["get", "color"], "fill-opacity": 0.22 },
    });
    map.addLayer({
      id: "saved-gfn-line",
      type: "line",
      source: "saved-gfn",
      paint: {
        "line-color": ["get", "color"],
        "line-width": 2.4,
        "line-dasharray": [2.4, 1.8],
      },
    });
  }
}

/** Draw saved live geofences on any map. Mock zones stay on the Geofence page only. */
export function bindGeofenceOverlay(map: Map) {
  let zones: GeofenceZone[] = [];
  let dropped = false;

  const draw = () => {
    if (!dropped) paint(map, zones);
  };
  const refresh = () => {
    fetchGeofences()
      .then((next) => {
        if (dropped) return;
        zones = next;
        draw();
      })
      .catch(() => undefined);
  };

  map.on("load", draw);
  map.on("style.load", draw);
  window.addEventListener(GEOFENCE_CHANGED, refresh);
  refresh();

  return () => {
    dropped = true;
    map.off("load", draw);
    map.off("style.load", draw);
    window.removeEventListener(GEOFENCE_CHANGED, refresh);
  };
}
