import { personnel, type PersonnelStatus } from "@/app/(platform)/components/command-data";

export type PersonalEventType = "Movement" | "Vital" | "Equipment" | "System" | "Alert";

export type PersonalEvent = {
  id: string;
  time: string;
  type: PersonalEventType;
  details: string;
  lat: number;
  lng: number;
};

export type EquipmentItem = {
  id: string;
  name: string;
  status: "Connected" | "Disconnected" | "Low Battery";
  battery: number;
  tone: "cyan" | "green" | "amber";
};

export type PersonalProfile = {
  id: string;
  code: string;
  name: string;
  status: PersonnelStatus;
  unit: string;
  platoon: string;
  squad: string;
  danru: string;
  rank: string;
  role: string;
  callSign: string;
  bloodType: string;
  joinDate: string;
  movement: string;
  speed: number;
  battery: number | null;
  batteryEta: string;
  signal: number | null;
  signalLabel: string;
  elevation: number;
  lng: number;
  lat: number;
  hr: number | null;
  temp: number | null;
  resp: number | null;
  hrv: number | null;
  sparklines: {
    hr: number[];
    temp: number[];
    resp: number[];
    hrv: number[];
  };
  equipment: EquipmentItem[];
  events: PersonalEvent[];
};

const ranks = ["Sertu", "Kopda", "Praka", "Kopda", "Sertu", "Praka", "Kopda", "Praka", "Sertu", "Kopda", "Praka", "Kopda"];
const roles = ["Rifleman", "Rifleman", "Medic", "Rifleman", "Point Man", "Rifleman", "Comms", "Rifleman", "Fire Team Lead", "Rifleman", "Marksman", "Rifleman"];
const blood = ["O+", "A+", "B+", "O+", "AB+", "A+", "O-", "B+", "O+", "A+", "B-", "O+"];

function spark(base: number, amp: number, seed: number) {
  return Array.from({ length: 18 }, (_, i) => {
    const wave = Math.sin((i + seed) * 0.7) * amp;
    const noise = ((seed * 13 + i * 7) % 5) - 2;
    return Math.max(0, Math.round(base + wave + noise));
  });
}

function buildEvents(code: string, lat: number, lng: number): PersonalEvent[] {
  return [
    { id: `${code}-e1`, time: "14:28:12", type: "Movement", details: "Started walking", lat: lat + 0.0002, lng: lng - 0.0001 },
    { id: `${code}-e2`, time: "14:15:03", type: "Vital", details: "HR recovered to normal", lat, lng },
    { id: `${code}-e3`, time: "14:02:41", type: "Equipment", details: "Weapon Tag synced", lat: lat - 0.0001, lng: lng + 0.0002 },
    { id: `${code}-e4`, time: "13:48:20", type: "System", details: "Mesh hop path refreshed", lat, lng },
    { id: `${code}-e5`, time: "13:32:55", type: "Alert", details: "Signal dipped below −95 dBm", lat: lat + 0.0003, lng: lng + 0.0001 },
  ];
}

export const personalProfiles: PersonalProfile[] = personnel.map((person, index) => {
  const code = `P-${String(index + 3).padStart(2, "0")}`;
  const hr = person.hr ?? 76;
  const temp = person.temp ?? 36.5;
  const signal = person.status === "offline" ? null : -55 - (index % 8) * 5;
  const battery = person.battery;
  return {
    id: person.id,
    code,
    name: person.name,
    status: person.status,
    unit: `${person.squad} 1-${(index % 2) + 1}`,
    platoon: person.squad === "Alpha" || person.squad === "Bravo" ? "Bravo 1-1" : "Charlie 2-1",
    squad: `Regu ${(index % 3) + 1}`,
    danru: `R-0${(index % 4) + 1}`,
    rank: ranks[index % ranks.length],
    role: roles[index % roles.length],
    callSign: `${person.squad} 1-${(index % 2) + 1}`,
    bloodType: blood[index % blood.length],
    joinDate: `2024-0${(index % 9) + 1}-${String(10 + (index % 18)).padStart(2, "0")}`,
    movement: person.status === "offline" ? "Stationary" : index % 3 === 0 ? "Running" : index % 3 === 1 ? "Walking" : "Stationary",
    speed: person.status === "offline" ? 0 : index % 3 === 0 ? 6.1 : index % 3 === 1 ? 2.4 : 0.2,
    battery,
    batteryEta: battery == null ? "—" : battery > 70 ? "~18 h remaining" : battery > 40 ? "~9 h remaining" : "~3 h remaining",
    signal,
    signalLabel: signal == null ? "No Link" : signal > -75 ? "Excellent" : signal > -90 ? "Good" : "Weak",
    elevation: 380 + index * 7,
    lng: person.lng,
    lat: person.lat,
    hr: person.hr,
    temp: person.temp,
    resp: person.status === "offline" ? null : 14 + (index % 5),
    hrv: person.status === "offline" ? null : person.status === "warning" || person.status === "critical" ? 28 + (index % 6) : 40 + (index % 10),
    sparklines: {
      hr: spark(hr, person.status === "critical" ? 18 : 6, index + 1),
      temp: spark(Math.round(temp * 10), 2, index + 3).map((v) => v / 10),
      resp: spark(16, 2, index + 5),
      hrv: spark(42, 5, index + 7),
    },
    equipment: [
      { id: "helm", name: "Helmet", status: person.status === "offline" ? "Disconnected" : "Connected", battery: Math.max(20, (battery ?? 50) - 5), tone: "cyan" },
      { id: "strap", name: "Chest Strap (Vitals)", status: person.status === "offline" ? "Disconnected" : "Connected", battery: battery ?? 40, tone: "green" },
      { id: "weapon", name: "Weapon Tag", status: person.status === "offline" ? "Disconnected" : battery != null && battery < 25 ? "Low Battery" : "Connected", battery: Math.min(98, (battery ?? 50) + 8), tone: "amber" },
    ],
    events: buildEvents(code, person.lat, person.lng),
  };
});

export function statusLabel(status: PersonnelStatus) {
  if (status === "warning") return "Warning";
  return status[0].toUpperCase() + status.slice(1);
}
