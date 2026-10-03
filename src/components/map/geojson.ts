import { personnel } from "@/app/(platform)/components/command-data";

export const personnelGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: personnel.map((person) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [person.lng, person.lat] },
    properties: {
      id: person.id,
      name: person.name,
      status: person.status,
      squad: person.squad,
      hr: person.hr,
      temperature: person.temp,
      battery: person.battery,
      lastSeen: person.lastSeen,
      alert: person.status === "critical" || person.status === "warning",
    },
  })),
};

export const weaponsGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { id: "W-101", status: "connected", label: "Rifle Alpha" }, geometry: { type: "Point", coordinates: [106.804, -6.244] } },
    { type: "Feature", properties: { id: "W-118", status: "connected", label: "Rifle Bravo" }, geometry: { type: "Point", coordinates: [106.821, -6.247] } },
    { type: "Feature", properties: { id: "W-221", status: "low_battery", label: "Optics Kit" }, geometry: { type: "Point", coordinates: [106.833, -6.256] } },
    { type: "Feature", properties: { id: "W-304", status: "disconnected", label: "Sidearm" }, geometry: { type: "Point", coordinates: [106.795, -6.261] } },
  ],
};

export const vehiclesGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { id: "V-01", status: "online", label: "APC-01" }, geometry: { type: "Point", coordinates: [106.79, -6.236] } },
    { type: "Feature", properties: { id: "V-02", status: "idle", label: "Truck-04" }, geometry: { type: "Point", coordinates: [106.852, -6.263] } },
    { type: "Feature", properties: { id: "V-03", status: "online", label: "Scout-02" }, geometry: { type: "Point", coordinates: [106.815, -6.268] } },
  ],
};

export const gatewaysGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { id: "GW-001", status: "online", label: "Gateway North" }, geometry: { type: "Point", coordinates: [106.788, -6.228] } },
    { type: "Feature", properties: { id: "GW-002", status: "online", label: "Gateway Hub" }, geometry: { type: "Point", coordinates: [106.838, -6.248] } },
  ],
};

/** Large green operation / friendly zone */
export const geofenceGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: "GF-01", label: "Zone Alpha", tone: "green" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [106.778, -6.22],
            [106.818, -6.218],
            [106.828, -6.242],
            [106.808, -6.258],
            [106.778, -6.252],
            [106.778, -6.22],
          ],
        ],
      },
    },
  ],
};

/** Blue coverage / secondary operational zone */
export const coverageGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: "COV-01", label: "Zone Bravo", tone: "blue" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [106.82, -6.235],
            [106.868, -6.232],
            [106.872, -6.272],
            [106.83, -6.278],
            [106.812, -6.258],
            [106.82, -6.235],
          ],
        ],
      },
    },
  ],
};

export const restrictedAreaGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: "RA-01", label: "⚠ Restricted Area" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [106.842, -6.222],
            [106.875, -6.22],
            [106.878, -6.245],
            [106.852, -6.252],
            [106.838, -6.24],
            [106.842, -6.222],
          ],
        ],
      },
    },
  ],
};

export const operationBoundaryGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: "OB-01", label: "Operation Boundary" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [106.77, -6.21],
            [106.885, -6.212],
            [106.888, -6.285],
            [106.768, -6.288],
            [106.77, -6.21],
          ],
        ],
      },
    },
  ],
};

export const personnelTrackGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: "S-014", kind: "personnel" },
      geometry: {
        type: "LineString",
        coordinates: [
          [106.8, -6.268],
          [106.804, -6.262],
          [106.808, -6.258],
          [106.812, -6.255],
        ],
      },
    },
  ],
};

export const squadTrackGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: "SQ-ALPHA", kind: "squad" },
      geometry: {
        type: "LineString",
        coordinates: [
          [106.79, -6.245],
          [106.798, -6.24],
          [106.805, -6.246],
          [106.812, -6.243],
        ],
      },
    },
  ],
};

export const alertsGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: personnel
    .filter((person) => person.status === "critical" || person.status === "warning")
    .map((person) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [person.lng, person.lat] },
      properties: {
        id: person.id,
        level: person.status === "critical" ? "critical" : "warning",
        title: person.status === "critical" ? "SOS / Critical" : "Warning",
      },
    })),
};
