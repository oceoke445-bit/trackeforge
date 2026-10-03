"use client";

import { useMemo, useState } from "react";
import Icon, { type IconName } from "@/components/ui/icon";

type ResultTone = "success" | "warning";
type ActorKind = "user" | "system";
type DetailTab = "overview" | "changes" | "raw";

type AuditEvent = {
  id: string;
  time: string;
  date: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  actorTone: string;
  actorKind: ActorKind;
  action: string;
  actionDetail: string;
  actionIcon: IconName;
  actionTone: string;
  target: string;
  targetDetail: string;
  source: string;
  sourceDetail: string;
  sourceIcon: IconName;
  result: ResultTone;
  resultNote: string;
  sessionId?: string;
  before?: string;
  after?: string;
  category: "admin" | "security" | "system";
};

const events: AuditEvent[] = [
  {
    id: "EVT-A7F3C2",
    time: "16:42:18",
    date: "03 Oct 2026",
    timestamp: "03 Oct 2026, 16:42:18 WIB",
    actor: "Administrator1",
    actorRole: "Security Administrator",
    actorTone: "violet",
    actorKind: "user",
    action: "Updated user role",
    actionDetail: "Changed role assignment",
    actionIcon: "pencil",
    actionTone: "violet",
    target: "Analyst",
    targetDetail: "User Account",
    source: "Web Console",
    sourceDetail: "103.24.56.112",
    sourceIcon: "monitor",
    result: "success",
    resultNote: "Role updated successfully",
    sessionId: "sess_9f2a1c8e4b",
    before: "Role: Analyst",
    after: "Role: Security Administrator",
    category: "admin",
  },
  {
    id: "EVT-B2E91A",
    time: "16:38:05",
    date: "03 Oct 2026",
    timestamp: "03 Oct 2026, 16:38:05 WIB",
    actor: "System",
    actorRole: "Automated Process",
    actorTone: "slate",
    actorKind: "system",
    action: "Gateway heartbeat timeout",
    actionDetail: "No response for 90s",
    actionIcon: "signal",
    actionTone: "red",
    target: "GW-002",
    targetDetail: "Jakarta Hub",
    source: "Device API",
    sourceDetail: "internal",
    sourceIcon: "server",
    result: "warning",
    resultNote: "Gateway marked degraded after missed heartbeats",
    category: "system",
  },
  {
    id: "EVT-C4D813",
    time: "16:35:22",
    date: "03 Oct 2026",
    timestamp: "03 Oct 2026, 16:35:22 WIB",
    actor: "Administrator1",
    actorRole: "Security Administrator",
    actorTone: "violet",
    actorKind: "user",
    action: "Created new user",
    actionDetail: "Provisioned account",
    actionIcon: "user",
    actionTone: "blue",
    target: "Nabila Putri",
    targetDetail: "Fleet Operator",
    source: "Web Console",
    sourceDetail: "103.24.56.112",
    sourceIcon: "monitor",
    result: "success",
    resultNote: "User account created and invited",
    sessionId: "sess_9f2a1c8e4b",
    before: "Status: —",
    after: "Status: Active · Role: Fleet Operator",
    category: "admin",
  },
  {
    id: "EVT-D9F205",
    time: "16:31:47",
    date: "03 Oct 2026",
    timestamp: "03 Oct 2026, 16:31:47 WIB",
    actor: "SOC Operator",
    actorRole: "Security Operations",
    actorTone: "cyan",
    actorKind: "user",
    action: "Acknowledged alert",
    actionDetail: "Alert cleared from queue",
    actionIcon: "bell",
    actionTone: "amber",
    target: "ALT-8841",
    targetDetail: "Speed violation",
    source: "Mobile App",
    sourceDetail: "114.79.22.41",
    sourceIcon: "monitor",
    result: "success",
    resultNote: "Alert acknowledged by SOC Operator",
    sessionId: "sess_m4b881q2",
    category: "security",
  },
  {
    id: "EVT-E1A774",
    time: "16:28:11",
    date: "03 Oct 2026",
    timestamp: "03 Oct 2026, 16:28:11 WIB",
    actor: "System",
    actorRole: "Automated Process",
    actorTone: "slate",
    actorKind: "system",
    action: "Firmware update completed",
    actionDetail: "OTA flash successful",
    actionIcon: "cpu",
    actionTone: "green",
    target: "DEV-4412",
    targetDetail: "Truck 042 tracker",
    source: "Device API",
    sourceDetail: "internal",
    sourceIcon: "server",
    result: "success",
    resultNote: "Firmware v3.4.1 installed",
    before: "Firmware: v3.3.8",
    after: "Firmware: v3.4.1",
    category: "system",
  },
  {
    id: "EVT-F6B338",
    time: "16:24:55",
    date: "03 Oct 2026",
    timestamp: "03 Oct 2026, 16:24:55 WIB",
    actor: "Nadia Putri",
    actorRole: "Fleet IT",
    actorTone: "green",
    actorKind: "user",
    action: "Exported fleet report",
    actionDetail: "CSV download",
    actionIcon: "file",
    actionTone: "blue",
    target: "Monthly Ops",
    targetDetail: "Report package",
    source: "Web Console",
    sourceDetail: "103.24.58.90",
    sourceIcon: "monitor",
    result: "success",
    resultNote: "Report exported successfully",
    sessionId: "sess_n7d12k0a",
    category: "admin",
  },
  {
    id: "EVT-G8C491",
    time: "16:19:03",
    date: "03 Oct 2026",
    timestamp: "03 Oct 2026, 16:19:03 WIB",
    actor: "System",
    actorRole: "Automated Process",
    actorTone: "slate",
    actorKind: "system",
    action: "Geofence breach detected",
    actionDetail: "Exit from restricted zone",
    actionIcon: "shield",
    actionTone: "red",
    target: "Zone North",
    targetDetail: "B 1942 UZY",
    source: "Event Bus",
    sourceDetail: "internal",
    sourceIcon: "layers",
    result: "warning",
    resultNote: "Vehicle left Zone North without clearance",
    category: "security",
  },
  {
    id: "EVT-H2D556",
    time: "16:15:40",
    date: "03 Oct 2026",
    timestamp: "03 Oct 2026, 16:15:40 WIB",
    actor: "Administrator1",
    actorRole: "Security Administrator",
    actorTone: "violet",
    actorKind: "user",
    action: "Revoked API key",
    actionDetail: "Key disabled immediately",
    actionIcon: "lock",
    actionTone: "amber",
    target: "key_live_9x…",
    targetDetail: "Integration key",
    source: "Web Console",
    sourceDetail: "103.24.56.112",
    sourceIcon: "monitor",
    result: "success",
    resultNote: "API key revoked and sessions invalidated",
    sessionId: "sess_9f2a1c8e4b",
    before: "Key status: Active",
    after: "Key status: Revoked",
    category: "security",
  },
  {
    id: "EVT-I4E667",
    time: "16:12:18",
    date: "03 Oct 2026",
    timestamp: "03 Oct 2026, 16:12:18 WIB",
    actor: "Guest User",
    actorRole: "Read-only Guest",
    actorTone: "amber",
    actorKind: "user",
    action: "Failed login attempt",
    actionDetail: "Invalid credentials",
    actionIcon: "lock",
    actionTone: "red",
    target: "auth.trackforge",
    targetDetail: "Login endpoint",
    source: "Auth Service",
    sourceDetail: "182.1.44.209",
    sourceIcon: "server",
    result: "warning",
    resultNote: "Authentication failed after invalid password",
    category: "security",
  },
  {
    id: "EVT-J7F778",
    time: "16:08:52",
    date: "03 Oct 2026",
    timestamp: "03 Oct 2026, 16:08:52 WIB",
    actor: "System",
    actorRole: "Automated Process",
    actorTone: "slate",
    actorKind: "system",
    action: "Backup completed",
    actionDetail: "Nightly snapshot",
    actionIcon: "box",
    actionTone: "green",
    target: "DB Primary",
    targetDetail: "PostgreSQL cluster",
    source: "Scheduler",
    sourceDetail: "cron://nightly",
    sourceIcon: "clock",
    result: "success",
    resultNote: "Backup stored for 5-year retention",
    category: "system",
  },
];

const stats = [
  { label: "Today's Events", value: "342", trend: "+12% from yesterday", icon: "clock" as IconName, tone: "blue", spark: "2,8 8,5 14,7 20,3 26,6 32,2" },
  { label: "Admin Actions", value: "48", trend: "+8% from yesterday", icon: "users" as IconName, tone: "violet", spark: "2,7 8,6 14,4 20,5 26,3 32,2" },
  { label: "Security Events", value: "27", trend: "+35% from yesterday", icon: "shield" as IconName, tone: "red", spark: "2,8 8,7 14,6 20,4 26,5 32,1" },
  { label: "System Events", value: "267", trend: "+6% from yesterday", icon: "settings" as IconName, tone: "slate", spark: "2,6 8,5 14,6 20,4 26,5 32,3" },
];

const pageSize = 10;

function initials(name: string) {
  if (name === "System") return "SY";
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ActivityLogPage() {
  const [query, setQuery] = useState("");
  const [actorFilter, setActorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(events[0].id);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      if (actorFilter !== "all" && event.actorKind !== actorFilter) return false;
      if (typeFilter !== "all" && event.category !== typeFilter) return false;
      if (resourceFilter !== "all" && !event.target.toLowerCase().includes(resourceFilter)) return false;
      if (resultFilter !== "all" && event.result !== resultFilter) return false;
      if (!q) return true;
      return [event.id, event.actor, event.action, event.target, event.source, event.actionDetail]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [actorFilter, query, resourceFilter, resultFilter, typeFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selected = filtered.find((event) => event.id === selectedId) ?? pageItems[0] ?? null;
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, filtered.length);

  return (
    <div className={`alog-screen${selected ? " has-detail" : ""}`}>
      <div className="alog-head">
        <span className="alog-head-icon">
          <Icon name="file" size={16} />
        </span>
        <div>
          <h1>Activity Log</h1>
          <p>Audit trail of administrative and system activity across the platform.</p>
        </div>
      </div>

      <div className="alog-stats">
        {stats.map((stat) => (
          <article key={stat.label} className={`alog-stat ${stat.tone}`}>
            <div>
              <small>{stat.label}</small>
              <strong>{stat.value}</strong>
              <em>
                <Icon name="arrow" size={11} />
                {stat.trend}
              </em>
            </div>
            <div className="alog-stat-side">
              <span>
                <Icon name={stat.icon} size={15} />
              </span>
              <svg viewBox="0 0 34 10" className="alog-spark" aria-hidden="true">
                <polyline points={stat.spark} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </article>
        ))}
      </div>

      <div className={`alog-layout${selected ? "" : " solo"}`}>
        <section className="alog-main">
          <div className="alog-toolbar">
            <label className="alog-search">
              <Icon name="search" size={15} />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search events, actor, target, or event ID..."
              />
            </label>

            <button type="button" className="alog-filter">
              <Icon name="calendar" size={14} />
              03 Oct 2026, 00:00 – 23:59
              <Icon name="chevron" size={13} />
            </button>

            <label className="alog-filter">
              <select
                value={actorFilter}
                onChange={(e) => {
                  setActorFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Actors</option>
                <option value="user">Users</option>
                <option value="system">System</option>
              </select>
              <Icon name="chevron" size={13} />
            </label>

            <label className="alog-filter">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Event Types</option>
                <option value="admin">Admin</option>
                <option value="security">Security</option>
                <option value="system">System</option>
              </select>
              <Icon name="chevron" size={13} />
            </label>

            <label className="alog-filter">
              <select
                value={resourceFilter}
                onChange={(e) => {
                  setResourceFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Resources</option>
                <option value="analyst">Users</option>
                <option value="gw">Gateways</option>
                <option value="dev">Devices</option>
                <option value="alt">Alerts</option>
              </select>
              <Icon name="chevron" size={13} />
            </label>

            <label className="alog-filter">
              <select
                value={resultFilter}
                onChange={(e) => {
                  setResultFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Results</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
              </select>
              <Icon name="chevron" size={13} />
            </label>

            <button type="button" className="alog-export">
              <Icon name="download" size={15} />
              Export
            </button>
          </div>

          <div className="alog-table-wrap">
            <table className="alog-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Source</th>
                  <th>Result</th>
                  <th>Event ID</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr className="alog-empty-row">
                    <td colSpan={8}>No events match your filters.</td>
                  </tr>
                ) : (
                  pageItems.map((event) => (
                    <tr
                      key={event.id}
                      className={selected?.id === event.id ? "selected" : ""}
                      onClick={() => {
                        setSelectedId(event.id);
                        setDetailTab("overview");
                      }}
                    >
                      <td>
                        <strong>{event.time}</strong>
                        <small>{event.date}</small>
                      </td>
                      <td>
                        <div className="alog-actor">
                          <span className={`id-avatar ${event.actorTone}`}>{initials(event.actor)}</span>
                          <div>
                            <strong>{event.actor}</strong>
                            <small>{event.actorRole}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="alog-action">
                          <span className={`alog-action-icon ${event.actionTone}`}>
                            <Icon name={event.actionIcon} size={13} />
                          </span>
                          <div>
                            <strong>{event.action}</strong>
                            <small>{event.actionDetail}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{event.target}</strong>
                        <small>{event.targetDetail}</small>
                      </td>
                      <td>
                        <div className="alog-source">
                          <Icon name={event.sourceIcon} size={13} />
                          <div>
                            <strong>{event.source}</strong>
                            <small>{event.sourceDetail}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`alog-result ${event.result}`}>
                          <i />
                          {event.result === "success" ? "Success" : "Warning"}
                        </span>
                      </td>
                      <td>
                        <code>{event.id}</code>
                      </td>
                      <td>
                        <button type="button" className="alog-more" aria-label="More actions" onClick={(e) => e.stopPropagation()}>
                          <Icon name="more" size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="alog-footer">
            <span>
              Showing {rangeStart}–{rangeEnd} of {filtered.length} events
            </span>
            <div className="alog-pager">
              <button type="button" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous page">
                <Icon name="chevron" size={14} />
              </button>
              {Array.from({ length: Math.min(pageCount, 3) }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className={safePage === n ? "on" : ""} onClick={() => setPage(n)}>
                  {n}
                </button>
              ))}
              {pageCount > 4 && <span>…</span>}
              {pageCount > 3 && (
                <button type="button" className={safePage === pageCount ? "on" : ""} onClick={() => setPage(pageCount)}>
                  {pageCount}
                </button>
              )}
              <button type="button" disabled={safePage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} aria-label="Next page">
                <Icon name="chevron" size={14} />
              </button>
            </div>
            <label className="alog-page-size">
              <select value={pageSize} disabled>
                <option value={10}>10 / page</option>
              </select>
              <Icon name="chevron" size={12} />
            </label>
          </div>
        </section>

        {selected && (
          <aside className="alog-inspector" aria-label="Event details">
            <header>
              <strong>Event Details</strong>
              <button type="button" aria-label="Close" onClick={() => setSelectedId(null)}>
                ×
              </button>
            </header>

            <div className="alog-inspector-summary">
              <span className={`alog-action-icon ${selected.actionTone}`}>
                <Icon name={selected.actionIcon} size={15} />
              </span>
              <div>
                <strong>{selected.action}</strong>
                <small>{selected.actionDetail}</small>
              </div>
            </div>

            <div className="alog-tabs" role="tablist" aria-label="Event detail sections">
              {(
                [
                  ["overview", "Overview"],
                  ["changes", "Changes"],
                  ["raw", "Raw Data"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={detailTab === id}
                  className={detailTab === id ? "on" : ""}
                  onClick={() => setDetailTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="alog-inspector-body">
              {detailTab === "overview" && (
                <>
                  <section className="alog-block">
                    <div className="alog-meta-grid">
                      <div>
                        <small>Event ID</small>
                        <code>{selected.id}</code>
                      </div>
                      <div>
                        <small>Timestamp</small>
                        <strong>{selected.timestamp}</strong>
                      </div>
                    </div>
                  </section>

                  <section className="alog-block">
                    <small>Actor</small>
                    <div className="alog-actor">
                      <span className={`id-avatar ${selected.actorTone}`}>{initials(selected.actor)}</span>
                      <div>
                        <strong>{selected.actor}</strong>
                        <small>{selected.actorRole}</small>
                      </div>
                    </div>
                  </section>

                  <section className="alog-block">
                    <small>Action</small>
                    <div className="alog-action">
                      <span className={`alog-action-icon ${selected.actionTone}`}>
                        <Icon name={selected.actionIcon} size={13} />
                      </span>
                      <div>
                        <strong>{selected.action}</strong>
                        <small>{selected.actionDetail}</small>
                      </div>
                    </div>
                  </section>

                  <section className="alog-block">
                    <small>Target</small>
                    <div className="alog-target-card">
                      <div>
                        <strong>{selected.target}</strong>
                        <small>{selected.targetDetail}</small>
                      </div>
                      <button type="button">View User</button>
                    </div>
                  </section>

                  <section className="alog-block">
                    <small>Source</small>
                    <div className="alog-source-card">
                      <div className="alog-source">
                        <Icon name={selected.sourceIcon} size={14} />
                        <div>
                          <strong>{selected.source}</strong>
                          <small>IP {selected.sourceDetail}</small>
                        </div>
                      </div>
                      {selected.sessionId && (
                        <p>
                          Session ID <code>{selected.sessionId}</code>
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="alog-block">
                    <small>Result</small>
                    <div className={`alog-result-card ${selected.result}`}>
                      <span className={`alog-result ${selected.result}`}>
                        <i />
                        {selected.result === "success" ? "Success" : "Warning"}
                      </span>
                      <p>{selected.resultNote}</p>
                    </div>
                  </section>

                  {(selected.before || selected.after) && (
                    <section className="alog-block">
                      <small>Changes</small>
                      <div className="alog-diff">
                        <div className="before">
                          <span>Before</span>
                          <strong>{selected.before || "—"}</strong>
                        </div>
                        <Icon name="arrow" size={14} />
                        <div className="after">
                          <span>After</span>
                          <strong>{selected.after || "—"}</strong>
                        </div>
                      </div>
                    </section>
                  )}
                </>
              )}

              {detailTab === "changes" && (
                <section className="alog-block">
                  {selected.before || selected.after ? (
                    <div className="alog-diff stacked">
                      <div className="before">
                        <span>Before</span>
                        <strong>{selected.before || "—"}</strong>
                      </div>
                      <div className="after">
                        <span>After</span>
                        <strong>{selected.after || "—"}</strong>
                      </div>
                    </div>
                  ) : (
                    <p className="alog-empty-note">No field-level changes recorded for this event.</p>
                  )}
                </section>
              )}

              {detailTab === "raw" && (
                <section className="alog-block">
                  <pre className="alog-raw">{JSON.stringify(selected, null, 2)}</pre>
                </section>
              )}
            </div>

            <footer className="alog-audit-foot">
              <div>
                <Icon name="lock" size={14} />
                <div>
                  <strong>Immutable Record</strong>
                  <small>This audit entry cannot be modified.</small>
                </div>
              </div>
              <div>
                <Icon name="box" size={14} />
                <div>
                  <strong>Retention</strong>
                  <small>Stored for 5 years</small>
                </div>
              </div>
            </footer>
          </aside>
        )}
      </div>
    </div>
  );
}
