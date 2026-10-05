export type Severity = "critical" | "warning" | "info";
export type AlertType =
  | "SOS"
  | "Casualty"
  | "Arrhythmia"
  | "Low Battery"
  | "Heat Stress"
  | "Strap Disconnected"
  | "No Contact";
export type GroupName = "Alpha" | "Bravo" | "Charlie" | "Delta";

export type AlertItem = {
  id: string;
  apiId?: number;
  apiStatus?: string;
  minutesAgo: number;
  date: string;
  clock: string;
  severity: Severity;
  type: AlertType;
  soldier: string;
  group: string;
  details: string;
  position: string;
  lastSeen: string;
  lng: number;
  lat: number;
  status: string;
  battery: string;
  hr: string | null;
  hrv: string | null;
  temp: string | null;
};

export const ALERT_TYPES: AlertType[] = [
  "SOS",
  "Casualty",
  "Arrhythmia",
  "Low Battery",
  "Heat Stress",
  "Strap Disconnected",
  "No Contact",
];

export const GROUPS: GroupName[] = ["Alpha", "Bravo", "Charlie", "Delta"];

const TEMPLATE: Record<AlertType, { severity: Severity; details: string; position: string; lastSeen: string }> = {
  SOS: { severity: "critical", details: "SOS button pressed", position: "GNSS (±12 m)", lastSeen: "2 minutes ago" },
  Casualty: { severity: "critical", details: "No movement detected (algorithm)", position: "GNSS (±15 m)", lastSeen: "5 minutes ago" },
  Arrhythmia: { severity: "critical", details: "Irregular heart rhythm detected", position: "GNSS (±15 m)", lastSeen: "3 minutes ago" },
  "Low Battery": { severity: "warning", details: "Device battery low", position: "Mesh (RSSI)", lastSeen: "12 minutes ago" },
  "Heat Stress": { severity: "warning", details: "Body temperature high threshold", position: "GNSS (±20 m)", lastSeen: "8 minutes ago" },
  "Strap Disconnected": { severity: "info", details: "Chest strap disconnected", position: "GNSS (±25 m)", lastSeen: "18 minutes ago" },
  "No Contact": { severity: "info", details: "No data received for > 30 minutes", position: "Last seen (N/A)", lastSeen: "30 minutes ago" },
};

function stamp(minutesAgo: number) {
  const base = 3 * 24 * 60 + 22 * 60 + 41 - minutesAgo;
  const day = Math.floor(base / (24 * 60));
  const mins = ((base % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour = Math.floor(mins / 60);
  const minute = mins % 60;
  return {
    date: `${String(day).padStart(2, "0")} Oct 2026`,
    clock: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

function make(
  index: number,
  type: AlertType,
  group: GroupName,
  soldier: string,
  minutesAgo: number,
  extra?: Partial<AlertItem>,
): AlertItem {
  const template = TEMPLATE[type];
  const when = stamp(minutesAgo);
  return {
    id: `AL-20261003-${String(index).padStart(3, "0")}`,
    minutesAgo,
    date: when.date,
    clock: when.clock,
    severity: template.severity,
    type,
    soldier,
    group,
    details: template.details,
    position: template.position,
    lastSeen: template.lastSeen,
    lng: 106.8456 + (index % 7) * 0.004,
    lat: -6.2081 - (index % 5) * 0.003,
    status: "Active",
    battery: "62% (3.8 V)",
    hr: type === "SOS" || type === "Arrhythmia" || type === "Casualty" ? "142 bpm" : null,
    hrv: type === "SOS" || type === "Arrhythmia" ? "28 ms" : null,
    temp: type === "SOS" || type === "Heat Stress" ? "38.6 °C" : null,
    ...extra,
  };
}

const featured: AlertItem[] = [
  make(1, "SOS", "Alpha", "S-04", 3, { details: "SOS button pressed", position: "GNSS (±12 m)", lastSeen: "2 minutes ago", lng: 106.8456, lat: -6.2081, battery: "62% (3.8 V)", hr: "142 bpm", hrv: "28 ms", temp: "38.6 °C" }),
  make(2, "Casualty", "Alpha", "S-01", 20, { details: "No movement detected (algorithm)", position: "GNSS (±15 m)", lastSeen: "5 minutes ago" }),
  make(3, "Arrhythmia", "Bravo", "S-03", 45, { details: "Irregular heart rhythm detected", position: "GNSS (±15 m)", lastSeen: "3 minutes ago" }),
  make(4, "Low Battery", "Bravo", "S-07", 59, { details: "Device battery 18%", position: "Mesh (RSSI)", lastSeen: "12 minutes ago", battery: "18% (3.4 V)", hr: null, hrv: null, temp: null }),
  make(5, "Heat Stress", "Charlie", "S-06", 143, { details: "Body temperature high threshold", position: "GNSS (±20 m)", lastSeen: "8 minutes ago" }),
  make(6, "Strap Disconnected", "Charlie", "S-08", 188, { details: "Chest strap disconnected", position: "GNSS (±25 m)", lastSeen: "18 minutes ago", hr: null, hrv: null, temp: null }),
  make(7, "No Contact", "Alpha", "S-02", 254, { details: "No data received for > 30 minutes", position: "Last seen 18:26", lastSeen: "(N/A)", hr: null, hrv: null, temp: null }),
  make(8, "Low Battery", "Delta", "S-05", 397, { details: "Device battery 20%", position: "Mesh (RSSI)", lastSeen: "12 minutes ago", battery: "20% (3.5 V)", hr: null, hrv: null, temp: null }),
  make(9, "No Contact", "Delta", "S-09", 499, { details: "No data received for > 30 minutes", position: "Last seen 14:21", lastSeen: "(N/A)", hr: null, hrv: null, temp: null }),
  make(10, "Strap Disconnected", "Bravo", "S-10", 630, { details: "Chest strap disconnected", position: "GNSS (±30 m)", lastSeen: "18 minutes ago", hr: null, hrv: null, temp: null }),
];

const extraPlan: { type: AlertType; group: GroupName }[] = [
  ...Array.from({ length: 2 }, () => ({ type: "SOS" as const, group: "Alpha" as const })),
  { type: "Arrhythmia", group: "Bravo" },
  ...Array.from({ length: 3 }, () => ({ type: "Low Battery" as const, group: "Alpha" as const })),
  ...Array.from({ length: 2 }, () => ({ type: "Low Battery" as const, group: "Charlie" as const })),
  ...Array.from({ length: 2 }, () => ({ type: "Heat Stress" as const, group: "Bravo" as const })),
  ...Array.from({ length: 2 }, () => ({ type: "Heat Stress" as const, group: "Delta" as const })),
  ...Array.from({ length: 2 }, () => ({ type: "Strap Disconnected" as const, group: "Charlie" as const })),
  ...Array.from({ length: 4 }, () => ({ type: "No Contact" as const, group: "Alpha" as const })),
  ...Array.from({ length: 3 }, () => ({ type: "No Contact" as const, group: "Bravo" as const })),
  ...Array.from({ length: 2 }, () => ({ type: "No Contact" as const, group: "Charlie" as const })),
  ...Array.from({ length: 3 }, () => ({ type: "No Contact" as const, group: "Delta" as const })),
];

const extras = extraPlan.map((item, index) =>
  make(11 + index, item.type, item.group, `S-${String(11 + index).padStart(2, "0")}`, 700 + index * 90),
);

export const ALERTS: AlertItem[] = [...featured, ...extras].sort((a, b) => a.minutesAgo - b.minutesAgo);

export function matchesRange(minutesAgo: number, range: "all" | "30d") {
  if (range === "all") return true;
  return minutesAgo <= 30 * 24 * 60;
}
