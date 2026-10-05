import type { IconName } from "@/components/ui/icon";

export type ReportStatus = "COMPLETED" | "FAILED" | "PROCESSING";

export type ReportTypeId =
  | "operational"
  | "personnel"
  | "weapon"
  | "geofence"
  | "alert"
  | "system"
  | "comms"
  | "executive";

export type ReportRecord = {
  id: string;
  name: string;
  typeId: ReportTypeId;
  typeLabel: string;
  generatedBy: string;
  generatedAt: string;
  period: string;
  status: ReportStatus;
  file: "PDF" | "CSV";
  size: string;
  description: string;
  operation: string;
  sectionIds?: string[];
  layout?: "Standard" | "Compact";
  language?: string;
  detailLevel?: string;
  includeMap?: boolean;
  showLayers?: boolean;
  periodFrom?: string;
  periodTo?: string;
};

export type ReportTypeCard = {
  id: ReportTypeId;
  label: string;
  hint: string;
  icon: IconName;
  tone: string;
};

export const REPORT_TYPES: ReportTypeCard[] = [
  { id: "operational", label: "Operational", hint: "Mission summary and activity", icon: "compass", tone: "blue" },
  { id: "personnel", label: "Personnel", hint: "Movement and roster stats", icon: "users", tone: "green" },
  { id: "weapon", label: "Weapon", hint: "Inventory and readiness", icon: "crosshair", tone: "amber" },
  { id: "geofence", label: "Geofence", hint: "Zone entry and exit events", icon: "pin", tone: "cyan" },
  { id: "alert", label: "Alert & Incident", hint: "Security events summary", icon: "warn", tone: "red" },
  { id: "system", label: "System", hint: "Device and infra health", icon: "cpu", tone: "violet" },
  { id: "comms", label: "Communication", hint: "Network and message logs", icon: "signal", tone: "blue" },
  { id: "executive", label: "Executive", hint: "High-level command brief", icon: "chart", tone: "green" },
];

export const REPORT_SECTIONS = [
  { id: "summary", label: "Executive Summary", hint: "Key metrics and operation overview" },
  { id: "info", label: "Operation Information", hint: "Mission window, status, and ownership" },
  { id: "groups", label: "Groups & Personnel", hint: "Assigned units and soldier counts" },
  { id: "geofences", label: "Geofences", hint: "Linked zones and boundary coverage" },
  { id: "alerts", label: "Alerts", hint: "Critical and warning events in period" },
  { id: "tickets", label: "Tickets", hint: "Linked tickets and resolution status" },
  { id: "map", label: "Map Visualization", hint: "Operational area with live positions" },
  { id: "timeline", label: "Activity Timeline", hint: "Chronological mission events" },
];

export const REPORT_OPERATIONS = [
  "Operation Alpha",
  "Operation Bravo",
  "Operation Coastal Watch",
  "All Operations",
];

export const REPORTS: ReportRecord[] = [
  {
    id: "r1",
    name: "Operation Alpha - Daily Report",
    typeId: "operational",
    typeLabel: "Operational",
    generatedBy: "Admin User",
    generatedAt: "05 Oct 2026 09:12",
    period: "05 Oct 2026",
    status: "COMPLETED",
    file: "PDF",
    size: "48 KB",
    description: "Daily operational summary for Operation Alpha.",
    operation: "Operation Alpha",
    periodFrom: "2026-10-05",
    periodTo: "2026-10-05",
    sectionIds: REPORT_SECTIONS.map((item) => item.id),
    layout: "Standard",
    language: "English",
    detailLevel: "Standard",
    includeMap: true,
    showLayers: true,
  },
  {
    id: "r2",
    name: "Personnel Movement - Weekly",
    typeId: "personnel",
    typeLabel: "Personnel",
    generatedBy: "Lt. Rina",
    generatedAt: "04 Oct 2026 18:40",
    period: "28 Sep – 04 Oct 2026",
    status: "COMPLETED",
    file: "PDF",
    size: "52 KB",
    description: "Weekly personnel movement and activity analysis.",
    operation: "Operation Alpha",
    periodFrom: "2026-09-28",
    periodTo: "2026-10-04",
    sectionIds: ["summary", "groups", "timeline", "map"],
    layout: "Standard",
    language: "English",
    detailLevel: "Detailed",
    includeMap: true,
    showLayers: true,
  },
  {
    id: "r3",
    name: "Alert Summary - Incident Window",
    typeId: "alert",
    typeLabel: "Alert & Incident",
    generatedBy: "Sgt. Dimas",
    generatedAt: "04 Oct 2026 14:05",
    period: "04 Oct 2026",
    status: "FAILED",
    file: "PDF",
    size: "—",
    description: "Failed export during alert aggregation.",
    operation: "Operation Bravo",
    sectionIds: ["summary", "alerts", "tickets"],
    layout: "Compact",
    language: "English",
    detailLevel: "Summary",
    includeMap: false,
    showLayers: false,
  },
  {
    id: "r4",
    name: "Weapon Status - Armory Audit",
    typeId: "weapon",
    typeLabel: "Weapon",
    generatedBy: "WO Budi",
    generatedAt: "03 Oct 2026 11:22",
    period: "01 – 03 Oct 2026",
    status: "COMPLETED",
    file: "CSV",
    size: "4 KB",
    description: "Armory readiness and assignment audit.",
    operation: "All Operations",
    sectionIds: ["summary", "info", "groups"],
    layout: "Compact",
    language: "English",
    detailLevel: "Standard",
    includeMap: false,
    showLayers: false,
  },
  {
    id: "r5",
    name: "Geofence Activity - North Perimeter",
    typeId: "geofence",
    typeLabel: "Geofence",
    generatedBy: "Admin User",
    generatedAt: "03 Oct 2026 08:15",
    period: "02 – 03 Oct 2026",
    status: "PROCESSING",
    file: "PDF",
    size: "—",
    description: "Entry and exit events for North Perimeter.",
    operation: "Operation Coastal Watch",
    sectionIds: ["summary", "geofences", "map"],
    layout: "Standard",
    language: "English",
    detailLevel: "Standard",
    includeMap: true,
    showLayers: true,
  },
  {
    id: "r6",
    name: "System Health - Infrastructure",
    typeId: "system",
    typeLabel: "System",
    generatedBy: "Ops Center",
    generatedAt: "02 Oct 2026 21:50",
    period: "02 Oct 2026",
    status: "COMPLETED",
    file: "PDF",
    size: "41 KB",
    description: "Gateway uptime and device health snapshot.",
    operation: "All Operations",
    sectionIds: ["summary", "info", "timeline"],
    layout: "Standard",
    language: "English",
    detailLevel: "Detailed",
    includeMap: false,
    showLayers: false,
  },
  {
    id: "r7",
    name: "Communication Log - Mesh Links",
    typeId: "comms",
    typeLabel: "Communication",
    generatedBy: "Cpl. Fajar",
    generatedAt: "02 Oct 2026 16:33",
    period: "01 – 02 Oct 2026",
    status: "COMPLETED",
    file: "CSV",
    size: "5 KB",
    description: "Mesh link quality and message volume.",
    operation: "Operation Bravo",
    sectionIds: ["summary", "info", "timeline"],
    layout: "Compact",
    language: "English",
    detailLevel: "Standard",
    includeMap: false,
    showLayers: false,
  },
  {
    id: "r8",
    name: "Executive Brief - Command",
    typeId: "executive",
    typeLabel: "Executive",
    generatedBy: "Superadmin",
    generatedAt: "01 Oct 2026 07:05",
    period: "Sep 2026",
    status: "COMPLETED",
    file: "PDF",
    size: "56 KB",
    description: "Monthly executive briefing pack.",
    operation: "All Operations",
    sectionIds: REPORT_SECTIONS.map((item) => item.id),
    layout: "Standard",
    language: "English",
    detailLevel: "Summary",
    includeMap: true,
    showLayers: true,
  },
];
