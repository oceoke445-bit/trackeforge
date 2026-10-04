import type { IconName } from "@/components/ui/icon";

export type NavItem = {
  label: string;
  icon: IconName;
  href?: string;
  domain?: string;
  disabled?: boolean;
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Dashboard",
    items: [
      { label: "Overview", icon: "grid", href: "/overview", domain: "overview" },
      { label: "Groups", icon: "layers", href: "/groups", domain: "groups" },
      { label: "Personal", icon: "user", href: "/personal", domain: "personal" },
      { label: "Weapons", icon: "crosshair", href: "/weapons", domain: "weapons" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Operations", icon: "compass", href: "/operations", domain: "operations" },
      { label: "Geofences", icon: "shield", href: "/groups/geofence", domain: "geofences" },
    ],
  },
  {
    label: "Hunting & Forensics",
    items: [
      { label: "Search / Explorer", icon: "search", href: "/search", domain: "explorer" },
      { label: "Alerts", icon: "bell", href: "/alerts", domain: "alerts" },
      { label: "History", icon: "clock", href: "/groups/history", domain: "history" },
      { label: "Reports", icon: "chart", href: "/reports", domain: "reports" },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "LoRa Mesh", icon: "signal", domain: "lora_mesh", disabled: true },
      { label: "Gateways", icon: "server", domain: "gateways", disabled: true },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "User Access", icon: "users", href: "/user-access", domain: "user_access" },
      { label: "Activity Log", icon: "file", href: "/activity-log", domain: "activity_log" },
      { label: "Settings", icon: "settings", domain: "settings", disabled: true },
    ],
  },
];

export const navItems: NavItem[] = navGroups.flatMap((group) => group.items);

export const stats = [
  { label: "Total Devices", value: "1,248", meta: "+12 this month", tone: "blue", icon: "cpu" as IconName },
  { label: "Online", value: "1,186", meta: "95.0% fleet", tone: "green", icon: "signal" as IconName },
  { label: "Offline", value: "62", meta: "8 need attention", tone: "red", icon: "bolt" as IconName },
  { label: "Active Vehicles", value: "843", meta: "67.5% moving", tone: "cyan", icon: "truck" as IconName },
  { label: "Active Alerts", value: "24", meta: "5 critical", tone: "orange", icon: "bell" as IconName },
  { label: "Distance Today", value: "18,492", suffix: "km", meta: "+8.2% vs yesterday", tone: "violet", icon: "route" as IconName },
];

export const activities = [
  { title: "Speed limit exceeded", subject: "B 1942 UZY · Truck 042", time: "2 min ago", type: "critical", icon: "bolt" as IconName },
  { title: "Entered South Warehouse", subject: "B 9281 KLA · Van 018", time: "5 min ago", type: "normal", icon: "shield" as IconName },
  { title: "Trip started", subject: "B 2640 TRX · Sedan 127", time: "8 min ago", type: "info", icon: "route" as IconName },
  { title: "Device went offline", subject: "DEV-02941 · Excavator 08", time: "12 min ago", type: "critical", icon: "signal" as IconName },
  { title: "Vehicle stopped", subject: "B 7721 QER · Truck 033", time: "18 min ago", type: "muted", icon: "pin" as IconName },
  { title: "Low battery detected", subject: "DEV-01822 · Container 14", time: "24 min ago", type: "warning", icon: "bolt" as IconName },
  { title: "Geofence exit", subject: "B 3802 PGA · Van 024", time: "31 min ago", type: "warning", icon: "shield" as IconName },
  { title: "User signed in", subject: "admin@traxon.io", time: "45 min ago", type: "info", icon: "user" as IconName },
  { title: "Device reconnected", subject: "DEV-02941 · Excavator 08", time: "1 hr ago", type: "normal", icon: "signal" as IconName },
  { title: "Route completed", subject: "B 1942 UZY · Truck 042", time: "2 hr ago", type: "muted", icon: "route" as IconName },
  { title: "Idle timeout alert", subject: "B 2640 TRX · Sedan 127", time: "3 hr ago", type: "warning", icon: "clock" as IconName },
  { title: "Maintenance due", subject: "Truck 033 · 12,400 km", time: "5 hr ago", type: "info", icon: "truck" as IconName },
];

export const vehicles = [
  { name: "Truck 042", plate: "B 1942 UZY", driver: "Rizky Pratama", speed: "72 km/h", status: "Moving", update: "Now", battery: "89%" },
  { name: "Van 018", plate: "B 9281 KLA", driver: "Aditya Putra", speed: "46 km/h", status: "Moving", update: "18 sec", battery: "74%" },
  { name: "Sedan 127", plate: "B 2640 TRX", driver: "Nadia Sari", speed: "0 km/h", status: "Idle", update: "1 min", battery: "92%" },
  { name: "Truck 033", plate: "B 7721 QER", driver: "Dimas Arief", speed: "0 km/h", status: "Stopped", update: "3 min", battery: "64%" },
  { name: "Van 024", plate: "B 3802 PGA", driver: "Fauzan Malik", speed: "38 km/h", status: "Moving", update: "34 sec", battery: "81%" },
];
