import type { IconName } from "@/components/ui/icon";

export type RecordLevel = "Telemetry" | "Mesh" | "Uplink" | "Beacon" | "Special" | "System";
export type PositionSource = "GNSS" | "DEAD_RECKONING" | "TRILATERATION" | "STALE";

export type ExplorerRecord = {
  id: string;
  time: string;
  received: string;
  entity: string;
  group: string;
  level: RecordLevel;
  record: string;
  source: string;
  gateway: string;
  summary: string;
  tone: "blue" | "teal" | "red" | "amber" | "violet" | "green" | "slate";
  icon: IconName;
  raw: Record<string, unknown>;
  decoded: Record<string, unknown> | null;
  communication: Record<string, unknown> | null;
};

export const SERIES = [
  { label: "Telemetry", value: "563.1K", color: "#3b82f6" },
  { label: "Mesh", value: "48.3K", color: "#c4b5fd" },
  { label: "Uplink", value: "6.1K", color: "#fbbf24" },
  { label: "Beacon", value: "8.4K", color: "#94a3b8" },
  { label: "Special", value: "1.1K", color: "#2dd4bf" },
] as const;

export const CHART_BARS = Array.from({ length: 42 }, (_, index) => {
  const wave = 0.35 + 0.65 * Math.abs(Math.sin(index * 0.42 + 0.4));
  const edge = index < 10 || index > 32 ? 1 : 0.62;
  const scale = wave * edge;
  return [
    Math.round(22 * scale),
    Math.round(8 * scale),
    Math.round(4 * (0.4 + (index % 5) / 10)),
    index % 9 === 0 ? 3 : 1,
    index % 14 === 0 ? 4 : 1,
  ];
});

export const CHART_LABELS = ["03 Oct, 08:29", "03 Oct, 12:29", "03 Oct, 16:29", "03 Oct, 20:29", "04 Oct, 00:29", "04 Oct, 04:29", "04 Oct, 08:29"];

export const FIELD_GROUPS = [
  { name: "Soldier telemetry", count: "563.1K", fields: ["soldier_id", "seq", "timestamp", "latitude", "longitude", "position_source", "hr", "hrv_rmssd", "spo2", "temperature", "battery", "flags"] },
  { name: "Mesh communication", count: "48.3K", fields: ["source_id", "seq", "frame_type", "ttl", "hop_count", "payload_length", "rssi", "snr", "sf", "tx_power"] },
  { name: "Satellite uplink", count: "6.1K", fields: ["gateway_id", "burst_id", "packet_count", "payload_size", "sent_at", "received_at", "delivery_status", "retry_count"] },
  { name: "Beacon observation", count: "8.4K", fields: ["beacon_id", "observer_id", "rssi", "timestamp"] },
  { name: "Special records", count: "1.1K", fields: ["rr_series", "ekg_recording"] },
];

const POSITION_CODE: Record<PositionSource, number> = {
  GNSS: 0,
  DEAD_RECKONING: 1,
  TRILATERATION: 2,
  STALE: 3,
};

const UNCERTAINTY: Record<PositionSource, string> = {
  GNSS: "±5–10 m",
  DEAD_RECKONING: "~±40 m, grows with time",
  TRILATERATION: "±50–200 m",
  STALE: "unknown",
};

function unix(clock: string) {
  const [hour, minute, second] = clock.split(":").map(Number);
  return Math.floor(Date.UTC(2026, 9, 4, hour, minute, second) / 1000);
}

function clockLabel(clock: string) {
  return `04 Oct ${clock}`;
}

function iso(clock: string) {
  return `2026-10-04T${clock}Z`;
}

function e7(degrees: number) {
  return Math.round(degrees * 1e7);
}

function flagByte(input: {
  position: PositionSource;
  strap: boolean;
  sos?: boolean;
  casualty?: boolean;
  arrhythmia?: boolean;
  lowBattery?: boolean;
  heatStress?: boolean;
}) {
  let value = POSITION_CODE[input.position] << 3;
  if (input.sos) value |= 1;
  if (input.casualty) value |= 2;
  if (input.arrhythmia) value |= 4;
  if (input.strap) value |= 1 << 5;
  if (input.lowBattery) value |= 1 << 6;
  if (input.heatStress) value |= 1 << 7;
  return value;
}

function telemetry(input: {
  id: string;
  entity: string;
  soldierId: number;
  seq: number;
  group: string;
  gateway: string;
  eventClock: string;
  receivedClock: string;
  lat: number;
  lon: number;
  position: PositionSource;
  strap: boolean;
  hr?: number;
  hrv?: number;
  spo2?: number;
  temp?: number;
  batt: number;
  sos?: boolean;
  casualty?: boolean;
  arrhythmia?: boolean;
  lowBattery?: boolean;
  heatStress?: boolean;
  delivery?: "MESH" | "STORE_AND_CARRY";
  summary: string;
}): ExplorerRecord {
  const flags = flagByte(input);
  const vital = input.strap
    ? { hr: input.hr ?? null, hrv_rmssd: input.hrv ?? null, spo2: input.spo2 ?? null, temperature_c: input.temp ?? null }
    : { hr: null, hrv_rmssd: null, spo2: null, temperature_c: null, vital: "TANPA VITAL" };
  return {
    id: input.id,
    time: clockLabel(input.eventClock),
    received: clockLabel(input.receivedClock),
    entity: input.entity,
    group: input.group,
    level: "Telemetry",
    record: "21-byte packet",
    source: input.position === "GNSS" ? "GNSS" : input.position === "DEAD_RECKONING" ? "Dead Reckoning" : input.position === "TRILATERATION" ? "Trilateration" : "Stale",
    gateway: input.gateway,
    summary: input.summary,
    tone: input.strap ? "blue" : "amber",
    icon: "file",
    raw: {
      bytes: 21,
      soldier_id: input.soldierId,
      seq: input.seq,
      timestamp: unix(input.eventClock),
      lat_e7: e7(input.lat),
      lon_e7: e7(input.lon),
      hr: input.strap ? input.hr ?? null : null,
      hrv: input.strap ? input.hrv ?? null : null,
      spo2: input.strap ? input.spo2 ?? null : null,
      temp: input.strap ? input.temp ?? null : null,
      batt: input.batt,
      flags,
    },
    decoded: {
      event_time: iso(input.eventClock),
      received_at: iso(input.receivedClock),
      delivery_mode: input.delivery ?? "MESH",
      soldier_id: input.entity,
      seq: input.seq,
      latitude: input.lat,
      longitude: input.lon,
      position_source: input.position,
      position_uncertainty: UNCERTAINTY[input.position],
      ...vital,
      battery_pct: input.batt,
      flags: {
        raw: flags,
        sos: Boolean(input.sos),
        casualty: Boolean(input.casualty),
        arrhythmia: Boolean(input.arrhythmia),
        position_source: input.position,
        strap_connected: input.strap,
        low_battery: Boolean(input.lowBattery),
        heat_stress: Boolean(input.heatStress),
      },
    },
    communication: null,
  };
}

export const EXPLORER_RECORDS: ExplorerRecord[] = [
  telemetry({
    id: "tl-014-41",
    entity: "P-014",
    soldierId: 14,
    seq: 41,
    group: "Alpha",
    gateway: "GW-01",
    eventClock: "08:29:12",
    receivedClock: "08:29:14",
    lat: -6.12345,
    lon: 106.12345,
    position: "GNSS",
    strap: true,
    hr: 78,
    hrv: 52,
    spo2: 98,
    temp: 37,
    batt: 86,
    summary: "GNSS ±5–10 m",
  }),
  {
    id: "mesh-014-41",
    time: clockLabel("08:29:13"),
    received: clockLabel("08:29:13"),
    entity: "P-014",
    group: "Alpha",
    level: "Mesh",
    record: "LoRa frame",
    source: "LoRa",
    gateway: "GW-01",
    summary: "TTL 3 · hop 1",
    tone: "violet",
    icon: "signal",
    raw: {
      frame_bytes: 4,
      air_bytes: 25,
      ver_type: 1,
      ttl: 3,
      hop_count: 1,
      payload_length: 21,
      source_id: 14,
      seq: 41,
    },
    decoded: {
      relay: "hop_count increments and TTL decrements on forward",
      dedupe: { source_id: 14, seq: 41 },
      payload: "21-byte soldier payload, stored undecoded at the gateway",
    },
    communication: {
      source_id: 14,
      seq: 41,
      frame_type: 1,
      ttl: 3,
      hop_count: 1,
      payload_length: 21,
      rssi_dbm: -87,
      snr_db: 8,
      sf: 9,
      tx_power_dbm: 14,
    },
  },
  {
    id: "mesh-014-41-origin",
    time: clockLabel("08:29:12"),
    received: clockLabel("08:29:12"),
    entity: "P-014",
    group: "Alpha",
    level: "Mesh",
    record: "LoRa frame",
    source: "LoRa",
    gateway: "GW-01",
    summary: "TTL 4 · hop 0",
    tone: "violet",
    icon: "signal",
    raw: {
      frame_bytes: 4,
      air_bytes: 25,
      ver_type: 1,
      ttl: 4,
      hop_count: 0,
      payload_length: 21,
      source_id: 14,
      seq: 41,
    },
    decoded: {
      relay: "origin frame, before the first hop",
      dedupe: { source_id: 14, seq: 41 },
    },
    communication: {
      source_id: 14,
      seq: 41,
      frame_type: 1,
      ttl: 4,
      hop_count: 0,
      payload_length: 21,
      rssi_dbm: -72,
      snr_db: 11,
      sf: 9,
      tx_power_dbm: 14,
    },
  },
  {
    id: "up-gw01",
    time: clockLabel("08:29:14"),
    received: clockLabel("08:29:22"),
    entity: "GW-01",
    group: "Alpha",
    level: "Uplink",
    record: "Satellite burst",
    source: "RockBLOCK 9704",
    gateway: "GW-01",
    summary: "8 packets · 174 B",
    tone: "amber",
    icon: "server",
    raw: {
      stored: "undecoded",
      header_bytes: 6,
      packet_count: 8,
      payload_bytes: 168,
      total_bytes: 174,
    },
    decoded: null,
    communication: {
      gateway_id: "GW-01",
      burst_id: "burst-20261004-082914",
      packet_count: 8,
      payload_size: 174,
      sent_at: iso("08:29:14"),
      received_at: iso("08:29:22"),
      delivery_status: "delivered",
      retry_count: 0,
      session_duration_s: 8,
      path: ["LoRa mesh", "Gateway", "RockBLOCK 9704", "Iridium IMT", "Cloudloop"],
    },
  },
  telemetry({
    id: "tl-021-12",
    entity: "P-021",
    soldierId: 21,
    seq: 12,
    group: "Bravo",
    gateway: "GW-01",
    eventClock: "08:29:15",
    receivedClock: "08:29:18",
    lat: -6.1241,
    lon: 106.1228,
    position: "DEAD_RECKONING",
    strap: true,
    hr: 81,
    hrv: 44,
    spo2: 97,
    temp: 37,
    batt: 74,
    summary: "Dead reckoning ~±40 m",
  }),
  telemetry({
    id: "tl-014-44",
    entity: "P-014",
    soldierId: 14,
    seq: 44,
    group: "Alpha",
    gateway: "GW-01",
    eventClock: "08:31:02",
    receivedClock: "08:31:05",
    lat: -6.1235,
    lon: 106.1235,
    position: "GNSS",
    strap: true,
    hr: 96,
    hrv: 28,
    spo2: 97,
    temp: 39,
    batt: 84,
    heatStress: true,
    summary: "GNSS ±5–10 m · heat stress flag",
  }),
  {
    id: "bc-007",
    time: clockLabel("08:32:04"),
    received: clockLabel("08:32:04"),
    entity: "B-007",
    group: "Alpha",
    level: "Beacon",
    record: "Beacon observation",
    source: "Passive Beacon",
    gateway: "GW-02",
    summary: "P-014 heard RSSI -91",
    tone: "slate",
    icon: "signal",
    raw: {
      beacon_id: "B-007",
      observer_id: "P-014",
      rssi_dbm: -91,
      timestamp: unix("08:32:04"),
    },
    decoded: null,
    communication: null,
  },
  telemetry({
    id: "tl-014-48",
    entity: "P-014",
    soldierId: 14,
    seq: 48,
    group: "Alpha",
    gateway: "GW-01",
    eventClock: "08:34:11",
    receivedClock: "08:34:12",
    lat: -6.12348,
    lon: 106.12352,
    position: "GNSS",
    strap: true,
    hr: 110,
    hrv: 22,
    spo2: 96,
    temp: 37,
    batt: 83,
    sos: true,
    summary: "GNSS ±5–10 m · SOS flag",
  }),
  {
    id: "sp-rr-003",
    time: clockLabel("08:35:20"),
    received: clockLabel("08:35:26"),
    entity: "P-003",
    group: "Alpha",
    level: "Special",
    record: "RR series",
    source: "Chest Strap",
    gateway: "GW-02",
    summary: "~100 B alarm summary",
    tone: "teal",
    icon: "heart",
    raw: {
      type: "rr_series",
      bytes: 100,
      soldier_id: 3,
      timestamp: unix("08:35:20"),
    },
    decoded: {
      event_time: iso("08:35:20"),
      received_at: iso("08:35:26"),
      note: "Arrhythmia alarm summary. Not part of the routine 21-byte packet.",
    },
    communication: null,
  },
  telemetry({
    id: "tl-003-off",
    entity: "P-003",
    soldierId: 3,
    seq: 19,
    group: "Alpha",
    gateway: "GW-02",
    eventClock: "08:39:18",
    receivedClock: "08:39:21",
    lat: -6.1284,
    lon: 106.1192,
    position: "GNSS",
    strap: false,
    batt: 71,
    summary: "TANPA VITAL",
  }),
  telemetry({
    id: "tl-014-carry",
    entity: "P-014",
    soldierId: 14,
    seq: 30,
    group: "Alpha",
    gateway: "GW-01",
    eventClock: "10:00:00",
    receivedClock: "13:12:08",
    lat: -6.1211,
    lon: 106.1274,
    position: "GNSS",
    strap: true,
    hr: 76,
    hrv: 49,
    spo2: 98,
    temp: 36,
    batt: 64,
    delivery: "STORE_AND_CARRY",
    summary: "STORE_AND_CARRY · event 10:00",
  }),
  telemetry({
    id: "tl-018-tri",
    entity: "P-018",
    soldierId: 18,
    seq: 7,
    group: "Charlie",
    gateway: "GW-02",
    eventClock: "08:43:01",
    receivedClock: "08:43:09",
    lat: -6.1302,
    lon: 106.1184,
    position: "TRILATERATION",
    strap: true,
    hr: 74,
    hrv: 55,
    spo2: 98,
    temp: 36,
    batt: 58,
    summary: "Trilateration ±50–200 m",
  }),
  telemetry({
    id: "tl-007-stale",
    entity: "P-007",
    soldierId: 7,
    seq: 22,
    group: "Charlie",
    gateway: "GW-02",
    eventClock: "08:44:22",
    receivedClock: "08:44:40",
    lat: -6.1311,
    lon: 106.1172,
    position: "STALE",
    strap: true,
    hr: 70,
    hrv: 61,
    spo2: 97,
    temp: 36,
    batt: 18,
    lowBattery: true,
    summary: "Stale · unknown · low battery flag",
  }),
  {
    id: "mesh-link-test",
    time: clockLabel("08:46:00"),
    received: clockLabel("08:46:00"),
    entity: "GW-01",
    group: "Alpha",
    level: "Mesh",
    record: "Link metadata",
    source: "LoRa",
    gateway: "GW-01",
    summary: "PDR 0.92 · SF 9",
    tone: "violet",
    icon: "signal",
    raw: {
      note: "No 21-byte payload. Link-test metadata only.",
    },
    decoded: {
      note: "Test log. These fields are not inside the 21-byte soldier payload.",
    },
    communication: {
      pdr: 0.92,
      rssi_dbm: -94,
      snr_db: 6,
      hop_count: 2,
      sf: 9,
      tx_power_dbm: 14,
      distance_m: 180,
      antenna: "vest shoulder, vertical",
      vegetation: "dense canopy",
      weather: "overcast",
      test_time: iso("08:46:00"),
    },
  },
  {
    id: "sp-ekg-014",
    time: clockLabel("08:50:00"),
    received: clockLabel("09:12:40"),
    entity: "P-014",
    group: "Alpha",
    level: "Special",
    record: "EKG recording",
    source: "Chest Strap",
    gateway: "GW-01",
    summary: "10 s · deferred",
    tone: "teal",
    icon: "chart",
    raw: {
      type: "ekg_10s",
      bytes: 2048,
      soldier_id: 14,
      timestamp: unix("08:50:00"),
      deferred: true,
    },
    decoded: {
      event_time: iso("08:50:00"),
      received_at: iso("09:12:40"),
      note: "Held until the link is good or C2 requests it. Routine telemetry sends HR and RMSSD, not the 250 Hz waveform.",
    },
    communication: null,
  },
];
