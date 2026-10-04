"use client";

import { useMemo, useState } from "react";
import Icon, { type IconName } from "@/components/ui/icon";
import AlertMap from "./alert-map";
import {
  ALERTS,
  ALERT_TYPES,
  GROUPS,
  matchesRange,
  type AlertItem,
  type AlertType,
  type GroupName,
  type Severity,
} from "./alerts-data";

const RANGES = [
  { id: "1h", label: "Last 1 Hour" },
  { id: "6h", label: "Last 6 Hours" },
  { id: "24h", label: "Last 24 Hours" },
  { id: "7d", label: "Last 7 Days" },
] as const;

const TYPE_ICON: Record<AlertType, IconName> = {
  SOS: "bell",
  Casualty: "user",
  Arrhythmia: "heart",
  "Low Battery": "bolt",
  "Heat Stress": "thermo",
  "Strap Disconnected": "link",
  "No Contact": "signal",
};

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

const RANGE_MINUTES = { "1h": 60, "6h": 360, "24h": 1440, "7d": 7 * 24 * 60 } as const;
const WINDOW_END = new Date(2026, 9, 3, 22, 41);

function timelineBins(items: AlertItem[], range: keyof typeof RANGE_MINUTES) {
  const span = RANGE_MINUTES[range];
  const count = range === "7d" ? 42 : range === "24h" ? 24 : 12;
  const every = range === "7d" ? 6 : range === "24h" ? 4 : 3;
  const byHour = range === "1h" || range === "6h" || range === "24h";
  const size = span / count;
  const bins = Array.from({ length: count }, (_, index) => {
    const at = new Date(WINDOW_END.getTime() - (span - index * size) * 60_000);
    const show = index % every === 0 || index === count - 1;
    const label = !show ? "" : byHour
      ? `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`
      : `${at.getMonth() + 1}/${at.getDate()}`;
    return { critical: 0, warning: 0, info: 0, label };
  });
  for (const item of items) {
    const index = Math.min(count - 1, Math.max(0, Math.floor((span - item.minutesAgo) / size)));
    bins[index][item.severity] += 1;
  }
  return bins;
}

export default function AlertsPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("7d");
  const [severities, setSeverities] = useState<Severity[]>(["critical", "warning", "info"]);
  const [types, setTypes] = useState<AlertType[]>(ALERT_TYPES);
  const [groups, setGroups] = useState<GroupName[]>(GROUPS);
  const [draftRange, setDraftRange] = useState<(typeof RANGES)[number]["id"]>("7d");
  const [draftSeverities, setDraftSeverities] = useState<Severity[]>(["critical", "warning", "info"]);
  const [draftTypes, setDraftTypes] = useState<AlertType[]>(ALERT_TYPES);
  const [draftGroups, setDraftGroups] = useState<GroupName[]>(GROUPS);
  const [groupQuery, setGroupQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState(ALERTS[0].id);
  const [open, setOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [tab, setTab] = useState<"details" | "timeline" | "related">("details");

  const ranged = useMemo(() => ALERTS.filter((item) => matchesRange(item.minutesAgo, range)), [range]);
  const bins = useMemo(() => timelineBins(ranged, range), [ranged, range]);
  const peak = Math.max(1, ...bins.map((bin) => bin.critical + bin.warning + bin.info));
  const draftRanged = useMemo(() => ALERTS.filter((item) => matchesRange(item.minutesAgo, draftRange)), [draftRange]);

  const filtered = useMemo(() => {
    return ranged.filter((item) => {
      if (!severities.includes(item.severity)) return false;
      if (!types.includes(item.type)) return false;
      if (!groups.includes(item.group)) return false;
      return true;
    });
  }, [ranged, severities, types, groups]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  function countSeverity(severity: Severity) {
    return draftRanged.filter((item) => item.severity === severity).length;
  }
  function countType(type: AlertType) {
    return draftRanged.filter((item) => item.type === type).length;
  }
  function countGroup(group: GroupName) {
    return draftRanged.filter((item) => item.group === group).length;
  }

  function reset() {
    setDraftRange("7d");
    setDraftSeverities(["critical", "warning", "info"]);
    setDraftTypes(ALERT_TYPES);
    setDraftGroups(GROUPS);
    setGroupQuery("");
  }

  function applyFilters() {
    setRange(draftRange);
    setSeverities(draftSeverities);
    setTypes(draftTypes);
    setGroups(draftGroups);
    setPage(1);
  }

  function exportAlerts() {
    const header = ["Event Time", "Severity", "Alert Type", "Soldier", "Group", "Details", "Position"];
    const lines = filtered.map((item) => [
      `${item.date} ${item.clock}`,
      item.severity,
      item.type,
      item.soldier,
      item.group,
      item.details,
      item.position,
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map((cell) => `"${cell.replaceAll("\"", "\"\"")}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "alerts.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="alt-page">
      <header className="alt-head page-title">
        <span className="alt-head-icon page-title-icon"><Icon name="bell" size={15} /></span>
        <div>
          <h1>Alerts</h1>
          <p>Monitor and manage critical events from soldiers and system devices.</p>
        </div>
        <section className="alt-stats">
          <article className="critical">
            <span><Icon name="bell" size={13} /></span>
            <div>
              <small>Critical</small>
              <strong>{ranged.filter((item) => item.severity === "critical").length}</strong>
            </div>
          </article>
          <article className="warning">
            <span><Icon name="bolt" size={13} /></span>
            <div>
              <small>Warning</small>
              <strong>{ranged.filter((item) => item.severity === "warning").length}</strong>
            </div>
          </article>
          <article className="info">
            <span><Icon name="file" size={13} /></span>
            <div>
              <small>Info</small>
              <strong>{ranged.filter((item) => item.severity === "info").length}</strong>
            </div>
          </article>
          <article className="total">
            <span><Icon name="layers" size={13} /></span>
            <div>
              <small>Total</small>
              <strong>{ranged.length}</strong>
            </div>
          </article>
        </section>
      </header>

      <section className="alt-histo" aria-label="Alert timeline">
        <p className="alt-histo-title">Alerts — {range === "1h" ? "5m" : range === "6h" ? "30m" : range === "24h" ? "1h" : "4h"} intervals</p>
        <div className="alt-bars">
          {bins.map((bin, index) => {
            const total = bin.critical + bin.warning + bin.info;
            return (
              <div key={index} className="alt-col">
                <div className={`alt-stack${total === 0 ? " is-empty" : ""}`} style={{ height: total === 0 ? "2px" : `${Math.max(18, (total / peak) * 100)}%` }}>
                  {bin.critical > 0 ? <i className="critical" style={{ flex: bin.critical }} /> : null}
                  {bin.warning > 0 ? <i className="warning" style={{ flex: bin.warning }} /> : null}
                  {bin.info > 0 ? <i className="info" style={{ flex: bin.info }} /> : null}
                </div>
              </div>
            );
          })}
        </div>
        <div className="alt-ticks">
          {bins.map((bin, index) => <span key={index}>{bin.label}</span>)}
        </div>
      </section>

      <div className={`alt-body${open && selected ? " has-detail" : ""}${filtersOpen ? "" : " filters-closed"}`}>
        {filtersOpen ? (
        <aside className="alt-filters">
          <header>
            <h2><Icon name="filter" size={14} />Filters</h2>
            <button type="button" className="alt-filter-collapse" aria-label="Hide filters" onClick={() => setFiltersOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M9 4v16" />
                <path d="m13 15-3-3 3-3" />
              </svg>
            </button>
          </header>
          <div className="alt-filter-actions">
            <button type="button" aria-label="Reset filters" onClick={reset}><Icon name="refresh" size={14} /></button>
            <button type="button" className="alt-export" onClick={exportAlerts}><Icon name="download" size={13} /> Export</button>
          </div>
          <div className="alt-filter-scroll">
          <section>
            <h3>Time range</h3>
            <div className="alt-range-grid">
              {RANGES.map((item) => (
                <button key={item.id} type="button" className={draftRange === item.id ? "on" : ""} onClick={() => setDraftRange(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3>Severity</h3>
            {(["critical", "warning", "info"] as const).map((item) => (
              <label key={item}>
                <input type="checkbox" checked={draftSeverities.includes(item)} onChange={() => setDraftSeverities((current) => toggle(current, item))} />
                <i className={item} />
                <span>{item[0].toUpperCase() + item.slice(1)}</span>
                <b>{countSeverity(item)}</b>
              </label>
            ))}
          </section>
          <section>
            <h3>Alert type</h3>
            {ALERT_TYPES.map((item) => (
              <label key={item}>
                <input type="checkbox" checked={draftTypes.includes(item)} onChange={() => setDraftTypes((current) => toggle(current, item))} />
                <Icon name={TYPE_ICON[item]} size={13} />
                <span>{item}</span>
                <b>{countType(item)}</b>
              </label>
            ))}
          </section>
          <section>
            <h3>Group</h3>
            <label className="alt-group-search">
              <Icon name="search" size={13} />
              <input value={groupQuery} onChange={(event) => setGroupQuery(event.target.value)} placeholder="Search group..." />
            </label>
            {GROUPS.filter((item) => item.toLowerCase().includes(groupQuery.trim().toLowerCase())).map((item) => (
              <label key={item}>
                <input type="checkbox" checked={draftGroups.includes(item)} onChange={() => setDraftGroups((current) => toggle(current, item))} />
                <span>{item}</span>
                <b>{countGroup(item)}</b>
              </label>
            ))}
          </section>
          </div>
          <div className="alt-apply-bar">
            <button type="button" className="alt-apply" onClick={applyFilters}>
              <Icon name="search" size={13} /> Apply
            </button>
          </div>
        </aside>
        ) : (
          <button type="button" className="alt-filter-reopen" aria-label="Open filters" onClick={() => setFiltersOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M9 4v16" />
              <path d="m14 10 3 2-3 2" />
            </svg>
          </button>
        )}
        <section className="alt-table-card">
          <div className="alt-table-wrap">
            <table className="alt-table">
              <thead>
                <tr>
                  <th />
                  <th>Event Time</th>
                  <th>Severity</th>
                  <th>Alert Type</th>
                  <th>Soldier</th>
                  <th>Group</th>
                  <th>Details</th>
                  <th>Position / Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className={selected?.id === item.id ? "on" : ""} onClick={() => { setSelectedId(item.id); setOpen(true); }}>
                    <td><input type="checkbox" checked={selected?.id === item.id} onChange={() => { setSelectedId(item.id); setOpen(true); }} aria-label={`Select ${item.id}`} /></td>
                    <td><strong>{item.date}</strong><small>{item.clock}</small></td>
                    <td><em className={`alt-sev ${item.severity}`}>{item.severity}</em></td>
                    <td><span className="alt-kind"><Icon name={TYPE_ICON[item.type]} size={13} /> {item.type}</span></td>
                    <td>{item.soldier}</td>
                    <td>{item.group}</td>
                    <td>{item.details}</td>
                    <td><strong>{item.position}</strong><small>{item.lastSeen}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cmd-pager">
            <span>{filtered.length.toLocaleString()} results</span>
            <div>
              <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Previous page">
                <Icon name="chevron" size={14} />
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                <button key={number} type="button" className={number === current ? "on" : ""} onClick={() => setPage(number)}>
                  {number}
                </button>
              ))}
              <button type="button" disabled={current === pageCount} onClick={() => setPage(current + 1)} aria-label="Next page">
                <Icon name="chevron" size={14} />
              </button>
            </div>
            <label className="alt-page-size">
              <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
              </select>
            </label>
          </div>
        </section>

        {open && selected ? <Detail alert={selected} tab={tab} onTab={setTab} onClose={() => setOpen(false)} /> : null}
      </div>
    </div>
  );
}

function Detail({
  alert,
  tab,
  onTab,
  onClose,
}: {
  alert: AlertItem;
  tab: "details" | "timeline" | "related";
  onTab: (tab: "details" | "timeline" | "related") => void;
  onClose: () => void;
}) {
  return (
    <aside className="alt-detail">
      <header>
        <span className={`alt-sos ${alert.severity}`}>{alert.type === "SOS" ? "SOS" : alert.type.slice(0, 3).toUpperCase()}</span>
        <div className="alt-detail-copy">
          <strong>{alert.type} {alert.type === "SOS" ? "Signal Received" : "Alert"}</strong>
          <small>#{alert.id}</small>
        </div>
        <em className={`alt-sev ${alert.severity}`}>{alert.severity}</em>
        <button type="button" aria-label="Close" onClick={onClose}>×</button>
      </header>
      <div className="alt-tabs">
        {(["details", "timeline", "related"] as const).map((item) => (
          <button key={item} type="button" className={tab === item ? "on" : ""} onClick={() => onTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      {tab === "details" ? (
        <>
            <dl className="alt-fields">
              <div><dt>Event Time</dt><dd>{alert.date} {alert.clock}<small>{alert.lastSeen}</small></dd></div>
              <div><dt>Alert Type</dt><dd>{alert.type}</dd></div>
              <div><dt>Soldier ID</dt><dd>{alert.soldier}</dd></div>
              <div><dt>Group</dt><dd>{alert.group}</dd></div>
              <div><dt>Status</dt><dd className="ok">{alert.status}</dd></div>
              <div><dt>Position Source</dt><dd>{alert.position}</dd></div>
              <div><dt>Last Seen</dt><dd>{alert.lastSeen}</dd></div>
              <div><dt>Battery Level</dt><dd>{alert.battery}</dd></div>
            </dl>
          <div className="alt-loc-head">
            <h3><Icon name="pin" size={14} /> Location</h3>
            <span>{alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}</span>
          </div>
          <AlertMap lng={alert.lng} lat={alert.lat} soldier={alert.soldier} />
          {alert.hr ? (
            <div className="alt-vitals">
              <header><h3>Latest Vital (from Chest Strap)</h3><small>22:37:50</small></header>
              <div>
                <span><Icon name="heart" size={16} /><small>Heart Rate</small><strong>{alert.hr}</strong><em className="high">High</em></span>
                <span><Icon name="signal" size={16} /><small>HRV</small><strong>{alert.hrv}</strong><em className="low">Low</em></span>
                <span><Icon name="thermo" size={16} /><small>Body Temp</small><strong>{alert.temp}</strong><em className="high">High</em></span>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
      {tab === "timeline" ? (
        <ol className="alt-timeline">
          <li><b>{alert.clock}</b> {alert.details}</li>
          <li><b>Detected</b> {alert.position}</li>
          <li><b>Assigned</b> {alert.group} · {alert.soldier}</li>
        </ol>
      ) : null}
      {tab === "related" ? (
        <dl className="alt-fields">
          <div><dt>Alert ID</dt><dd>{alert.id}</dd></div>
          <div><dt>Soldier</dt><dd>{alert.soldier}</dd></div>
          <div><dt>Group</dt><dd>{alert.group}</dd></div>
          <div><dt>Details</dt><dd>{alert.details}</dd></div>
        </dl>
      ) : null}
    </aside>
  );
}
