"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/icon";
import {
  NOTICES,
  NOTICE_SUMMARY,
  getNoticeStatus,
  levelLabel,
  loadReadIds,
  loadStatusMap,
  saveReadIds,
  saveStatusMap,
  statusLabel,
  type Notice,
  type NoticeLevel,
  type NoticeStatus,
} from "@/lib/notifications";
import NoticeMap from "./notice-map";

type Filter = "all" | "unread" | NoticeLevel;
type DetailTab = "Overview" | "Location" | "Timeline" | "Raw Data";

const FILTERS: { id: Filter; label: string; count: number }[] = [
  { id: "all", label: "All", count: NOTICE_SUMMARY.all.value },
  { id: "critical", label: "Critical", count: NOTICE_SUMMARY.critical.value },
  { id: "warning", label: "Warning", count: NOTICE_SUMMARY.warning.value },
  { id: "info", label: "Info", count: NOTICE_SUMMARY.info.value },
  { id: "unread", label: "Unread", count: NOTICE_SUMMARY.unread },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState("all");
  const [range, setRange] = useState("24h");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(NOTICES[0]?.id ?? "");
  const [detailTab, setDetailTab] = useState<DetailTab>("Overview");
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [statusMap, setStatusMap] = useState<Record<string, NoticeStatus>>({});
  const [ready, setReady] = useState(false);
  const [detailOpen, setDetailOpen] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    const reads = loadReadIds();
    const statuses = loadStatusMap();
    setReadIds(reads);
    setStatusMap(statuses);
    setReady(true);
  }, []);

  const selected = NOTICES.find((n) => n.id === selectedId) ?? NOTICES[0];

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NOTICES.filter((notice) => {
      const status = getNoticeStatus(notice.id, readIds, statusMap);
      if (filter === "unread" && status === "read") return false;
      if (filter !== "all" && filter !== "unread" && notice.level !== filter) return false;
      if (category !== "all" && notice.category !== category) return false;
      if (!q) return true;
      return `${notice.title} ${notice.detail} ${notice.source} ${notice.area} ${notice.alertType} ${notice.category}`
        .toLowerCase()
        .includes(q);
    });
  }, [filter, category, query, readIds, statusMap]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rangeStart = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, rows.length);
  const allPageChecked = pageRows.length > 0 && pageRows.every((row) => checked.has(row.id));

  const markRead = (ids: string[]) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      saveReadIds(next);
      return next;
    });
    setStatusMap((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = "read";
      });
      saveStatusMap(next);
      return next;
    });
  };

  const markAllRead = () => markRead(NOTICES.map((n) => n.id));

  const openRow = (notice: Notice) => {
    setSelectedId(notice.id);
    setDetailOpen(true);
    setDetailTab("Overview");
    if (getNoticeStatus(notice.id, readIds, statusMap) === "unseen") {
      setStatusMap((prev) => {
        const next: Record<string, NoticeStatus> = { ...prev, [notice.id]: "unread" };
        saveStatusMap(next);
        return next;
      });
    }
  };

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (allPageChecked) pageRows.forEach((row) => next.delete(row.id));
      else pageRows.forEach((row) => next.add(row.id));
      return next;
    });
  };

  const statusOf = (id: string) => getNoticeStatus(id, readIds, statusMap);

  return (
    <div className={`ntf-page${detailOpen ? " has-detail" : ""}`}>
      <header className="ntf-head">
        <div>
          <h1>Notifications</h1>
          <p>Real-time alerts, system events, and important updates from across the platform.</p>
        </div>
        <div className="ntf-head-actions">
          <button type="button" className="ntf-btn" onClick={markAllRead} disabled={!ready}>
            <Icon name="check" size={14} />
            Mark all as read
          </button>
          <button type="button" className="ntf-btn" onClick={() => router.push("/settings")}>
            <Icon name="settings" size={14} />
            Notification Settings
          </button>
        </div>
      </header>

      <section className="ntf-stats">
        <article className="ntf-stat critical">
          <span className="ntf-stat-icon">
            <Icon name="bolt" size={15} />
          </span>
          <div className="ntf-stat-copy">
            <small>Critical</small>
            <strong>{NOTICE_SUMMARY.critical.value}</strong>
            <em>{NOTICE_SUMMARY.critical.meta}</em>
          </div>
        </article>
        <article className="ntf-stat warning">
          <span className="ntf-stat-icon">
            <Icon name="bell" size={15} />
          </span>
          <div className="ntf-stat-copy">
            <small>Warning</small>
            <strong>{NOTICE_SUMMARY.warning.value}</strong>
            <em>{NOTICE_SUMMARY.warning.meta}</em>
          </div>
        </article>
        <article className="ntf-stat info">
          <span className="ntf-stat-icon">
            <Icon name="signal" size={15} />
          </span>
          <div className="ntf-stat-copy">
            <small>Info</small>
            <strong>{NOTICE_SUMMARY.info.value}</strong>
            <em>{NOTICE_SUMMARY.info.meta}</em>
          </div>
        </article>
        <article className="ntf-stat all">
          <span className="ntf-stat-icon">
            <Icon name="layers" size={15} />
          </span>
          <div className="ntf-stat-copy">
            <small>All Notifications</small>
            <strong>{NOTICE_SUMMARY.all.value}</strong>
            <em>{NOTICE_SUMMARY.all.meta}</em>
          </div>
        </article>
      </section>

      <div className="ntf-body">
        <section className="panel ntf-list-panel">
          <div className="ntf-toolbar">
            <div className="ntf-filters" role="tablist">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={filter === item.id ? "on" : ""}
                  onClick={() => {
                    setFilter(item.id);
                    setPage(1);
                  }}
                >
                  {item.label} ({item.count})
                </button>
              ))}
            </div>
            <div className="ntf-toolbar-side">
              <label className="ntf-search">
                <Icon name="search" size={14} />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search notifications..."
                />
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                aria-label="Category"
              >
                <option value="all">All Categories</option>
                <option value="personnel">Personnel</option>
                <option value="weapon">Weapons</option>
                <option value="mission">Mission</option>
                <option value="gateway">Gateway</option>
                <option value="system">System</option>
              </select>
              <select value={range} onChange={(e) => setRange(e.target.value)} aria-label="Time range">
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
          </div>

          <div className="ntf-table-wrap">
            <table className="ntf-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allPageChecked}
                      onChange={toggleAll}
                      aria-label="Select all on this page"
                    />
                  </th>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Source</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((notice) => {
                  const status = statusOf(notice.id);
                  const active = selected?.id === notice.id && detailOpen;
                  return (
                    <tr
                      key={notice.id}
                      className={`${notice.level} ${status}${active ? " active" : ""}`}
                      onClick={() => openRow(notice)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={checked.has(notice.id)}
                          onChange={() => toggleCheck(notice.id)}
                          aria-label={`Select ${notice.id}`}
                        />
                      </td>
                      <td>
                        <span className={`ntf-type ${notice.level}`}>
                          <Icon name={notice.icon} size={14} />
                        </span>
                      </td>
                      <td>
                        <div className="ntf-msg">
                          <strong>{notice.title}</strong>
                          <span>{notice.detail}</span>
                          <small>
                            {notice.lat.toFixed(4)}, {notice.lng.toFixed(4)}
                          </small>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="ntf-source"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (notice.href) router.push(notice.href);
                          }}
                        >
                          {notice.source}
                        </button>
                      </td>
                      <td>
                        <div className="ntf-time">
                          <strong>{notice.clock}</strong>
                          <span>{notice.relative}</span>
                        </div>
                      </td>
                      <td>
                        <em className={`ntf-status ${status}`}>{statusLabel(status)}</em>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="ntf-more" aria-label="More">
                          <Icon name="more" size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="cmd-pager">
            <span>
              {rangeStart}–{rangeEnd} of {rows.length}
            </span>
            <div>
              <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page">
                <Icon name="chevron" size={14} />
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                <button key={number} type="button" className={number === currentPage ? "on" : ""} onClick={() => setPage(number)}>
                  {number}
                </button>
              ))}
              <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Next page">
                <Icon name="chevron" size={14} />
              </button>
            </div>
          </div>
        </section>

        {detailOpen && selected && (
          <aside className="panel ntf-detail">
            <div className="ntf-detail-head">
              <div>
                <div className="ntf-detail-title">
                  <h2>{selected.title}</h2>
                  <em className={`ntf-level ${selected.level}`}>{levelLabel(selected.level)}</em>
                </div>
                <p>
                  {selected.clock} · {selected.relative}
                </p>
                <span>{selected.detail}</span>
              </div>
              <button type="button" className="ntf-close" aria-label="Close" onClick={() => setDetailOpen(false)}>
                ×
              </button>
            </div>

            <div className="ntf-detail-tabs">
              {(["Overview", "Location", "Timeline", "Raw Data"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={detailTab === tab ? "on" : ""}
                  onClick={() => setDetailTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="ntf-detail-body">
              {detailTab === "Overview" && (
                <>
                  <div className="ntf-telemetry">
                    <div>
                      <small>Source</small>
                      <strong>
                        {selected.sourceKind === "personnel" ? "Personnel" : selected.sourceKind === "weapon" ? "Weapon" : "Asset"}{" "}
                        {selected.source}
                      </strong>
                    </div>
                    <div>
                      <small>Alert Type</small>
                      <strong>{selected.alertType}</strong>
                    </div>
                    <div>
                      <small>Heart Rate</small>
                      <strong className={selected.hr != null && selected.hr >= 120 ? "hot" : ""}>
                        {selected.hr != null ? `${selected.hr} BPM` : "—"}
                      </strong>
                      {selected.hr != null && selected.hr >= 120 && <em>Critical</em>}
                    </div>
                    <div>
                      <small>Temperature</small>
                      <strong className={selected.temp != null && selected.temp >= 37.8 ? "hot" : ""}>
                        {selected.temp != null ? `${selected.temp.toFixed(1)} °C` : "—"}
                      </strong>
                      {selected.temp != null && selected.temp >= 37.8 && <em>Critical</em>}
                    </div>
                    <div>
                      <small>Battery</small>
                      <strong>{selected.battery != null ? `${selected.battery}%` : "—"}</strong>
                      {selected.battery != null && selected.battery < 20 && <em className="warn">Medium</em>}
                    </div>
                  </div>

                  <NoticeMap lat={selected.lat} lng={selected.lng} />

                  <div className="ntf-loc-meta">
                    <div>
                      <span className="ntf-loc-icon">
                        <Icon name="pin" size={14} />
                      </span>
                      <div>
                        <small>Location Coordinates</small>
                        <strong>
                          {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
                        </strong>
                      </div>
                    </div>
                    <div>
                      <span className="ntf-loc-icon">
                        <Icon name="compass" size={14} />
                      </span>
                      <div>
                        <small>Area</small>
                        <strong>{selected.area}</strong>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {detailTab === "Location" && (
                <>
                  <NoticeMap lat={selected.lat} lng={selected.lng} />
                  <div className="ntf-loc-meta">
                    <div>
                      <span className="ntf-loc-icon">
                        <Icon name="pin" size={14} />
                      </span>
                      <div>
                        <small>Coordinates</small>
                        <strong>
                          {selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}
                        </strong>
                      </div>
                    </div>
                    <div>
                      <span className="ntf-loc-icon">
                        <Icon name="map" size={14} />
                      </span>
                      <div>
                        <small>Area of Operation</small>
                        <strong>{selected.area}</strong>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {detailTab === "Timeline" && (
                <div className="ntf-timeline">
                  {selected.timeline.map((item) => (
                    <article key={item.time + item.text}>
                      <time>{item.time}</time>
                      <p>{item.text}</p>
                    </article>
                  ))}
                </div>
              )}

              {detailTab === "Raw Data" && (
                <pre className="ntf-raw">{JSON.stringify(selected, null, 2)}</pre>
              )}
            </div>

            <div className="ntf-detail-actions">
              <button type="button" className="danger" onClick={() => router.push("/overview")}>
                View on Map
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => router.push(selected.href ?? "/overview")}
              >
                {selected.sourceKind === "weapon" ? "View Weapon" : selected.sourceKind === "personnel" ? "View Personnel" : "Open Source"}
              </button>
              <button type="button" onClick={() => markRead([selected.id])}>
                Mark as Read
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
