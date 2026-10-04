"use client";

import { useState } from "react";
import CalendarRange from "@/components/ui/calendar";
import Dropdown from "@/components/ui/dropdown";
import Icon, { type IconName } from "@/components/ui/icon";

const TABS = ["Create Report", "Templates", "Scheduled Reports", "Report History"] as const;

const TEMPLATES: { id: string; label: string; hint: string; icon: IconName; tone: string; type: string; name: string }[] = [
  { id: "operation", label: "Operation Report", hint: "Group activity, mission summary", icon: "file", tone: "blue", type: "Operational Report", name: "Operation Alpha - Daily Report" },
  { id: "movement", label: "Personnel Movement", hint: "Movement timeline and heatmap", icon: "users", tone: "green", type: "Movement Report", name: "Personnel Movement - Daily Report" },
  { id: "weapon", label: "Weapon Status", hint: "Availability and status report", icon: "crosshair", tone: "amber", type: "Weapon Report", name: "Weapon Status - Daily Report" },
  { id: "alert", label: "Alert Summary", hint: "Security events and incidents", icon: "warn", tone: "red", type: "Alert Report", name: "Alert Summary - Daily Report" },
  { id: "health", label: "System Health", hint: "Device and infrastructure status", icon: "settings", tone: "violet", type: "System Report", name: "System Health - Daily Report" },
];

const GROUPS = [
  { id: "alpha-1", name: "Alpha-1", count: "12 personnel" },
  { id: "alpha-2", name: "Alpha-2", count: "8 personnel" },
  { id: "bravo-1", name: "Bravo-1", count: "10 personnel" },
  { id: "charlie-1", name: "Charlie-1", count: "6 personnel" },
];

const DATA_TYPES: { id: string; label: string; icon: IconName; tone: string }[] = [
  { id: "position", label: "Position & Movement", icon: "pin", tone: "blue" },
  { id: "vital", label: "Vital Signs", icon: "heart", tone: "red" },
  { id: "alerts", label: "Alerts & Events", icon: "warn", tone: "amber" },
  { id: "comms", label: "Communication Logs", icon: "signal", tone: "blue" },
  { id: "weapon", label: "Weapon Status", icon: "crosshair", tone: "green" },
  { id: "system", label: "System Events", icon: "settings", tone: "slate" },
];

const CONTENTS: { id: string; label: string; hint: string; icon: IconName; tone: string }[] = [
  { id: "summary", label: "Executive Summary", hint: "Key findings and overview", icon: "pin", tone: "green" },
  { id: "timeline", label: "Activity Timeline", hint: "Movement and event timeline", icon: "heart", tone: "red" },
  { id: "map", label: "Map Visualizations", hint: "Route, heatmap, and location data", icon: "pin", tone: "blue" },
  { id: "events", label: "Event Summary", hint: "Alerts, incidents, and notable events", icon: "warn", tone: "amber" },
  { id: "personnel", label: "Personnel Statistics", hint: "Activity and vital signs summary", icon: "users", tone: "green" },
  { id: "weapons", label: "Weapon Statistics", hint: "Status and usage information", icon: "crosshair", tone: "blue" },
  { id: "comms", label: "Communication Summary", hint: "Network and messaging activity", icon: "signal", tone: "slate" },
  { id: "health", label: "System Health", hint: "Device and infrastructure status", icon: "file", tone: "slate" },
];

const DONUT = [
  { label: "Position", value: "56.3%", color: "#3b82f6" },
  { label: "Vital", value: "22.1%", color: "#f87171" },
  { label: "Alert", value: "8.7%", color: "#fbbf24" },
  { label: "Communication", value: "7.5%", color: "#22d3ee" },
  { label: "System", value: "5.4%", color: "#a78bfa" },
];

const BARS = [18, 22, 28, 36, 48, 42, 55, 62, 58, 70, 64, 46, 38, 30, 24, 20];

const CATEGORIES: { id: string; label: string; icon: IconName; tone: string }[] = [
  { id: "all", label: "All", icon: "grid", tone: "blue" },
  { id: "operational", label: "Operational", icon: "users", tone: "green" },
  { id: "personnel", label: "Personnel", icon: "user", tone: "violet" },
  { id: "weapon", label: "Weapon", icon: "crosshair", tone: "slate" },
  { id: "geofence", label: "Geofence", icon: "pin", tone: "blue" },
  { id: "alert", label: "Alert & Incident", icon: "warn", tone: "red" },
  { id: "system", label: "System", icon: "settings", tone: "slate" },
];

const CATALOG: { id: string; title: string; hint: string; tags: { label: string; tone: string }[]; category: string; shot: string; type: string }[] = [
  { id: "activity", title: "Activity Timeline Report", hint: "Movement timeline, key events, and activity summary for selected entities.", tags: [{ label: "Personnel", tone: "blue" }, { label: "Operational", tone: "green" }], category: "personnel", shot: "map", type: "Movement Report" },
  { id: "alerts", title: "Alert Summary Report", hint: "Summary of security alerts, incidents, and response status.", tags: [{ label: "Alert & Incident", tone: "red" }, { label: "Operational", tone: "green" }], category: "alert", shot: "alerts", type: "Alert Report" },
  { id: "movement", title: "Personnel Movement Report", hint: "Detailed movement history, heatmap, and activity analysis.", tags: [{ label: "Personnel", tone: "blue" }, { label: "Operational", tone: "green" }], category: "personnel", shot: "soldier", type: "Movement Report" },
  { id: "weapon", title: "Weapon Status Report", hint: "Weapon inventory, usage statistics, and status overview.", tags: [{ label: "Weapon", tone: "violet" }, { label: "Operational", tone: "green" }], category: "weapon", shot: "weapon", type: "Weapon Report" },
  { id: "geofence", title: "Geofence Activity Report", hint: "Entry/exit events and activity within defined geofence areas.", tags: [{ label: "Geofence", tone: "blue" }, { label: "Alert & Incident", tone: "red" }], category: "geofence", shot: "fence", type: "Operational Report" },
  { id: "health", title: "System Health Report", hint: "Device status, network health, and infrastructure performance.", tags: [{ label: "System", tone: "violet" }, { label: "Operational", tone: "green" }], category: "system", shot: "health", type: "System Report" },
  { id: "comms", title: "Communication Log Report", hint: "Network communication logs, message statistics, and node activity.", tags: [{ label: "System", tone: "violet" }, { label: "Operational", tone: "green" }], category: "operational", shot: "table", type: "Operational Report" },
  { id: "executive", title: "Executive Summary Report", hint: "High-level summary of operations, personnel, weapons, and key events.", tags: [{ label: "Operational", tone: "green" }, { label: "System", tone: "violet" }], category: "operational", shot: "kpis", type: "Operational Report" },
  { id: "mission", title: "Mission Debrief Report", hint: "End-of-mission findings, objectives, and outstanding actions.", tags: [{ label: "Operational", tone: "green" }], category: "operational", shot: "kpis", type: "Operational Report" },
  { id: "network", title: "Network Status Report", hint: "Gateway uptime, mesh links, and packet delivery for the selected window.", tags: [{ label: "System", tone: "violet" }], category: "system", shot: "health", type: "System Report" },
  { id: "armory", title: "Armory Audit Report", hint: "Assigned weapons, battery, and maintenance flags.", tags: [{ label: "Weapon", tone: "violet" }], category: "weapon", shot: "weapon", type: "Weapon Report" },
  { id: "incident", title: "Incident Response Report", hint: "Raised alerts, acknowledgements, and time to resolve.", tags: [{ label: "Alert & Incident", tone: "red" }], category: "alert", shot: "alerts", type: "Alert Report" },
];

export default function ReportsView() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Create Report");
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const [name, setName] = useState(TEMPLATES[0].name);
  const [type, setType] = useState(TEMPLATES[0].type);
  const [description, setDescription] = useState("");
  const [entityTab, setEntityTab] = useState("Groups");
  const [groupQuery, setGroupQuery] = useState("");
  const [groups, setGroups] = useState<string[]>(["alpha-1", "alpha-2"]);
  const [types, setTypes] = useState<string[]>(["position", "alerts", "comms", "weapon"]);
  const [sections, setSections] = useState<string[]>(["summary", "timeline", "map", "events", "personnel", "weapons"]);
  const [preview, setPreview] = useState<"pdf" | "data">("pdf");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("all");
  const [catalogSort, setCatalogSort] = useState("Name (A - Z)");
  const [catalogView, setCatalogView] = useState<"grid" | "list">("grid");

  const active = TEMPLATES.find((item) => item.id === template) ?? TEMPLATES[0];
  const visibleGroups = GROUPS.filter((item) => item.name.toLowerCase().includes(groupQuery.trim().toLowerCase()));

  function pickTemplate(id: string) {
    const next = TEMPLATES.find((item) => item.id === id);
    if (!next) return;
    setTemplate(id);
    setName(next.name);
    setType(next.type);
    setTab("Create Report");
  }

  function useCatalog(id: string) {
    const next = CATALOG.find((item) => item.id === id);
    if (!next) return;
    const match = TEMPLATES.find((item) => item.type === next.type) ?? TEMPLATES[0];
    setTemplate(match.id);
    setName(next.title.replace(" Report", " - Daily Report"));
    setType(next.type);
    setTab("Create Report");
  }

  function toggle(list: string[], id: string, setList: (value: string[]) => void) {
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  function reset() {
    pickTemplate("operation");
    setDescription("");
    setGroups(["alpha-1", "alpha-2"]);
    setTypes(["position", "alerts", "comms", "weapon"]);
    setSections(["summary", "timeline", "map", "events", "personnel", "weapons"]);
    setEntityTab("Groups");
    setGroupQuery("");
    setPreview("pdf");
  }

  return (
    <div className="rpt-page">
      <header className="page-title">
        <span className="page-title-icon"><Icon name="chart" size={15} /></span>
        <div>
          <h1>Reports</h1>
          <p>Generate operational, activity, and system reports from collected data</p>
        </div>
      </header>

      <nav className="rpt-tabs" aria-label="Report sections">
        {TABS.map((item) => (
          <button key={item} type="button" className={tab === item ? "on" : ""} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </nav>

      {tab === "Templates" ? (
        <TemplateGallery
          query={catalogQuery}
          category={catalogCategory}
          sort={catalogSort}
          view={catalogView}
          onQuery={setCatalogQuery}
          onCategory={setCatalogCategory}
          onSort={setCatalogSort}
          onView={setCatalogView}
          onUse={useCatalog}
          onClear={() => { setCatalogQuery(""); setCatalogCategory("all"); setCatalogSort("Name (A - Z)"); }}
        />
      ) : tab === "Scheduled Reports" ? (
        <ScheduleBoard />
      ) : tab === "Report History" ? (
        <HistoryBoard />
      ) : (
        <>
          <section className="rpt-quick">
            <h2>Quick Templates</h2>
            <div className="rpt-templates">
              {TEMPLATES.map((item) => (
                <button key={item.id} type="button" className={`rpt-template ${item.tone}${template === item.id ? " on" : ""}`} onClick={() => pickTemplate(item.id)}>
                  <span><Icon name={item.icon} size={16} /></span>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="rpt-grid">
            <article className="panel rpt-card">
              <header>
                <i>1</i>
                <div>
                  <strong>Report Configuration</strong>
                  <small>Set up the basic information for your report</small>
                </div>
              </header>
              <label>
                Report Name
                <input value={name} onChange={(event) => setName(event.target.value)} />
              </label>
              <label>
                Report Type
                <Dropdown block value={type} onChange={setType} options={TEMPLATES.map((item) => item.type)} ariaLabel="Report Type" />
              </label>
              <label>
                Description (Optional)
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="e.g. Daily operation summary for Alpha-1 team" rows={3} />
              </label>
            </article>

            <article className="panel rpt-card">
              <header>
                <i>2</i>
                <div>
                  <strong>Data Selection</strong>
                  <small>Choose the data and time range for your report</small>
                </div>
              </header>
              <label>
                Time Range
                <input readOnly value="03 Oct 2026, 00:00  –  03 Oct 2026, 23:59" />
              </label>
              <div className="rpt-entity-label">Entities</div>
              <div className="rpt-entity-tabs">
                {["All", "Groups", "Personnel", "Weapons"].map((item) => (
                  <button key={item} type="button" className={entityTab === item ? "on" : ""} onClick={() => setEntityTab(item)}>{item}</button>
                ))}
              </div>
              <label className="rpt-search">
                <Icon name="search" size={13} />
                <input value={groupQuery} onChange={(event) => setGroupQuery(event.target.value)} placeholder={`Search ${entityTab.toLowerCase()}...`} />
              </label>
              <div className="rpt-checks">
                {visibleGroups.map((item) => (
                  <label key={item.id}>
                    <input type="checkbox" checked={groups.includes(item.id)} onChange={() => toggle(groups, item.id, setGroups)} />
                    <span>{item.name}</span>
                    <em>{item.count}</em>
                  </label>
                ))}
              </div>
              <div className="rpt-entity-label">Data Types</div>
              <div className="rpt-types">
                {DATA_TYPES.map((item) => (
                  <label key={item.id} className={item.tone}>
                    <input type="checkbox" checked={types.includes(item.id)} onChange={() => toggle(types, item.id, setTypes)} />
                    <Icon name={item.icon} size={12} />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </article>

            <article className="panel rpt-card rpt-preview">
              <header>
                <i>3</i>
                <div>
                  <strong>Report Preview</strong>
                  <small>Preview how your report will look</small>
                </div>
                <div className="rpt-preview-tabs">
                  <button type="button" className={preview === "pdf" ? "on" : ""} onClick={() => setPreview("pdf")}>PDF Preview</button>
                  <button type="button" className={preview === "data" ? "on" : ""} onClick={() => setPreview("data")}>Data Preview</button>
                </div>
              </header>
              {preview === "pdf" ? <PdfPreview name={name || active.name} description={description} /> : <DataPreview groups={groups} types={types} sections={sections} />}
            </article>
          </section>

          <section className="panel rpt-content">
            <h2><Icon name="layers" size={14} /> Report Content</h2>
            <div>
              {CONTENTS.map((item) => (
                <label key={item.id} className={sections.includes(item.id) ? "on" : ""}>
                  <input type="checkbox" checked={sections.includes(item.id)} onChange={() => toggle(sections, item.id, setSections)} />
                  <span className={item.tone}><Icon name={item.icon} size={13} /></span>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </label>
              ))}
            </div>
          </section>

          <footer className="rpt-actions">
            <button type="button" onClick={reset}>Reset</button>
            <button type="button" className="primary"><Icon name="file" size={14} /> Generate Report</button>
          </footer>
        </>
      )}
    </div>
  );
}

type ScheduleStatus = "Active" | "Paused" | "Failed";

const SCHEDULES: { id: string; name: string; type: string; icon: IconName; frequency: string; clock: string; next: string; last: string; status: ScheduleStatus; lastClock?: string }[] = [
  { id: "s1", name: "Daily Operation Summary", type: "Operational", icon: "file", frequency: "Daily", clock: "00:00", next: "04 Oct 2026", last: "03 Oct 2026", status: "Active" },
  { id: "s2", name: "Personnel Movement Report", type: "Personnel", icon: "users", frequency: "Daily", clock: "06:00", next: "04 Oct 2026", last: "03 Oct 2026", status: "Active" },
  { id: "s3", name: "Weapon Status Report", type: "Weapon", icon: "crosshair", frequency: "Daily", clock: "06:00", next: "04 Oct 2026", last: "03 Oct 2026", status: "Active" },
  { id: "s4", name: "Geofence Activity Report", type: "Geofence", icon: "pin", frequency: "Daily", clock: "23:00", next: "04 Oct 2026", last: "03 Oct 2026", status: "Active" },
  { id: "s5", name: "Alert Summary Report", type: "Alert & Incident", icon: "warn", frequency: "Hourly", clock: "15:00", next: "03 Oct 2026", last: "03 Oct 2026", status: "Active", lastClock: "14:00" },
  { id: "s6", name: "System Health Report", type: "System", icon: "settings", frequency: "Daily", clock: "00:00", next: "04 Oct 2026", last: "03 Oct 2026", status: "Active" },
  { id: "s7", name: "Communication Log Report", type: "Communication", icon: "signal", frequency: "Daily", clock: "00:00", next: "04 Oct 2026", last: "03 Oct 2026", status: "Paused" },
  { id: "s8", name: "Group Activity Report", type: "Operational", icon: "users", frequency: "Weekly", clock: "Mon 00:00", next: "05 Oct 2026", last: "28 Sep 2026", status: "Active" },
  { id: "s9", name: "Custom Query Export", type: "Forensic", icon: "search", frequency: "Weekly", clock: "Sun 00:00", next: "05 Oct 2026", last: "28 Sep 2026", status: "Active" },
  { id: "s10", name: "Executive Summary", type: "Operational", icon: "chart", frequency: "Monthly", clock: "1st 00:00", next: "01 Nov 2026", last: "01 Oct 2026", status: "Failed" },
  { id: "s11", name: "Armory Audit", type: "Weapon", icon: "crosshair", frequency: "Daily", clock: "08:00", next: "04 Oct 2026", last: "03 Oct 2026", status: "Active" },
  { id: "s12", name: "Gateway Health Report", type: "System", icon: "server", frequency: "Daily", clock: "02:00", next: "04 Oct 2026", last: "03 Oct 2026", status: "Paused" },
];

type HistoryStatus = "Completed" | "Failed" | "Processing";

const HISTORY_SEED: { name: string; type: string; icon: IconName; by: string; iso: string; time: string; status: HistoryStatus; size: string; scope: string; range: string; pages: number }[] = [
  { name: "Operation Alpha - Daily Report", type: "Operational", icon: "chart", by: "Admin", iso: "2026-10-03", time: "23:59", status: "Completed", size: "4.2 MB", scope: "Group: Alpha-1, Alpha-2", range: "03 Oct 2026, 00:00 - 23:59", pages: 18 },
  { name: "Personnel Movement Report", type: "Personnel", icon: "users", by: "Sertu Arif", iso: "2026-10-02", time: "23:59", status: "Completed", size: "3.1 MB", scope: "Group: Alpha-1", range: "02 Oct 2026, 00:00 - 23:59", pages: 12 },
  { name: "Weapon Status Report", type: "Weapon", icon: "crosshair", by: "Admin", iso: "2026-10-02", time: "23:59", status: "Completed", size: "2.8 MB", scope: "Weapons: assigned", range: "02 Oct 2026, 00:00 - 23:59", pages: 8 },
  { name: "Geofence Activity Report", type: "Geofence", icon: "pin", by: "Admin", iso: "2026-10-01", time: "23:59", status: "Completed", size: "5.6 MB", scope: "All geofences", range: "01 Oct 2026, 00:00 - 23:59", pages: 14 },
  { name: "Alert Summary Report", type: "Alert & Incident", icon: "warn", by: "Sertu Arif", iso: "2026-10-01", time: "23:59", status: "Completed", size: "1.9 MB", scope: "All alerts", range: "01 Oct 2026, 00:00 - 23:59", pages: 6 },
  { name: "System Health Report", type: "System", icon: "settings", by: "System", iso: "2026-10-01", time: "23:59", status: "Completed", size: "3.4 MB", scope: "Gateways and mesh", range: "01 Oct 2026, 00:00 - 23:59", pages: 9 },
  { name: "Communication Log Report", type: "Communication", icon: "signal", by: "Admin", iso: "2026-10-01", time: "23:59", status: "Failed", size: "0.8 MB", scope: "All nodes", range: "01 Oct 2026, 00:00 - 23:59", pages: 1 },
  { name: "Investigation Export", type: "Forensic", icon: "search", by: "Sertu Arif", iso: "2026-09-30", time: "23:59", status: "Completed", size: "6.1 MB", scope: "Query: severity critical", range: "30 Sep 2026, 00:00 - 23:59", pages: 22 },
  { name: "Group Activity Report (Alpha-1)", type: "Operational", icon: "chart", by: "Admin", iso: "2026-09-30", time: "23:59", status: "Completed", size: "4.5 MB", scope: "Group: Alpha-1", range: "30 Sep 2026, 00:00 - 23:59", pages: 11 },
  { name: "Custom Query Export", type: "Forensic", icon: "file", by: "Sertu Arif", iso: "2026-09-29", time: "23:59", status: "Completed", size: "8.2 MB", scope: "Custom query", range: "29 Sep 2026, 00:00 - 23:59", pages: 16 },
];

const HISTORY_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fillerDate(offset: number) {
  const day = new Date(Date.UTC(2026, 8, 28));
  day.setUTCDate(28 - (offset % 28));
  const iso = day.toISOString().slice(0, 10);
  const [, month, date] = iso.split("-");
  return { iso, label: `${date} ${HISTORY_MONTHS[Number(month) - 1]} 2026` };
}

function buildHistory() {
  const rows = HISTORY_SEED.map((item, index) => {
    const [, month, date] = item.iso.split("-");
    return { id: `h${index + 1}`, ...item, label: `${date} ${HISTORY_MONTHS[Number(month) - 1]} ${item.iso.slice(0, 4)}` };
  });
  const patterns = HISTORY_SEED.map(({ name, type, icon, scope }) => ({ name, type, icon, scope }));
  const people = ["Admin", "Sertu Arif", "System"];
  const sizes = ["1.4 MB", "2.2 MB", "2.9 MB", "3.7 MB", "4.8 MB", "5.5 MB"];
  for (let index = HISTORY_SEED.length; index < 186; index += 1) {
    const pattern = patterns[index % patterns.length];
    const when = fillerDate(index - HISTORY_SEED.length);
    const status: HistoryStatus = index < 16 ? "Processing" : index < 23 ? "Failed" : "Completed";
    rows.push({
      id: `h${index + 1}`,
      ...pattern,
      by: people[index % people.length],
      iso: when.iso,
      label: when.label,
      time: "23:59",
      status,
      size: sizes[index % sizes.length],
      range: `${when.label}, 00:00 - 23:59`,
      pages: (index % 12) + 4,
    });
  }
  return rows;
}

const HISTORY = buildHistory();

function HistoryBoard() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All Types");
  const [status, setStatus] = useState("All Status");
  const [user, setUser] = useState("All Users");
  const [from, setFrom] = useState("2026-09-01");
  const [to, setTo] = useState("2026-10-03");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [picked, setPicked] = useState<string[]>([HISTORY[0].id]);
  const [selectedId, setSelectedId] = useState<string | null>(HISTORY[0].id);
  const [detailTab, setDetailTab] = useState("Overview");
  const [newestFirst, setNewestFirst] = useState(true);

  const types = ["All Types", ...Array.from(new Set(HISTORY.map((row) => row.type)))];
  const users = ["All Users", ...Array.from(new Set(HISTORY.map((row) => row.by)))];
  const filtered = HISTORY.filter((row) => {
    if (type !== "All Types" && row.type !== type) return false;
    if (status !== "All Status" && row.status !== status) return false;
    if (user !== "All Users" && row.by !== user) return false;
    if (from && row.iso < from) return false;
    if (to && row.iso > to) return false;
    const q = query.trim().toLowerCase();
    return !q || `${row.name} ${row.type} ${row.by}`.toLowerCase().includes(q);
  }).sort((a, b) => {
    const byDate = newestFirst ? b.iso.localeCompare(a.iso) : a.iso.localeCompare(b.iso);
    if (byDate) return byDate;
    const ai = Number(a.id.slice(1));
    const bi = Number(b.id.slice(1));
    return newestFirst ? ai - bi : bi - ai;
  });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const selected = HISTORY.find((row) => row.id === selectedId) ?? null;
  const completed = HISTORY.filter((row) => row.status === "Completed").length;
  const failed = HISTORY.filter((row) => row.status === "Failed").length;
  const processing = HISTORY.filter((row) => row.status === "Processing").length;

  function saveReport(row: (typeof HISTORY)[number]) {
    const blob = new Blob([`${row.name}\nType: ${row.type}\nGenerated: ${row.label} ${row.time}\nBy: ${row.by}\nSize: ${row.size}\nFormat: PDF\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${row.name}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const pageItems: (number | "gap")[] = pages <= 7
    ? Array.from({ length: pages }, (_, index) => index + 1)
    : current <= 4
      ? [1, 2, 3, 4, 5, "gap", pages]
      : current >= pages - 3
        ? [1, "gap", pages - 4, pages - 3, pages - 2, pages - 1, pages]
        : [1, "gap", current - 1, current, current + 1, "gap", pages];

  return (
    <section className="rpt-hist">
      <div className="rpt-hist-stats">
        <article className="panel">
          <span className="blue"><Icon name="file" size={16} /></span>
          <small>Total Reports</small>
          <strong>{HISTORY.length}</strong>
          <em className="up">↑ 12% <i>vs previous period</i></em>
        </article>
        <article className="panel">
          <span className="green"><Icon name="check" size={16} /></span>
          <small>Completed</small>
          <strong>{completed}</strong>
          <b><i><em style={{ width: `${Math.round((completed / HISTORY.length) * 1000) / 10}%` }} /></i>{Math.round((completed / HISTORY.length) * 1000) / 10}%</b>
        </article>
        <article className="panel">
          <span className="red"><Icon name="close" size={14} /></span>
          <small>Failed</small>
          <strong>{failed}</strong>
          <b className="red"><i><em style={{ width: `${Math.round((failed / HISTORY.length) * 1000) / 10}%` }} /></i>{Math.round((failed / HISTORY.length) * 1000) / 10}%</b>
        </article>
        <article className="panel">
          <span className="blue"><Icon name="clock" size={16} /></span>
          <small>Processing</small>
          <strong>{processing}</strong>
          <b className="blue"><i><em style={{ width: `${Math.round((processing / HISTORY.length) * 1000) / 10}%` }} /></i>{Math.round((processing / HISTORY.length) * 1000) / 10}%</b>
        </article>
      </div>

      <div className={`rpt-hist-body${selected ? " open" : ""}`}>
        <article className="panel">
          <header>
            <h2>Report History ({filtered.length})</h2>
            <div>
              <label><Icon name="search" size={13} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search reports by name, type, or generated by..." /></label>
              <Dropdown value={type} onChange={(value) => { setType(value); setPage(1); }} options={types} ariaLabel="Report type" />
              <Dropdown value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={["All Status", "Completed", "Failed", "Processing"]} ariaLabel="Status" />
              <Dropdown value={user} onChange={(value) => { setUser(value); setPage(1); }} options={users} ariaLabel="User" />
              <CalendarRange from={from} to={to} onChange={(nextFrom, nextTo) => { setFrom(nextFrom); setTo(nextTo); setPage(1); }} />
            </div>
          </header>
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" checked={visible.length > 0 && visible.every((row) => picked.includes(row.id))} onChange={(event) => setPicked(event.target.checked ? Array.from(new Set([...picked, ...visible.map((row) => row.id)])) : picked.filter((id) => !visible.some((row) => row.id === id)))} /></th>
                <th>Report Name</th><th>Type</th><th>Generated By</th>
                <th><button type="button" onClick={() => setNewestFirst(!newestFirst)}>Generated At <Icon name="chevron" size={12} /></button></th>
                <th>Status</th><th>File Size</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} className={selectedId === row.id ? "on" : ""} onClick={() => { setSelectedId(row.id); setDetailTab("Overview"); }}>
                  <td><input type="checkbox" checked={picked.includes(row.id)} onClick={(event) => event.stopPropagation()} onChange={() => setPicked(picked.includes(row.id) ? picked.filter((id) => id !== row.id) : [...picked, row.id])} /></td>
                  <td><Icon name={row.icon} size={13} /> {row.name}</td>
                  <td>{row.type}</td>
                  <td>{row.by}</td>
                  <td>{row.label}<small>{row.time}</small></td>
                  <td><span className={row.status.toLowerCase()}>{row.status}</span></td>
                  <td>{row.size}</td>
                  <td>
                    <button type="button" aria-label="View" onClick={(event) => { event.stopPropagation(); setSelectedId(row.id); setDetailTab("Overview"); }}><Icon name="eye" size={13} /></button>
                    <button type="button" aria-label="Download" onClick={(event) => { event.stopPropagation(); saveReport(row); }}><Icon name="download" size={13} /></button>
                    <button type="button" aria-label="More" onClick={(event) => { event.stopPropagation(); setSelectedId(row.id); setDetailTab("Details"); }}><Icon name="more" size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <footer>
            <div className="cmd-pager">
              <button type="button" aria-label="Previous" disabled={current === 1} onClick={() => setPage(current - 1)}><Icon name="chevron" size={14} /></button>
              {pageItems.map((item, index) => item === "gap" ? <span key={`gap-${index}`}>...</span> : <button key={item} type="button" className={current === item ? "on" : ""} onClick={() => setPage(item)}>{item}</button>)}
              <button type="button" aria-label="Next" disabled={current === pages} onClick={() => setPage(current + 1)}><Icon name="chevron" size={14} /></button>
            </div>
            <Dropdown value={`${pageSize} / page`} onChange={(value) => { setPageSize(Number(value.replace(" / page", ""))); setPage(1); }} options={["10 / page", "20 / page"]} ariaLabel="Page size" />
            <p>Showing {filtered.length ? (current - 1) * pageSize + 1 : 0} - {Math.min(current * pageSize, filtered.length)} of {filtered.length}</p>
          </footer>
        </article>

        {selected ? (
          <aside className="panel">
            <header>
              <h2><Icon name="file" size={14} /> {selected.name}</h2>
              <span className={selected.status.toLowerCase()}>{selected.status}</span>
              <button type="button" aria-label="Close" onClick={() => setSelectedId(null)}><Icon name="close" size={14} /></button>
            </header>
            <nav>
              {["Overview", "Details", "Download", "Related Reports"].map((item) => (
                <button key={item} type="button" className={detailTab === item ? "on" : ""} onClick={() => setDetailTab(item)}>{item}</button>
              ))}
            </nav>
            {detailTab === "Overview" ? (
              <>
                <div className="rpt-hist-preview">
                  <div className="rpt-hist-cover">
                    <small>TACTICAL TRACKER</small>
                    <b>CONFIDENTIAL</b>
                    <strong>{selected.name}</strong>
                    <em>{selected.label}</em>
                  </div>
                  <div className="rpt-hist-mini">
                    <img src="/images/login-map.png" alt="" />
                    <div><span>20</span><small>Personnel</small></div>
                    <div><span>42.5 km</span><small>Distance</small></div>
                    <i />
                  </div>
                  <small>Page 1 of {selected.pages}</small>
                </div>
                <h3>Report Information</h3>
                <dl>
                  <dt>Report Type</dt><dd>{selected.type}</dd>
                  <dt>Generated At</dt><dd>{selected.label}, {selected.time}</dd>
                  <dt>Generated By</dt><dd>{selected.by}</dd>
                  <dt>Entities Scope</dt><dd>{selected.scope}</dd>
                  <dt>Time Range</dt><dd>{selected.range}</dd>
                  <dt>Status</dt><dd><span className={selected.status.toLowerCase()}>{selected.status}</span></dd>
                  <dt>File Size</dt><dd>{selected.size}</dd>
                  <dt>Format</dt><dd>PDF</dd>
                </dl>
              </>
            ) : null}
            {detailTab === "Details" ? (
              <div className="rpt-hist-note">
                <p>{selected.name} covers {selected.scope.toLowerCase()} for {selected.range}.</p>
                <p>Generated by {selected.by} on {selected.label} at {selected.time}. The file is {selected.size} and runs {selected.pages} pages.</p>
              </div>
            ) : null}
            {detailTab === "Download" ? (
              <div className="rpt-hist-note">
                <p>{selected.name}.pdf</p>
                <p>{selected.size} · PDF · {selected.status}</p>
                <button type="button" onClick={() => saveReport(selected)}>Download</button>
              </div>
            ) : null}
            {detailTab === "Related Reports" ? (
              <div className="rpt-hist-related">
                {HISTORY.filter((row) => row.type === selected.type && row.id !== selected.id).slice(0, 5).map((row) => (
                  <button key={row.id} type="button" onClick={() => { setSelectedId(row.id); setDetailTab("Overview"); }}>
                    <strong>{row.name}</strong>
                    <small>{row.label} · {row.size}</small>
                  </button>
                ))}
              </div>
            ) : null}
            <footer>
              <button type="button" onClick={() => setDetailTab("Overview")}><Icon name="eye" size={13} /> View Report</button>
              <button type="button" onClick={() => saveReport(selected)}><Icon name="download" size={13} /> Download</button>
              <button type="button" aria-label="More" onClick={() => setDetailTab("Details")}><Icon name="more" size={14} /></button>
            </footer>
          </aside>
        ) : null}
      </div>
    </section>
  );
}

function ScheduleBoard() {
  const [rows, setRows] = useState(SCHEDULES);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All Types");
  const [status, setStatus] = useState("All Status");
  const [view, setView] = useState<"table" | "cards">("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [picked, setPicked] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [reportName, setReportName] = useState("Operation Alpha - Daily Report");
  const [frequency, setFrequency] = useState("Daily");
  const [clock, setClock] = useState("00:00");
  const [range, setRange] = useState("Last 24 hours");
  const [format, setFormat] = useState("PDF");
  const [recipients, setRecipients] = useState<string[]>(["Admin"]);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [flags, setFlags] = useState({ email: true, charts: true, compress: false });

  const chosen = TEMPLATES.find((item) => item.id === templateId) ?? TEMPLATES[0];
  const types = ["All Types", ...Array.from(new Set(rows.map((row) => row.type)))];
  const filtered = rows.filter((row) => {
    if (type !== "All Types" && row.type !== type) return false;
    if (status !== "All Status" && row.status !== status) return false;
    return row.name.toLowerCase().includes(query.trim().toLowerCase());
  });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const active = rows.filter((row) => row.status === "Active").length;
  const paused = rows.filter((row) => row.status === "Paused").length;
  const failed = rows.filter((row) => row.status === "Failed").length;
  const total = rows.length || 1;

  function resetForm() {
    setTemplateId(TEMPLATES[0].id);
    setReportName("Operation Alpha - Daily Report");
    setFrequency("Daily");
    setClock("00:00");
    setRange("Last 24 hours");
    setFormat("PDF");
    setRecipients(["Admin"]);
    setRecipientQuery("");
    setFlags({ email: true, charts: true, compress: false });
  }

  function createSchedule() {
    const name = reportName.trim() || chosen.name;
    setRows((list) => [
      {
        id: `s-${Date.now()}`,
        name,
        type: chosen.type.replace(" Report", ""),
        icon: chosen.icon,
        frequency,
        clock,
        next: "04 Oct 2026",
        last: "—",
        status: "Active",
      },
      ...list,
    ]);
    setPage(1);
    resetForm();
  }

  function addRecipient() {
    const next = recipientQuery.trim();
    if (!next || recipients.includes(next)) return;
    setRecipients((list) => [...list, next]);
    setRecipientQuery("");
  }

  return (
    <section className="rpt-sched">
      <div className="rpt-sched-stats">
        <article className="panel">
          <span className="blue"><Icon name="clock" size={16} /></span>
          <small>Total Schedules</small>
          <strong>{rows.length}</strong>
          <em className="up">↑ 2 <i>vs last month</i></em>
        </article>
        <article className="panel">
          <span className="green"><Icon name="play" size={14} /></span>
          <small>Active Schedules</small>
          <strong>{active}</strong>
          <b><i><em style={{ width: `${Math.round((active / total) * 100)}%` }} /></i>{Math.round((active / total) * 100)}%</b>
        </article>
        <article className="panel">
          <span className="amber"><Icon name="pause" size={14} /></span>
          <small>Paused Schedules</small>
          <strong>{paused}</strong>
          <b className="amber"><i><em style={{ width: `${Math.round((paused / total) * 100)}%` }} /></i>{Math.round((paused / total) * 100)}%</b>
        </article>
        <article className="panel">
          <span className="red"><Icon name="close" size={14} /></span>
          <small>Failed Schedules</small>
          <strong>{failed}</strong>
          <b className="red"><i><em style={{ width: `${Math.round((failed / total) * 100)}%` }} /></i>{Math.round((failed / total) * 100)}%</b>
        </article>
      </div>

      <div className="rpt-sched-body">
        <article className="panel">
          <header>
            <h2>Scheduled Reports ({rows.length})</h2>
            <div>
              <label><Icon name="search" size={13} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search scheduled reports..." /></label>
              <Dropdown value={type} onChange={(value) => { setType(value); setPage(1); }} options={types} ariaLabel="Schedule type" />
              <Dropdown value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={["All Status", "Active", "Paused", "Failed"]} ariaLabel="Schedule status" />
              <div className="rpt-view">
                <button type="button" className={view === "table" ? "on" : ""} aria-label="Table" onClick={() => setView("table")}><Icon name="grid" size={14} /></button>
                <button type="button" className={view === "cards" ? "on" : ""} aria-label="Cards" onClick={() => setView("cards")}><Icon name="menu" size={14} /></button>
              </div>
            </div>
          </header>
          {view === "table" ? (
            <table>
              <thead>
                <tr>
                  <th><input type="checkbox" checked={visible.length > 0 && visible.every((row) => picked.includes(row.id))} onChange={(event) => setPicked(event.target.checked ? Array.from(new Set([...picked, ...visible.map((row) => row.id)])) : picked.filter((id) => !visible.some((row) => row.id === id)))} /></th>
                  <th>Name</th><th>Report Type</th><th>Frequency</th><th>Next Run</th><th>Last Run</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id}>
                    <td><input type="checkbox" checked={picked.includes(row.id)} onChange={() => setPicked(picked.includes(row.id) ? picked.filter((id) => id !== row.id) : [...picked, row.id])} /></td>
                    <td><Icon name={row.icon} size={13} /> {row.name}</td>
                    <td>{row.type}</td>
                    <td>{row.frequency}<small>{row.clock}</small></td>
                    <td>{row.next}<small>{row.clock}</small></td>
                    <td>{row.last}<small>{row.last === "—" ? "" : row.lastClock ?? row.clock}</small></td>
                    <td><span className={row.status.toLowerCase()}>{row.status}</span></td>
                    <td><button type="button" aria-label="Actions" onClick={() => setRows(rows.map((item) => item.id === row.id ? { ...item, status: item.status === "Active" ? "Paused" : "Active" } : item))}><Icon name="more" size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="rpt-sched-cards">
              {visible.map((row) => (
                <button key={row.id} type="button" onClick={() => setRows(rows.map((item) => item.id === row.id ? { ...item, status: item.status === "Active" ? "Paused" : "Active" } : item))}>
                  <Icon name={row.icon} size={14} />
                  <strong>{row.name}</strong>
                  <small>{row.frequency} · {row.clock}</small>
                  <em className={row.status.toLowerCase()}>{row.status}</em>
                </button>
              ))}
            </div>
          )}
          <footer>
            <div className="cmd-pager">
              <button type="button" aria-label="Previous" disabled={current === 1} onClick={() => setPage(current - 1)}><Icon name="chevron" size={14} /></button>
              {Array.from({ length: pages }, (_, index) => (
                <button key={index} type="button" className={current === index + 1 ? "on" : ""} onClick={() => setPage(index + 1)}>{index + 1}</button>
              ))}
              <button type="button" aria-label="Next" disabled={current === pages} onClick={() => setPage(current + 1)}><Icon name="chevron" size={14} /></button>
            </div>
            <Dropdown value={`${pageSize} / page`} onChange={(value) => { setPageSize(Number(value.replace(" / page", ""))); setPage(1); }} options={["10 / page", "12 / page"]} ariaLabel="Page size" />
            <p>Showing {filtered.length ? (current - 1) * pageSize + 1 : 0} - {Math.min(current * pageSize, filtered.length)} of {filtered.length} schedules</p>
          </footer>
        </article>

        <form className="panel" onSubmit={(event) => { event.preventDefault(); createSchedule(); }}>
          <h2><Icon name="calendar" size={14} /> Create Scheduled Report</h2>
          <label>Template
            <Dropdown block value={TEMPLATES.find((item) => item.id === templateId)?.label ?? ""} onChange={(label) => { const next = TEMPLATES.find((item) => item.label === label); if (!next) return; setTemplateId(next.id); setReportName(next.name); }} options={TEMPLATES.map((item) => item.label)} ariaLabel="Template" />
          </label>
          <p>{chosen.hint}</p>
          <label>Report Name<input value={reportName} onChange={(event) => setReportName(event.target.value)} /></label>
          <div className="rpt-sched-split">
            <label>Frequency
              <Dropdown block value={frequency} onChange={setFrequency} options={["Hourly", "Daily", "Weekly", "Monthly"]} ariaLabel="Frequency" />
            </label>
            <label>Time
              <span><Icon name="clock" size={13} /><input value={clock} onChange={(event) => setClock(event.target.value)} /></span>
            </label>
          </div>
          <label>Data Range
            <Dropdown block value={range} onChange={setRange} options={["Last 24 hours", "Last 7 days", "Last 30 days"]} ariaLabel="Data range" />
          </label>
          <label>Recipients
            <span className="rpt-recip">
              {recipients.map((item) => <em key={item}>{item}<button type="button" aria-label={`Remove ${item}`} onClick={() => setRecipients(recipients.filter((name) => name !== item))}><Icon name="close" size={10} /></button></em>)}
              <input value={recipientQuery} onChange={(event) => setRecipientQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addRecipient(); } }} placeholder="Search users or groups..." />
            </span>
          </label>
          <label>Format
            <Dropdown block value={format} onChange={setFormat} options={["PDF", "CSV"]} ariaLabel="Format" />
          </label>
          <label className="check"><input type="checkbox" checked={flags.email} onChange={(event) => setFlags({ ...flags, email: event.target.checked })} /> Attach to email</label>
          <label className="check"><input type="checkbox" checked={flags.charts} onChange={(event) => setFlags({ ...flags, charts: event.target.checked })} /> Include charts and visualizations</label>
          <label className="check"><input type="checkbox" checked={flags.compress} onChange={(event) => setFlags({ ...flags, compress: event.target.checked })} /> Compress large files</label>
          <div className="rpt-sched-actions">
            <button type="button" onClick={resetForm}>Cancel</button>
            <button type="submit" className="primary"><Icon name="calendar" size={13} /> Create Schedule</button>
          </div>
        </form>
      </div>
    </section>
  );
}

function TemplateGallery({
  query,
  category,
  sort,
  view,
  onQuery,
  onCategory,
  onSort,
  onView,
  onUse,
  onClear,
}: {
  query: string;
  category: string;
  sort: string;
  view: "grid" | "list";
  onQuery: (value: string) => void;
  onCategory: (value: string) => void;
  onSort: (value: string) => void;
  onView: (value: "grid" | "list") => void;
  onUse: (id: string) => void;
  onClear: () => void;
}) {
  const q = query.trim().toLowerCase();
  const items = CATALOG.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (!q) return true;
    return `${item.title} ${item.hint}`.toLowerCase().includes(q);
  }).sort((a, b) => sort === "Name (Z - A)" ? b.title.localeCompare(a.title) : a.title.localeCompare(b.title));

  return (
    <section className="rpt-gallery">
      <div className="rpt-gallery-tools">
        <label>
          <Icon name="search" size={14} />
          <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search templates by name or description..." />
        </label>
        <Dropdown value={category === "all" ? "All Categories" : CATEGORIES.find((item) => item.id === category)?.label ?? "All Categories"} onChange={(label) => { const next = CATEGORIES.find((item) => item.label === label); onCategory(next?.id ?? "all"); }} options={["All Categories", ...CATEGORIES.filter((item) => item.id !== "all").map((item) => item.label)]} ariaLabel="Category" />
        <button type="button" onClick={onClear}><Icon name="filter" size={13} /> Clear Filters</button>
      </div>

      <h2>Template Categories</h2>
      <div className="rpt-cats">
        {CATEGORIES.map((item) => {
          const count = item.id === "all" ? CATALOG.length : CATALOG.filter((card) => card.category === item.id).length;
          return (
            <button key={item.id} type="button" className={`rpt-cat ${item.tone}${category === item.id ? " on" : ""}`} onClick={() => onCategory(item.id)}>
              <span><Icon name={item.icon} size={15} /></span>
              <strong>{item.label}</strong>
              <small>{count} template{count === 1 ? "" : "s"}</small>
            </button>
          );
        })}
      </div>

      <div className="rpt-gallery-head">
        <h2>Available Templates</h2>
        <label>
          Sort by
          <Dropdown value={sort} onChange={onSort} options={["Name (A - Z)", "Name (Z - A)"]} ariaLabel="Sort" />
        </label>
        <div className="rpt-view">
          <button type="button" className={view === "grid" ? "on" : ""} aria-label="Grid" onClick={() => onView("grid")}><Icon name="grid" size={14} /></button>
          <button type="button" className={view === "list" ? "on" : ""} aria-label="List" onClick={() => onView("list")}><Icon name="menu" size={14} /></button>
        </div>
      </div>

      <div className={`rpt-cards${view === "list" ? " list" : ""}`}>
        {items.map((item) => (
          <article key={item.id} className="panel">
            <div className={`rpt-shot ${item.shot}`} aria-hidden="true"><Shot kind={item.shot} /></div>
            <h3>{item.title}</h3>
            <p>{item.hint}</p>
            <div className="rpt-tags">
              {item.tags.map((tag) => <span key={tag.label} className={tag.tone}>{tag.label}</span>)}
            </div>
            <footer>
              <button type="button" onClick={() => onUse(item.id)}><Icon name="eye" size={13} /> Preview</button>
              <button type="button" className="primary" onClick={() => onUse(item.id)}>Use Template</button>
            </footer>
          </article>
        ))}
        {!items.length ? <p className="rpt-none">No templates match the current filters.</p> : null}
      </div>
    </section>
  );
}

function Shot({ kind }: { kind: string }) {
  if (kind === "weapon") return <img src="/images/weapon-rifle-plain.jpg" alt="" />;
  if (kind === "alerts") return <div className="shot-alerts"><i /><i /><i /><b>24</b><b>8</b><b>3</b></div>;
  if (kind === "health") return <div className="shot-health"><strong>18/20</strong><em>99.2%</em><span /></div>;
  if (kind === "table") return <div className="shot-table"><span>GW-01 Uplink</span><span>GW-02 Downlink</span><span>Node-14 Join</span></div>;
  if (kind === "kpis") return <div className="shot-kpis"><b>20</b><b>18</b><b>7</b><b>12</b></div>;
  if (kind === "soldier") return <div className="shot-soldier" />;
  return <div className={`shot-map ${kind}`} />;
}

function PdfPreview({ name, description }: { name: string; description: string }) {
  return (
    <div className="rpt-doc">
      <div className="rpt-doc-top">
        <div>
          <strong><Icon name="shield" size={14} /> TACTICAL TRACKER</strong>
          <small>Command Post</small>
        </div>
        <div>
          <em>CONFIDENTIAL</em>
          <small>Generated on 03 Oct 2026, 23:59</small>
        </div>
      </div>
      <h3>{name}</h3>
      <p className="rpt-doc-range">03 Oct 2026, 00:00 – 03 Oct 2026, 23:59</p>
      <h4>Executive Summary</h4>
      <p>{description || "Operation Alpha-1 and Alpha-2 operated in the Northern Sector with a total of 20 personnel. All objectives completed with no critical incidents. 3 minor alerts detected and resolved."}</p>
      <div className="rpt-kpis">
        <span><Icon name="users" size={14} /><b>20</b><small>Total Personnel</small></span>
        <span><Icon name="route" size={14} /><b>42.5 km</b><small>Total Distance</small></span>
        <span><Icon name="warn" size={14} /><b>3</b><small>Total Alerts</small></span>
        <span><Icon name="check" size={14} /><b>98%</b><small>Mission Success</small></span>
      </div>
      <h4>Movement Overview</h4>
      <div className="rpt-map">
        <svg viewBox="0 0 360 92" preserveAspectRatio="none" aria-hidden="true">
          <path d="M20 70 C 70 68, 90 30, 140 34 S 190 20, 230 40 280 70 340 28" />
          <circle cx="48" cy="62" r="5" className="a" />
          <circle cx="150" cy="32" r="5" className="b" />
          <circle cx="214" cy="36" r="5" className="c" />
          <circle cx="300" cy="48" r="5" className="d" />
        </svg>
        <div className="rpt-map-legend">
          <span><i className="a" /> Alpha-1</span>
          <span><i className="b" /> Alpha-2</span>
          <span><i className="c" /> Alert Event</span>
          <span><i className="d" /> Geofence</span>
        </div>
      </div>
      <div className="rpt-doc-split">
        <div>
          <h4>Activity Timeline</h4>
          <div className="rpt-bars">
            {BARS.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
          </div>
          <div className="rpt-bar-axis"><span>00:00</span><span>08:00</span><span>16:00</span><span>20:00</span></div>
        </div>
        <div>
          <h4>Event Type Distribution</h4>
          <div className="rpt-donut-row">
            <div className="rpt-donut" />
            <ul>
              {DONUT.map((item) => (
                <li key={item.label}><i style={{ background: item.color }} />{item.label}<b>{item.value}</b></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataPreview({ groups, types, sections }: { groups: string[]; types: string[]; sections: string[] }) {
  return (
    <dl className="rpt-data">
      <div><dt>Groups</dt><dd>{groups.length ? groups.join(", ") : "None"}</dd></div>
      <div><dt>Data types</dt><dd>{types.length ? types.join(", ") : "None"}</dd></div>
      <div><dt>Sections</dt><dd>{sections.length ? sections.join(", ") : "None"}</dd></div>
      <div><dt>Window</dt><dd>03 Oct 2026, 00:00 – 23:59</dd></div>
    </dl>
  );
}
