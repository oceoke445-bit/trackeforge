"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Dropdown from "@/components/ui/dropdown";
import Icon, { type IconName } from "@/components/ui/icon";
import { useAlertFeed } from "@/lib/alert-feed";
import { alertQuery, ALERT_CLOCK, fetchLiveAlerts, postAlertAction, summaryTypeCount, type AlertSummary } from "@/lib/alerts-api";
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
const LIVE_END = new Date(ALERT_CLOCK);

function timelineBins(items: AlertItem[], range: keyof typeof RANGE_MINUTES, end = WINDOW_END) {
  const span = RANGE_MINUTES[range];
  const count = range === "7d" ? 42 : range === "24h" ? 24 : 12;
  const every = range === "7d" ? 6 : range === "24h" ? 4 : 3;
  const byHour = range === "1h" || range === "6h" || range === "24h";
  const size = span / count;
  const bins = Array.from({ length: count }, (_, index) => {
    const at = new Date(end.getTime() - (span - index * size) * 60_000);
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
  const [pageSize, setPageSize] = useState(20);
  const [selectedId, setSelectedId] = useState(ALERTS[0].id);
  const [open, setOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [tab, setTab] = useState<"details" | "related">("details");
  const { mode, pending, runId, finish, fail } = useAlertFeed();
  const [liveItems, setLiveItems] = useState<AlertItem[]>([]);
  const [liveSummary, setLiveSummary] = useState<AlertSummary | null>(null);
  const [sosItems, setSosItems] = useState<AlertItem[]>([]);
  const [liveError, setLiveError] = useState("");
  const skipRefresh = useRef(false);

  const catalog = mode === "live" ? liveItems : ALERTS;
  const ranged = useMemo(
    () => (mode === "live" ? catalog : catalog.filter((item) => matchesRange(item.minutesAgo, range))),
    [catalog, mode, range],
  );
  const bins = useMemo(
    () => timelineBins(ranged, range, mode === "live" ? LIVE_END : WINDOW_END),
    [mode, ranged, range],
  );
  const peak = Math.max(1, ...bins.map((bin) => bin.critical + bin.warning + bin.info));
  const draftRanged = useMemo(() => ALERTS.filter((item) => matchesRange(item.minutesAgo, draftRange)), [draftRange]);

  const filtered = useMemo(() => {
    return ranged.filter((item) => {
      if (!severities.includes(item.severity)) return false;
      if (!types.includes(item.type)) return false;
      if (!groups.includes(item.group as GroupName)) return false;
      return true;
    });
  }, [ranged, severities, types, groups]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;
  const criticalCount = mode === "live" && liveSummary ? liveSummary.critical : ranged.filter((item) => item.severity === "critical").length;
  const warningCount = mode === "live" && liveSummary ? liveSummary.warning : ranged.filter((item) => item.severity === "warning").length;
  const infoCount = mode === "live" && liveSummary ? liveSummary.info : ranged.filter((item) => item.severity === "info").length;
  const totalCount = mode === "live" && liveSummary ? liveSummary.total : ranged.length;

  function countSeverity(severity: Severity) {
    if (mode === "live" && liveSummary) return liveSummary[severity];
    return draftRanged.filter((item) => item.severity === severity).length;
  }
  function countType(type: AlertType) {
    if (mode === "live" && liveSummary) return summaryTypeCount(liveSummary, type);
    return draftRanged.filter((item) => item.type === type).length;
  }
  function countGroup(group: GroupName) {
    return (mode === "live" ? liveItems : draftRanged).filter((item) => item.group === group).length;
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

  async function loadLive() {
    const params = alertQuery({
      range,
      severities,
      types,
      groups,
      allSeverities: 3,
      allTypes: ALERT_TYPES.length,
    });
    const next = await fetchLiveAlerts(params);
    const visible = groups.length > 1 && groups.length < GROUPS.length
      ? next.items.filter((item) => groups.includes(item.group as GroupName))
      : next.items;
    setLiveItems(visible);
    setLiveSummary(next.summary);
    setSosItems(next.sos);
    setLiveError("");
    setSelectedId((current) => visible.some((item) => item.id === current) ? current : visible[0]?.id ?? current);
  }

  useEffect(() => {
    if (!pending) return;
    const run = runId;
    if (pending === "mock") {
      const timer = window.setTimeout(() => finish(run), 400);
      return () => window.clearTimeout(timer);
    }
    let ignore = false;
    loadLive()
      .then(() => {
        if (ignore) return;
        skipRefresh.current = true;
        finish(run);
      })
      .catch(() => {
        if (!ignore) fail(run);
      });
    return () => {
      ignore = true;
    };
  }, [fail, finish, pending, runId]);

  useEffect(() => {
    if (mode !== "live" || pending) return;
    if (skipRefresh.current) {
      skipRefresh.current = false;
      return;
    }
    let ignore = false;
    loadLive().catch(() => {
      if (!ignore) setLiveError("Live alerts are unavailable.");
    });
    return () => {
      ignore = true;
    };
  }, [groups, mode, pending, range, severities, types]);

  function focusAlert(item: AlertItem) {
    const nextSeverities: Severity[] = [item.severity];
    const nextTypes: AlertType[] = [item.type];
    const nextGroups: GroupName[] = GROUPS.includes(item.group as GroupName) ? [item.group as GroupName] : [...GROUPS];
    setSeverities(nextSeverities);
    setDraftSeverities(nextSeverities);
    setTypes(nextTypes);
    setDraftTypes(nextTypes);
    setGroups(nextGroups);
    setDraftGroups(nextGroups);
    setSelectedId(item.id);
    setOpen(true);
    setTab("details");
    const nextRows = ranged.filter((row) => (
      nextSeverities.includes(row.severity)
      && nextTypes.includes(row.type)
      && nextGroups.includes(row.group as GroupName)
    ));
    const index = nextRows.findIndex((row) => row.id === item.id);
    setPage(index < 0 ? 1 : Math.floor(index / pageSize) + 1);
  }

  useEffect(() => {
    const row = document.querySelector(".alt-table tr.on");
    const wrap = document.querySelector(".alt-table-wrap");
    if (!(row instanceof HTMLElement) || !(wrap instanceof HTMLElement)) return;
    const top = row.getBoundingClientRect().top - wrap.getBoundingClientRect().top + wrap.scrollTop;
    wrap.scrollTop = Math.max(0, top - 8);
  }, [page, selectedId]);

  async function runAction(item: AlertItem, action: "acknowledge" | "resolve") {
    if (!item.apiId) return;
    try {
      const next = await postAlertAction(item.apiId, action);
      setLiveItems((current) => current.map((row) => (row.apiId === next.apiId ? next : row)));
      setLiveError("");
      await loadLive();
    } catch {
      setLiveError(`Could not ${action} this alert.`);
    }
  }

  function exportAlerts() {
    if (mode === "live") {
      const params = alertQuery({
        range,
        severities,
        types,
        groups,
        allSeverities: 3,
        allTypes: ALERT_TYPES.length,
      });
      const link = document.createElement("a");
      link.href = `/api/alerts/export.csv?${params}`;
      link.download = "alerts.csv";
      link.click();
      return;
    }
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
              <strong>{criticalCount}</strong>
            </div>
          </article>
          <article className="warning">
            <span><Icon name="bolt" size={13} /></span>
            <div>
              <small>Warning</small>
              <strong>{warningCount}</strong>
            </div>
          </article>
          <article className="info">
            <span><Icon name="file" size={13} /></span>
            <div>
              <small>Info</small>
              <strong>{infoCount}</strong>
            </div>
          </article>
          <article className="total">
            <span><Icon name="layers" size={13} /></span>
            <div>
              <small>Total</small>
              <strong>{totalCount}</strong>
            </div>
          </article>
        </section>
      </header>

      {mode === "live" && sosItems.length > 0 ? (
        <div className="alt-sos-banner">
          <strong>{sosItems.length} open SOS</strong>
          {sosItems.map((item) => (
            <button key={item.id} type="button" className={selectedId === item.id ? "on" : ""} onClick={() => focusAlert(item)}>
              {item.soldier}
            </button>
          ))}
        </div>
      ) : null}
      {liveError ? <p className="alt-live-error">{liveError}</p> : null}

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
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No alerts in this view.</td>
                  </tr>
                ) : null}
                {rows.map((item) => (
                  <tr key={item.id} className={selected?.id === item.id ? "on" : ""} onClick={() => { setSelectedId(item.id); setOpen(true); }}>
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
            <div className="alt-page-size">
              <Dropdown
                value={`${pageSize} / page`}
                onChange={(value) => { setPageSize(Number(value.replace(" / page", ""))); setPage(1); }}
                options={["10 / page", "20 / page"]}
                ariaLabel="Page size"
              />
            </div>
          </div>
        </section>

        {open && selected ? (
          <Detail
            alert={selected}
            tab={tab}
            onTab={setTab}
            onClose={() => setOpen(false)}
            onAction={mode === "live" ? runAction : undefined}
          />
        ) : null}
      </div>
    </div>
  );
}

function Detail({
  alert,
  tab,
  onTab,
  onClose,
  onAction,
}: {
  alert: AlertItem;
  tab: "details" | "related";
  onTab: (tab: "details" | "related") => void;
  onClose: () => void;
  onAction?: (alert: AlertItem, action: "acknowledge" | "resolve") => void;
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
        {(["details", "related"] as const).map((item) => (
          <button key={item} type="button" className={tab === item ? "on" : ""} onClick={() => onTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      <div className="alt-detail-scroll">
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
          <AlertMap lng={alert.lng} lat={alert.lat} soldier={alert.soldier} type={alert.type} severity={alert.severity} />
          {onAction && (alert.apiStatus === "ACTIVE" || alert.apiStatus === "ACKNOWLEDGED") ? (
            <div className="alt-actions">
              {alert.apiStatus === "ACTIVE" ? (
                <button type="button" onClick={() => onAction(alert, "acknowledge")}>Acknowledge</button>
              ) : null}
              <button type="button" onClick={() => onAction(alert, "resolve")}>Resolve</button>
            </div>
          ) : null}
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
      {tab === "related" ? (
        <dl className="alt-fields">
          <div><dt>Alert ID</dt><dd>{alert.id}</dd></div>
          <div><dt>Soldier</dt><dd>{alert.soldier}</dd></div>
          <div><dt>Group</dt><dd>{alert.group}</dd></div>
          <div><dt>Details</dt><dd>{alert.details}</dd></div>
        </dl>
      ) : null}
      </div>
    </aside>
  );
}
