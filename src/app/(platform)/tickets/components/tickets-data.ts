import type { IconName } from "@/components/ui/icon";

export type TicketStatus = "Open" | "In Progress" | "Waiting" | "Resolved" | "Closed";
export type TicketPriority = "Critical" | "High" | "Medium" | "Low";
export type TicketAlertType =
  | "SOS"
  | "Health"
  | "Low Battery"
  | "Out of Geofence"
  | "No Movement"
  | "Device Issue"
  | "High Temperature"
  | "Others";
export type TicketGroup = "Alpha" | "Bravo" | "Charlie" | "Delta" | "Echo" | "Weapons";

export type TicketItem = {
  id: string;
  apiId?: number;
  alertType: TicketAlertType;
  apiAlertType?: string;
  title: string;
  description: string;
  soldier: string;
  group: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  sourceAlertCode?: string;
  assignee: { name: string; initials: string; tone: string } | null;
};

export const TICKET_STATUSES: TicketStatus[] = ["Open", "In Progress", "Waiting", "Resolved", "Closed"];
export const TICKET_PRIORITIES: TicketPriority[] = ["Critical", "High", "Medium", "Low"];
export const TICKET_ALERT_TYPES: TicketAlertType[] = [
  "SOS",
  "Health",
  "Low Battery",
  "Out of Geofence",
  "No Movement",
  "Device Issue",
  "High Temperature",
  "Others",
];
export const TICKET_GROUPS: TicketGroup[] = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Weapons"];

export const ALERT_TYPE_ICON: Record<TicketAlertType, IconName> = {
  SOS: "bell",
  Health: "heart",
  "Low Battery": "bolt",
  "Out of Geofence": "shield",
  "No Movement": "pause",
  "Device Issue": "cpu",
  "High Temperature": "thermo",
  Others: "file",
};

export const TICKETS: TicketItem[] = [
  {
    id: "TK-20261003-001",
    alertType: "SOS",
    title: "SOS Signal Received",
    description: "SOS button pressed",
    soldier: "S-11",
    group: "Alpha",
    priority: "Critical",
    status: "Open",
    createdAt: "03 Oct 2026 11:01 WIB",
    assignee: { name: "Rina Novita", initials: "RN", tone: "blue" },
  },
  {
    id: "TK-20261003-002",
    alertType: "Health",
    title: "Elevated Heart Rate",
    description: "HR exceeded 140 bpm for 3 minutes",
    soldier: "S-08",
    group: "Bravo",
    priority: "High",
    status: "In Progress",
    createdAt: "03 Oct 2026 10:44 WIB",
    assignee: { name: "Dimas Pratama", initials: "DP", tone: "green" },
  },
  {
    id: "TK-20261003-003",
    alertType: "Out of Geofence",
    title: "North Perimeter Breach",
    description: "Soldier exited geofence without clearance",
    soldier: "S-19",
    group: "Charlie",
    priority: "High",
    status: "Waiting",
    createdAt: "03 Oct 2026 09:18 WIB",
    assignee: { name: "Fajar Ardi", initials: "FA", tone: "amber" },
  },
  {
    id: "TK-20261003-004",
    alertType: "Low Battery",
    title: "Device Battery Critical",
    description: "Chest strap battery at 8%",
    soldier: "S-04",
    group: "Alpha",
    priority: "Medium",
    status: "Open",
    createdAt: "03 Oct 2026 08:52 WIB",
    assignee: null,
  },
  {
    id: "TK-20261003-005",
    alertType: "High Temperature",
    title: "Heat Stress Warning",
    description: "Body temperature reached 38.9 °C",
    soldier: "S-22",
    group: "Delta",
    priority: "Medium",
    status: "Resolved",
    createdAt: "02 Oct 2026 22:11 WIB",
    assignee: { name: "Rina Novita", initials: "RN", tone: "blue" },
  },
  {
    id: "TK-20261002-014",
    alertType: "No Movement",
    title: "No Movement Detected",
    description: "No movement for 20 minutes",
    soldier: "S-15",
    group: "Echo",
    priority: "Low",
    status: "Resolved",
    createdAt: "02 Oct 2026 18:40 WIB",
    assignee: { name: "Dimas Pratama", initials: "DP", tone: "green" },
  },
  {
    id: "TK-20261002-011",
    alertType: "Device Issue",
    title: "Strap Disconnected",
    description: "Chest strap lost connection",
    soldier: "W-03",
    group: "Weapons",
    priority: "High",
    status: "In Progress",
    createdAt: "02 Oct 2026 16:05 WIB",
    assignee: { name: "Fajar Ardi", initials: "FA", tone: "amber" },
  },
  {
    id: "TK-20261002-008",
    alertType: "Others",
    title: "Manual Ticket",
    description: "Follow-up requested by command",
    soldier: "S-01",
    group: "Bravo",
    priority: "Low",
    status: "Waiting",
    createdAt: "02 Oct 2026 14:22 WIB",
    assignee: null,
  },
];
