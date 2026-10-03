export type MeshQuality = "excellent" | "good" | "fair" | "poor";

export type MeshNode = {
  id: string;
  kind: "soldier" | "gateway";
  lng: number;
  lat: number;
  rssi: number;
  snr: number;
  hops: number;
  battery: number;
  lastSeen: string;
};

export const MESH_NODES: MeshNode[] = [
  { id: "GW-01", kind: "gateway", lng: 106.812, lat: -6.262, rssi: 0, snr: 0, hops: 0, battery: 100, lastSeen: "22:41:13" },
  { id: "S-01", kind: "soldier", lng: 106.822, lat: -6.236, rssi: -76, snr: 9.1, hops: 1, battery: 82, lastSeen: "22:41:12" },
  { id: "S-02", kind: "soldier", lng: 106.806, lat: -6.228, rssi: -78, snr: 8.2, hops: 1, battery: 76, lastSeen: "22:41:10" },
  { id: "S-03", kind: "soldier", lng: 106.79, lat: -6.242, rssi: -85, snr: 6.1, hops: 2, battery: 68, lastSeen: "22:41:08" },
  { id: "S-04", kind: "soldier", lng: 106.808, lat: -6.246, rssi: -82, snr: 7.4, hops: 2, battery: 71, lastSeen: "22:41:11" },
  { id: "S-06", kind: "soldier", lng: 106.836, lat: -6.244, rssi: -87, snr: 5.9, hops: 3, battery: 60, lastSeen: "22:41:09" },
  { id: "S-07", kind: "soldier", lng: 106.824, lat: -6.254, rssi: -89, snr: 5.2, hops: 3, battery: 55, lastSeen: "22:41:07" },
  { id: "S-08", kind: "soldier", lng: 106.782, lat: -6.254, rssi: -80, snr: 7.1, hops: 2, battery: 74, lastSeen: "22:41:13" },
];

export const SOLDIER_NODES = MESH_NODES.filter((node) => node.kind === "soldier");

export const MESH_LINKS: { from: string; to: string; quality: MeshQuality }[] = [
  { from: "S-02", to: "S-01", quality: "excellent" },
  { from: "S-02", to: "S-04", quality: "excellent" },
  { from: "S-02", to: "S-03", quality: "good" },
  { from: "S-03", to: "S-08", quality: "excellent" },
  { from: "S-03", to: "S-04", quality: "good" },
  { from: "S-08", to: "S-04", quality: "excellent" },
  { from: "S-04", to: "S-01", quality: "good" },
  { from: "S-04", to: "GW-01", quality: "excellent" },
  { from: "S-01", to: "S-06", quality: "good" },
  { from: "S-01", to: "S-07", quality: "poor" },
  { from: "S-04", to: "S-07", quality: "good" },
  { from: "S-06", to: "S-07", quality: "poor" },
  { from: "S-07", to: "GW-01", quality: "poor" },
  { from: "S-08", to: "GW-01", quality: "fair" },
];

export const MATRIX_IDS = ["GW-01", "S-01", "S-02", "S-03", "S-04", "S-06", "S-07", "S-08"] as const;

export const RSSI_MATRIX: (number | null)[][] = [
  [null, -76, -78, -85, -82, -87, -89, -80],
  [-76, null, -72, -80, -84, -91, -94, -81],
  [-78, -72, null, -86, -89, -88, -90, -76],
  [-85, -86, -80, null, -73, -82, -85, -83],
  [-82, -84, -79, -73, null, -80, -86, -78],
  [-87, -91, -88, -82, -80, null, -77, -85],
  [-89, -94, -90, -85, -86, -77, null, -82],
  [-80, -81, -76, -83, -78, -85, -82, null],
];

export const FLOW_POINTS = Array.from({ length: 31 }, (_, index) => {
  const minute = 21 * 60 + 40 + index * 2;
  const hour = Math.floor(minute / 60);
  const mins = minute % 60;
  const received = Math.round(46 + 48 * Math.abs(Math.sin(index * 0.55)) + (index % 4) * 3);
  const relayed = Math.max(8, received - 6 - (index % 3));
  const dropped = index % 6 === 0 ? 14 + (index % 5) : index % 3 === 0 ? 6 : 2;
  return {
    label: `${hour}:${String(mins).padStart(2, "0")}`,
    received: Math.min(received, 100),
    relayed: Math.min(relayed, 96),
    dropped,
  };
});

export function rssiCell(value: number) {
  if (value > -72) return { background: "#3dd68c", color: "#052e16" };
  if (value > -78) return { background: "#a3e635", color: "#1a2e05" };
  if (value > -84) return { background: "#f5d90a", color: "#1c1403" };
  if (value > -88) return { background: "#f59e0b", color: "#1c1403" };
  if (value > -92) return { background: "#f97316", color: "#1c0a02" };
  return { background: "#ef4444", color: "#fff7f7" };
}

export function batteryColor(value: number) {
  if (value >= 75) return "#34d399";
  if (value >= 65) return "#a3e635";
  if (value >= 60) return "#fbbf24";
  return "#f97316";
}
