"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Icon, { type IconName } from "@/components/ui/icon";
import { fetchUsers, type UserItem } from "@/lib/access-api";
import {
  downloadAuditExport,
  fetchAuditCategories,
  fetchAuditDetail,
  fetchAuditLogs,
  fetchAuditSummary,
  type AuditCategory,
  type AuditDetail,
  type AuditListItem,
  type AuditQuery,
  type AuditSummary,
} from "@/lib/audit-api";

const pageSize = 10;
const actions = ["VIEW", "CREATE", "UPDATE", "DELETE", "ASSIGN", "REVOKE", "ACKNOWLEDGE", "RESOLVE", "EXPORT", "LOGIN", "LOGOUT", "ACCESS"];
const outcomes = [
  ["SUCCESS", "Success"],
  ["FAILED", "Failed"],
  ["DENIED", "Denied"],
] as const;
const tones = ["blue", "cyan", "amber", "violet", "green", "slate"];
const categoryTones: Record<string, string> = {
  "User Access": "blue",
  Authentication: "violet",
  History: "amber",
  Operations: "green",
  Alerts: "red",
  Weapons: "amber",
  Reports: "cyan",
  Settings: "slate",
  Personnel: "cyan",
  Groups: "violet",
  Tickets: "amber",
  Communication: "cyan",
  System: "slate",
};
const actionTones: Record<string, string> = {
  Create: "green",
  Assign: "blue",
  Login: "green",
  Logout: "slate",
  View: "violet",
  Update: "amber",
  Acknowledge: "green",
  Resolve: "green",
  Export: "blue",
  Access: "red",
  Delete: "red",
  Revoke: "red",
};

function displayLabel(code: string | null | undefined) {
  if (!code) return "";
  return code.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ");
}

function fieldLabel(key: string) {
  return key.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function fieldValue(value: unknown) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function letter(name: string) {
  return name.slice(0, 1).toUpperCase();
}

function toneFor(name: string) {
  const total = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return tones[total % tones.length];
}

function clock(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { date: iso, time: "" };
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return { date: `${month}/${day}/${date.getFullYear()}`, time: `${hours}:${minutes}:${seconds}` };
}

function pageList(current: number, count: number) {
  if (count <= 5) return Array.from({ length: count }, (_, index) => index + 1);
  const values = [1, count, current - 1, current, current + 1].filter((value, index, list) => value >= 1 && value <= count && list.indexOf(value) === index);
  return values.sort((a, b) => a - b);
}

export default function ActivityLogPage() {
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [categories, setCategories] = useState<AuditCategory[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [rows, setRows] = useState<AuditListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [actorInput, setActorInput] = useState("");
  const [actorQuery, setActorQuery] = useState("");
  const [enabled, setEnabled] = useState<string[] | null>(null);
  const [action, setAction] = useState("All");
  const [outcome, setOutcome] = useState("All");
  const [actorId, setActorId] = useState("All");
  const [sort, setSort] = useState("recent");
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);
  const [detail, setDetail] = useState<AuditDetail | null>(null);
  const [checked, setChecked] = useState<string[]>([]);

  const selectedCodes = enabled ?? categories.map((item) => item.code);

  const filters = useMemo<AuditQuery>(() => {
    const query: AuditQuery = {};
    if (search) query.search = search;
    if (action !== "All") query.action = action;
    if (outcome !== "All") query.outcome = outcome;
    if (actorQuery) query.actor = actorQuery;
    if (actorId !== "All") query.userId = Number(actorId);
    return query;
  }, [action, actorId, actorQuery, outcome, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => { setActorQuery(actorInput.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [actorInput]);

  useEffect(() => {
    fetchAuditSummary().then(setSummary).catch(() => setSummary(null));
    fetchAuditCategories().then((result) => setCategories(result.categories)).catch(() => setCategories([]));
    fetchUsers(new URLSearchParams({ page: "1", limit: "100" })).then((result) => setUsers(result.items)).catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setError("");
    const allOn = categories.length === 0 || selectedCodes.length === categories.length;
    const load = async () => {
      if (categories.length > 0 && selectedCodes.length === 0) {
        return { items: [] as AuditListItem[], total: 0 };
      }
      if (allOn || selectedCodes.length === 1) {
        const result = await fetchAuditLogs({
          ...filters,
          page,
          limit: pageSize,
          category: !allOn && selectedCodes.length === 1 ? selectedCodes[0] : undefined,
        });
        return { items: result.items, total: result.total };
      }
      const pages = await Promise.all(selectedCodes.map((code) => fetchAuditLogs({ ...filters, category: code, page: 1, limit: 100 })));
      const merged = pages.flatMap((result) => result.items).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      const start = (page - 1) * pageSize;
      return { items: merged.slice(start, start + pageSize), total: merged.length };
    };
    load()
      .then((result) => {
        if (cancel) return;
        setRows(sort === "oldest" ? [...result.items].reverse() : result.items);
        setTotal(result.total);
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (cancel) return;
        setRows([]);
        setTotal(0);
        setError(loadError instanceof Error ? loadError.message : "Activity log is unavailable");
        setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [categories, enabled, filters, page, sort]);

  useEffect(() => {
    if (selectedId === null) return;
    if (selectedId && rows.some((item) => item.eventId === selectedId)) return;
    setSelectedId(rows[0]?.eventId ?? null);
  }, [rows, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancel = false;
    fetchAuditDetail(selectedId)
      .then((result) => {
        if (!cancel) setDetail(result);
      })
      .catch(() => {
        if (!cancel) setDetail(null);
      });
    return () => {
      cancel = true;
    };
  }, [selectedId]);

  const selected = rows.find((item) => item.eventId === selectedId) ?? null;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);
  const allChecked = rows.length > 0 && rows.every((item) => checked.includes(item.eventId));
  const extras = detailExtras(detail);

  function resetFilters() {
    setEnabled(null);
    setAction("All");
    setOutcome("All");
    setActorId("All");
    setActorInput("");
    setActorQuery("");
    setSearchInput("");
    setSearch("");
    setSort("recent");
    setPage(1);
  }

  function toggleCategory(code: string) {
    const current = enabled ?? categories.map((item) => item.code);
    setEnabled(current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
    setPage(1);
  }

  async function exportRows() {
    try {
      setError("");
      await downloadAuditExport(filters);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Activity log is unavailable");
    }
  }

  return (
    <div className="alog-screen">
      <header className="alog-top">
        <div>
          <h1>Activity Log</h1>
          <p>Monitor and review all user and system activities across the TrackForge platform.</p>
        </div>
        <div className="alog-top-actions">
          <button type="button" className="alog-export" onClick={exportRows}>
            <Icon name="download" size={14} /> Export
          </button>
        </div>
      </header>

      <div className="alog-stats">
        <Stat icon="chart" tone="blue" label="Total Activities" value={summary?.total_activities ?? 0} />
        <Stat icon="user" tone="green" label="User Actions" value={summary?.user_actions ?? 0} />
        <Stat icon="settings" tone="violet" label="System Actions" value={summary?.system_actions ?? 0} />
        <Stat icon="warn" tone="red" label="Failed Actions" value={summary?.failed_actions ?? 0} />
      </div>

      <div className={`alog-workspace${selected ? "" : " solo"}`}>
        <aside className="alog-filters">
          <header>
            <strong><Icon name="filter" size={14} /> Filters</strong>
            <button type="button" onClick={resetFilters}>Reset</button>
          </header>
          <label className="alog-search alog-actor-search">
            <Icon name="search" size={14} />
            <input value={actorInput} onChange={(event) => setActorInput(event.target.value)} placeholder="Search actor..." />
          </label>
          <section>
            <small>Action</small>
            <FilterSelect
              label="Action"
              value={action}
              options={[{ value: "All", label: "All Actions" }, ...actions.map((code) => ({ value: code, label: displayLabel(code) }))]}
              onChange={(value) => { setAction(value); setPage(1); }}
            />
          </section>
          <section>
            <small>Outcome</small>
            <FilterSelect
              label="Outcome"
              value={outcome}
              options={[{ value: "All", label: "All" }, ...outcomes.map(([code, label]) => ({ value: code, label }))]}
              onChange={(value) => { setOutcome(value); setPage(1); }}
            />
          </section>
          <section>
            <small>Actor</small>
            <FilterSelect
              label="Actor"
              value={actorId}
              options={[{ value: "All", label: "All Users" }, ...users.map((user) => ({ value: String(user.id), label: user.name }))]}
              onChange={(value) => { setActorId(value); setPage(1); }}
            />
          </section>
          <section>
            <small>Category</small>
            <div className="alog-checks">
              {categories.map((item) => (
                <label key={item.code}>
                  <input type="checkbox" checked={selectedCodes.includes(item.code)} onChange={() => toggleCategory(item.code)} />
                  <span>{item.name}</span>
                  <b>{item.count}</b>
                </label>
              ))}
            </div>
          </section>
        </aside>

        <section className="alog-main">
          <div className="alog-toolbar">
            <label className="alog-search">
              <Icon name="search" size={15} />
              <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search action, target, or details..." />
            </label>
            <FilterSelect
              label="Sort"
              value={sort}
              options={[{ value: "recent", label: "Sort: Most Recent" }, { value: "oldest", label: "Sort: Oldest" }]}
              onChange={setSort}
            />
            <div className="alog-view-toggle" role="group" aria-label="Layout">
              <button type="button" className="on" aria-label="Table"><Icon name="grid" size={14} /></button>
              <button type="button" aria-label="Rows"><Icon name="menu" size={14} /></button>
            </div>
            <button type="button" className="alog-columns"><Icon name="layers" size={14} /> Columns</button>
          </div>
          {error && <p className="alog-note">{error}</p>}
          <div className="alog-table-wrap">
            <table className="alog-table alog-activity-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Select page"
                      checked={allChecked}
                      onChange={() => setChecked(allChecked ? [] : rows.map((item) => item.eventId))}
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
                {loading ? (
                  <tr className="alog-empty-row"><td colSpan={8}>Loading activities...</td></tr>
                ) : rows.length === 0 ? (
                  <tr className="alog-empty-row"><td colSpan={8}>No activities match these filters.</td></tr>
                ) : rows.map((item) => {
                  const when = clock(item.timestamp);
                  const actorName = item.actor.name || "System";
                  const actorTone = toneFor(actorName);
                  return (
                    <tr key={item.eventId} className={selected?.eventId === item.eventId ? "selected" : ""} onClick={() => setSelectedId(item.eventId)}>
                      <td onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Select ${item.event}`}
                          checked={checked.includes(item.eventId)}
                          onChange={() => setChecked((current) => current.includes(item.eventId) ? current.filter((id) => id !== item.eventId) : [...current, item.eventId])}
                        />
                      </td>
                      <td className="alog-time">{when.date}<small>{when.time}</small></td>
                      <td>
                        <strong>{item.event}</strong>
                        <small>{item.description || item.eventId}</small>
                      </td>
                      <td><span className={`alog-pill ${categoryTones[item.category] || "slate"}`}>{item.category}</span></td>
                      <td>
                        <div className="alog-actor">
                          <span className={`id-avatar ${actorTone}`}>{letter(actorName)}</span>
                          <div>
                            <strong>{actorName}</strong>
                            <small>{item.actor.role || "No role"}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{item.target?.name || "—"}</strong>
                        <small>{item.target?.type || ""}</small>
                      </td>
                      <td><span className={`alog-pill ${actionTones[item.action] || "slate"}`}>{item.action}</span></td>
                      <td>
                        <span className={`alog-result ${item.outcome === "Success" ? "success" : "warning"}`}>
                          <i />
                          {item.outcome}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="alog-footer">
            <span>{total === 0 ? "Showing 0 activities" : `Showing ${from}–${to} of ${total.toLocaleString("en-US")} activities`}</span>
            <div className="alog-pager">
              <button type="button" aria-label="Previous page" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}><Icon name="chevron" size={14} /></button>
              {pageList(safePage, pageCount).map((value, index, list) => (
                <span key={value}>
                  {index > 0 && value - list[index - 1] > 1 ? <span>...</span> : null}
                  <button type="button" className={safePage === value ? "on" : ""} onClick={() => setPage(value)}>{value}</button>
                </span>
              ))}
              <button type="button" aria-label="Next page" disabled={safePage === pageCount} onClick={() => setPage(safePage + 1)}><Icon name="chevron" size={14} /></button>
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
              <span className={`alog-action-icon ${categoryTones[selected.category] || "slate"}`}><Icon name="file" size={15} /></span>
              <div>
                <strong>{selected.event}</strong>
                <small>{selected.description || selected.eventId}</small>
              </div>
            </div>
            <div className="alog-inspector-body">
              <dl className="alog-detail-list">
                <div><dt><Icon name="clock" size={13} /> Timestamp</dt><dd>{clock(selected.timestamp).date} {clock(selected.timestamp).time}</dd></div>
                <div><dt><Icon name="user" size={13} /> Actor</dt><dd><span className={`id-avatar ${toneFor(selected.actor.name || "System")}`}>{letter(selected.actor.name || "System")}</span>{selected.actor.name || "System"}<small>{selected.actor.role || "No role"}</small></dd></div>
                <div><dt><Icon name="layers" size={13} /> Category</dt><dd><span className={`alog-pill ${categoryTones[selected.category] || "slate"}`}>{selected.category}</span></dd></div>
                <div><dt><Icon name="bolt" size={13} /> Action</dt><dd>{detail ? displayLabel(detail.action) : selected.action}</dd></div>
                <div><dt><Icon name="crosshair" size={13} /> Target</dt><dd>{selected.target?.name || "—"}<small>{selected.target?.type || ""}</small></dd></div>
                <div><dt><Icon name="check" size={13} /> Outcome</dt><dd><span className={`alog-result ${selected.outcome === "Success" ? "success" : "warning"}`}><i />{selected.outcome}</span></dd></div>
              </dl>
              <section>
                <small>Description</small>
                <p>{detail?.description || selected.description || "No description."}</p>
              </section>
              {extras.length > 0 && (
                <section>
                  <small>Additional Information</small>
                  <dl className="alog-extra">
                    {extras.map(([label, value]) => (
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

function detailExtras(detail: AuditDetail | null) {
  if (!detail) return [];
  const rows: [string, string][] = [];
  if (detail.ipAddress) rows.push(["IP address", detail.ipAddress]);
  if (detail.actorType) rows.push(["Actor type", displayLabel(detail.actorType)]);
  if (detail.metadata) {
    for (const [key, value] of Object.entries(detail.metadata)) rows.push([fieldLabel(key), fieldValue(value)]);
  }
  return rows;
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState({ top: 0, left: 0, width: 160 });
  const current = options.find((item) => item.value === value)?.label ?? label;

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function toggle() {
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setPlace({
        top: below < 220 ? Math.max(8, rect.top - 224) : rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 160),
      });
    }
    setOpen((currentOpen) => !currentOpen);
  }

  return (
    <div className={`alog-filter${open ? " open" : ""}`} ref={rootRef}>
      <button type="button" aria-label={label} aria-expanded={open} onClick={toggle}>{current}</button>
      <Icon name="chevron" size={13} />
      {open && (
        <ul className="alog-menu" role="listbox" style={{ top: place.top, left: place.left, width: place.width }}>
          {options.map((item) => (
            <li key={item.value}>
              <button type="button" className={item.value === value ? "on" : ""} onClick={() => { onChange(item.value); setOpen(false); }}>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ icon, tone, label, value }: { icon: IconName; tone: string; label: string; value: number }) {
  const bars = tone === "red" ? [16, 14, 15, 11, 12, 8, 9, 5] : [4, 8, 6, 12, 9, 14, 11, 16];
  return (
    <article className={`alog-stat ${tone}`}>
      <span><Icon name={icon} size={16} /></span>
      <div>
        <strong>{value.toLocaleString("en-US")}</strong>
        <small>{label}</small>
      </div>
      <svg viewBox="0 0 64 22" className="alog-spark" aria-hidden="true">
        {bars.map((height, index) => (
          <rect key={index} x={index * 8} y={22 - height} width="5" height={height} rx="1" />
        ))}
      </svg>
    </article>
  );
}
