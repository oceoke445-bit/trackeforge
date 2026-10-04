"use client";

import { useMemo, useState } from "react";
import Icon, { type IconName } from "@/components/ui/icon";

type Activity = {
  id: string;
  date: string;
  time: string;
  event: string;
  detail: string;
  category: string;
  categoryTone: string;
  actor: string;
  actorRole: string;
  actorTone: string;
  target: string;
  targetKind: string;
  action: string;
  actionTone: string;
  actionLabel: string;
  outcome: "Success" | "Denied";
  description: string;
  extra?: [string, string][];
};

const activities: Activity[] = [
  {
    id: "act-1",
    date: "10/05/2026",
    time: "14:32:18",
    event: "User Created",
    detail: "Created new human identity",
    category: "User Access",
    categoryTone: "blue",
    actor: "Superadmin",
    actorRole: "Superadmin",
    actorTone: "blue",
    target: "Andi Pratama",
    targetKind: "User",
    action: "Create",
    actionTone: "green",
    actionLabel: "Create User",
    outcome: "Success",
    description: "Created new human identity with username and email.",
    extra: [
      ["User ID", "12"],
      ["Username", "andi.pratama"],
      ["Email", "andi@trackforge.id"],
      ["Department", "Command Operations"],
      ["Title", "Operations Commander"],
    ],
  },
  {
    id: "act-2",
    date: "10/05/2026",
    time: "14:28:41",
    event: "Role Assigned",
    detail: "Assigned role to user",
    category: "User Access",
    categoryTone: "blue",
    actor: "Superadmin",
    actorRole: "Superadmin",
    actorTone: "blue",
    target: "Andi Pratama",
    targetKind: "User",
    action: "Assign",
    actionTone: "blue",
    actionLabel: "Assign Role",
    outcome: "Success",
    description: "Assigned role to user.",
  },
  {
    id: "act-3",
    date: "10/05/2026",
    time: "13:54:29",
    event: "User Login",
    detail: "User logged in to platform",
    category: "Authentication",
    categoryTone: "violet",
    actor: "Andi Pratama",
    actorRole: "Operations Commander",
    actorTone: "cyan",
    target: "Platform",
    targetKind: "Session",
    action: "Login",
    actionTone: "green",
    actionLabel: "Login",
    outcome: "Success",
    description: "User logged in to platform.",
  },
  {
    id: "act-4",
    date: "10/05/2026",
    time: "12:41:17",
    event: "View History",
    detail: "Viewed soldier movement history",
    category: "History",
    categoryTone: "amber",
    actor: "Andi Pratama",
    actorRole: "Operations Commander",
    actorTone: "cyan",
    target: "S-104",
    targetKind: "Soldier",
    action: "View",
    actionTone: "violet",
    actionLabel: "View History",
    outcome: "Success",
    description: "Viewed soldier movement history.",
  },
  {
    id: "act-5",
    date: "10/05/2026",
    time: "11:23:05",
    event: "Update Geofence",
    detail: "Updated geofence area",
    category: "Operations",
    categoryTone: "green",
    actor: "Budi Santoso",
    actorRole: "Operations Officer",
    actorTone: "amber",
    target: "Alpha Zone",
    targetKind: "Geofence",
    action: "Update",
    actionTone: "amber",
    actionLabel: "Update Geofence",
    outcome: "Success",
    description: "Updated geofence area.",
  },
  {
    id: "act-6",
    date: "10/05/2026",
    time: "10:17:33",
    event: "Alert Acknowledged",
    detail: "Acknowledged alert",
    category: "Alerts",
    categoryTone: "red",
    actor: "Rina Putri",
    actorRole: "Field Operator",
    actorTone: "violet",
    target: "S-104",
    targetKind: "Soldier",
    action: "Acknowledge",
    actionTone: "green",
    actionLabel: "Acknowledge Alert",
    outcome: "Success",
    description: "Acknowledged alert.",
  },
  {
    id: "act-7",
    date: "10/05/2026",
    time: "09:42:11",
    event: "Weapon Updated",
    detail: "Updated weapon information",
    category: "Weapons",
    categoryTone: "amber",
    actor: "Tono Wijaya",
    actorRole: "Device & Fleet Admin",
    actorTone: "blue",
    target: "Rifle-07",
    targetKind: "Weapon",
    action: "Update",
    actionTone: "amber",
    actionLabel: "Update Weapon",
    outcome: "Success",
    description: "Updated weapon information.",
  },
  {
    id: "act-8",
    date: "10/05/2026",
    time: "09:18:28",
    event: "Export Report",
    detail: "Exported operations report",
    category: "Reports",
    categoryTone: "cyan",
    actor: "Budi Santoso",
    actorRole: "Operations Officer",
    actorTone: "amber",
    target: "Operations Q4",
    targetKind: "Report",
    action: "Export",
    actionTone: "blue",
    actionLabel: "Export Report",
    outcome: "Success",
    description: "Exported operations report.",
  },
  {
    id: "act-9",
    date: "10/05/2026",
    time: "08:53:17",
    event: "Settings Updated",
    detail: "Updated system settings",
    category: "Settings",
    categoryTone: "slate",
    actor: "Superadmin",
    actorRole: "Superadmin",
    actorTone: "blue",
    target: "Settings",
    targetKind: "Settings",
    action: "Update",
    actionTone: "amber",
    actionLabel: "Update Settings",
    outcome: "Success",
    description: "Updated system settings.",
  },
  {
    id: "act-10",
    date: "10/05/2026",
    time: "08:14:06",
    event: "User Access Denied",
    detail: "Attempted to access restricted page",
    category: "User Access",
    categoryTone: "blue",
    actor: "Dimas Arif",
    actorRole: "Viewer",
    actorTone: "green",
    target: "Settings",
    targetKind: "Page",
    action: "Access",
    actionTone: "red",
    actionLabel: "Access Page",
    outcome: "Denied",
    description: "Attempted to access restricted page.",
  },
];

const categoryCounts: [string, number][] = [
  ["Authentication", 124],
  ["Personnel", 312],
  ["Groups", 218],
  ["Weapons", 86],
  ["Operations", 420],
  ["Alerts", 201],
  ["Tickets", 54],
  ["History", 298],
  ["Communication", 77],
  ["User Access", 421],
  ["Settings", 31],
];

const ranges = ["All Time", "Last 1 Hour", "Last 24 Hours", "Last 7 Days", "Last 30 Days", "Custom"];

function letter(name: string) {
  return name.slice(0, 1).toUpperCase();
}

export default function ActivityLogPage() {
  const [query, setQuery] = useState("");
  const [actorQuery, setActorQuery] = useState("");
  const [range, setRange] = useState("All Time");
  const [enabled, setEnabled] = useState<string[]>(categoryCounts.map(([name]) => name));
  const [action, setAction] = useState("All");
  const [outcome, setOutcome] = useState("All");
  const [actor, setActor] = useState("All");
  const [sort, setSort] = useState("recent");
  const [selectedId, setSelectedId] = useState<string | null>(activities[0].id);
  const [checked, setChecked] = useState<string[]>([]);

  const actors = [...new Set(activities.map((item) => item.actor))];
  const actions = [...new Set(activities.map((item) => item.action))];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const actorQ = actorQuery.trim().toLowerCase();
    const rows = activities.filter((item) => {
      if (item.category !== "Reports" && !enabled.includes(item.category)) return false;
      if (action !== "All" && item.action !== action) return false;
      if (outcome !== "All" && item.outcome !== outcome) return false;
      if (actor !== "All" && item.actor !== actor) return false;
      if (actorQ && !`${item.actor} ${item.actorRole}`.toLowerCase().includes(actorQ)) return false;
      if (!q) return true;
      return [item.event, item.detail, item.actor, item.target, item.category, item.action].join(" ").toLowerCase().includes(q);
    });
    return sort === "recent" ? rows : [...rows].reverse();
  }, [action, actor, actorQuery, enabled, outcome, query, sort]);

  const selected = selectedId ? visible.find((item) => item.id === selectedId) ?? null : null;
  const allChecked = visible.length > 0 && visible.every((item) => checked.includes(item.id));

  function resetFilters() {
    setRange("All Time");
    setEnabled(categoryCounts.map(([name]) => name));
    setAction("All");
    setOutcome("All");
    setActor("All");
    setActorQuery("");
    setQuery("");
    setSort("recent");
    setSelectedId(activities[0].id);
  }

  return (
    <div className="alog-screen">
      <header className="alog-top">
        <div>
          <h1>Activity Log</h1>
          <p>Monitor and review all user and system activities across the TrackForge platform.</p>
        </div>
        <div className="alog-top-actions">
          <button type="button" className="alog-export">
            <Icon name="download" size={14} /> Export
          </button>
          <button type="button" className="alog-range">
            <Icon name="calendar" size={14} />
            Oct 1, 2026 - Oct 10, 2026
            <Icon name="chevron" size={13} />
          </button>
        </div>
      </header>

      <div className="alog-stats">
        <Stat icon="chart" tone="blue" label="Total Activities" value="1,842" delta="+12%" spark="up" />
        <Stat icon="user" tone="green" label="User Actions" value="1,517" delta="+8%" spark="up" />
        <Stat icon="settings" tone="violet" label="System Actions" value="284" delta="+5%" spark="up" />
        <Stat icon="warn" tone="red" label="Failed Actions" value="41" delta="-32%" spark="down" />
      </div>

      <div className={`alog-workspace${selected ? "" : " solo"}`}>
        <aside className="alog-filters">
          <header>
            <strong><Icon name="filter" size={14} /> Filters</strong>
            <button type="button" onClick={resetFilters}>Reset</button>
          </header>
          <section>
            <small>Time Range</small>
            <div className="alog-range-list">
              {ranges.map((label) => (
                <button key={label} type="button" className={range === label ? "on" : ""} onClick={() => setRange(label)}>{label}</button>
              ))}
            </div>
          </section>
          <section>
            <small>Category</small>
            <div className="alog-checks">
              {categoryCounts.map(([name, count]) => (
                <label key={name}>
                  <input
                    type="checkbox"
                    checked={enabled.includes(name)}
                    onChange={() => setEnabled((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name])}
                  />
                  <span>{name}</span>
                  <b>{count}</b>
                </label>
              ))}
            </div>
          </section>
          <section>
            <small>Action</small>
            <label className="alog-filter">
              <select aria-label="Action" value={action} onChange={(event) => setAction(event.target.value)}>
                <option value="All">All Actions</option>
                {actions.map((item) => <option key={item}>{item}</option>)}
              </select>
              <Icon name="chevron" size={13} />
            </label>
          </section>
          <section>
            <small>Outcome</small>
            <label className="alog-filter">
              <select aria-label="Outcome" value={outcome} onChange={(event) => setOutcome(event.target.value)}>
                <option>All</option>
                <option>Success</option>
                <option>Denied</option>
              </select>
              <Icon name="chevron" size={13} />
            </label>
          </section>
          <section>
            <small>Actor</small>
            <label className="alog-filter">
              <select aria-label="Actor" value={actor} onChange={(event) => setActor(event.target.value)}>
                <option value="All">All Users</option>
                {actors.map((item) => <option key={item}>{item}</option>)}
              </select>
              <Icon name="chevron" size={13} />
            </label>
            <label className="alog-search alog-actor-search">
              <Icon name="search" size={14} />
              <input value={actorQuery} onChange={(event) => setActorQuery(event.target.value)} placeholder="Search actor..." />
            </label>
          </section>
        </aside>

        <section className="alog-main">
          <div className="alog-toolbar">
            <label className="alog-search">
              <Icon name="search" size={15} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search action, target, or details..." />
            </label>
            <label className="alog-filter">
              <select aria-label="Sort" value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="recent">Sort: Most Recent</option>
                <option value="oldest">Sort: Oldest</option>
              </select>
              <Icon name="chevron" size={13} />
            </label>
            <div className="alog-view-toggle" role="group" aria-label="Layout">
              <button type="button" className="on" aria-label="Table"><Icon name="grid" size={14} /></button>
              <button type="button" aria-label="Rows"><Icon name="menu" size={14} /></button>
            </div>
            <button type="button" className="alog-columns"><Icon name="layers" size={14} /> Columns</button>
          </div>
          <div className="alog-table-wrap">
            <table className="alog-table alog-activity-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Select page"
                      checked={allChecked}
                      onChange={() => setChecked(allChecked ? [] : visible.map((item) => item.id))}
                    />
                  </th>
                  <th>Time</th>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Actor</th>
                  <th>Target</th>
                  <th>Action</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr className="alog-empty-row"><td colSpan={8}>No activities match these filters.</td></tr>
                ) : visible.map((item) => (
                  <tr key={item.id} className={selected?.id === item.id ? "selected" : ""} onClick={() => setSelectedId(item.id)}>
                    <td onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${item.event}`}
                        checked={checked.includes(item.id)}
                        onChange={() => setChecked((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}
                      />
                    </td>
                    <td className="alog-time">{item.date}<small>{item.time}</small></td>
                    <td>
                      <strong>{item.event}</strong>
                      <small>{item.detail}</small>
                    </td>
                    <td><span className={`alog-pill ${item.categoryTone}`}>{item.category}</span></td>
                    <td>
                      <div className="alog-actor">
                        <span className={`id-avatar ${item.actorTone}`}>{letter(item.actor)}</span>
                        <div>
                          <strong>{item.actor}</strong>
                          <small>{item.actorRole}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{item.target}</strong>
                      <small>{item.targetKind}</small>
                    </td>
                    <td><span className={`alog-pill ${item.actionTone}`}>{item.action}</span></td>
                    <td>
                      <span className={`alog-result ${item.outcome === "Success" ? "success" : "warning"}`}>
                        <i />
                        {item.outcome}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="alog-footer">
            <span>{visible.length === activities.length ? "Showing 1–10 of 1,842 activities" : `Showing ${visible.length === 0 ? "0" : `1–${visible.length}`} activities`}</span>
            <div className="alog-pager">
              <button type="button" aria-label="Previous page" disabled><Icon name="chevron" size={14} /></button>
              <button type="button" className="on">1</button>
              <button type="button">2</button>
              <button type="button">3</button>
              <span>...</span>
              <button type="button">185</button>
              <button type="button" aria-label="Next page"><Icon name="chevron" size={14} /></button>
            </div>
          </div>
        </section>

        {selected && (
          <aside className="alog-inspector" aria-label="Activity detail">
            <header>
              <strong>Activity Detail</strong>
              <button type="button" aria-label="Close" onClick={() => setSelectedId(null)}>×</button>
            </header>
            <div className="alog-inspector-summary">
              <span className={`alog-action-icon ${selected.categoryTone}`}><Icon name="file" size={15} /></span>
              <div>
                <strong>{selected.event}</strong>
                <small>{selected.detail}</small>
              </div>
            </div>
            <div className="alog-inspector-body">
              <dl className="alog-detail-list">
                <div><dt><Icon name="clock" size={13} /> Timestamp</dt><dd>{selected.date} {selected.time}</dd></div>
                <div><dt><Icon name="user" size={13} /> Actor</dt><dd><span className={`id-avatar ${selected.actorTone}`}>{letter(selected.actor)}</span>{selected.actor}<small>{selected.actorRole}</small></dd></div>
                <div><dt><Icon name="layers" size={13} /> Category</dt><dd><span className={`alog-pill ${selected.categoryTone}`}>{selected.category}</span></dd></div>
                <div><dt><Icon name="bolt" size={13} /> Action</dt><dd>{selected.actionLabel}</dd></div>
                <div><dt><Icon name="crosshair" size={13} /> Target</dt><dd>{selected.target}<small>{selected.targetKind}</small></dd></div>
                <div><dt><Icon name="check" size={13} /> Outcome</dt><dd><span className={`alog-result ${selected.outcome === "Success" ? "success" : "warning"}`}><i />{selected.outcome}</span></dd></div>
              </dl>
              <section>
                <small>Description</small>
                <p>{selected.description}</p>
              </section>
              {selected.extra && (
                <section>
                  <small>Additional Information</small>
                  <dl className="alog-extra">
                    {selected.extra.map(([label, value]) => (
                      <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                    ))}
                  </dl>
                </section>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, tone, label, value, delta, spark }: { icon: IconName; tone: string; label: string; value: string; delta: string; spark: "up" | "down" }) {
  return (
    <article className={`alog-stat ${tone}`}>
      <span><Icon name={icon} size={16} /></span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
      <svg viewBox="0 0 64 22" className="alog-spark" aria-hidden="true">
        {(spark === "down" ? [16, 14, 15, 11, 12, 8, 9, 5] : [4, 8, 6, 12, 9, 14, 11, 16]).map((height, index) => (
          <rect key={index} x={index * 8} y={22 - height} width="5" height={height} rx="1" />
        ))}
      </svg>
      <em className={spark}>{delta}<span>vs last 7 days</span></em>
    </article>
  );
}
