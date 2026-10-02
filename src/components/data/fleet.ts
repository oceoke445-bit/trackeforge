import type { IconName } from "@/components/ui/icon";

export type NavItem = {
  label: string;
  icon: IconName;
  href: string;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", icon: "grid", href: "/" },
  // { label: "Live Tracking", icon: "map", href: "/tracking" },
  // { label: "Devices", icon: "cpu", href: "/devices" },
  // { label: "Vehicles", icon: "truck", href: "/vehicles" },
  // { label: "Assets", icon: "box", href: "/assets" },
  // { label: "Geofences", icon: "shield", href: "/geofences" },
  // { label: "Alerts", icon: "bell", href: "/alerts" },
  // { label: "Trips & History", icon: "route", href: "/trips" },
  // { label: "Analytics", icon: "chart", href: "/analytics" },
  // { label: "Reports", icon: "file", href: "/reports" },
  { label: "User Access", icon: "users", href: "/user-access" },
  { label: "Settings", icon: "settings", href: "/settings" },
];

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
];

export const vehicles = [
  { name: "Truck 042", plate: "B 1942 UZY", driver: "Rizky Pratama", speed: "72 km/h", status: "Moving", update: "Now", battery: "89%" },
  { name: "Van 018", plate: "B 9281 KLA", driver: "Aditya Putra", speed: "46 km/h", status: "Moving", update: "18 sec", battery: "74%" },
  { name: "Sedan 127", plate: "B 2640 TRX", driver: "Nadia Sari", speed: "0 km/h", status: "Idle", update: "1 min", battery: "92%" },
  { name: "Truck 033", plate: "B 7721 QER", driver: "Dimas Arief", speed: "0 km/h", status: "Stopped", update: "3 min", battery: "64%" },
  { name: "Van 024", plate: "B 3802 PGA", driver: "Fauzan Malik", speed: "38 km/h", status: "Moving", update: "34 sec", battery: "81%" },
];
