"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import WeaponMap from "./weapon-map";
import {
  matchesFilter,
  statusLabel,
  weaponStats,
  weaponStatusBreakdown,
  weaponTypeBreakdown,
  weapons,
  type MapFilter,
  type WeaponStatus,
} from "./weapons-data";

const FILTERS: { id: MapFilter; label: string; count: number }[] = [
  { id: "all", label: "All Weapons", count: 46 },
  { id: "connected", label: "Connected", count: 43 },
  { id: "disconnected", label: "Disconnected", count: 2 },
  { id: "unassigned", label: "Unassigned", count: 1 },
  { id: "low-battery", label: "Low Battery", count: 3 },
  { id: "maintenance", label: "Maintenance", count: 2 },
];

const DETAIL_TABS = ["Overview", "Assignment", "Status", "Telemetry", "History"] as const;

function statusClass(status: WeaponStatus) {
  if (status === "connected") return "online";
  if (status === "disconnected") return "critical";
  if (status === "low-battery") return "warning";
  if (status === "maintenance") return "offline";
  return "offline";
}

export default function WeaponsPage() {
  const [mapFilter, setMapFilter] = useState<MapFilter>("all");
  const [selectedId, setSelectedId] = useState("WPN-001");
  const [tableQuery, setTableQuery] = useState("");
  const [page, setPage] = useState(1);
  const [detailTab, setDetailTab] = useState<(typeof DETAIL_TABS)[number]>("Overview");
  const pageSize = 6;

  const selected = weapons.find((w) => w.id === selectedId) ?? weapons[0];

  const tableRows = useMemo(() => {
    const q = tableQuery.trim().toLowerCase();
    return weapons.filter((weapon) => {
      if (!matchesFilter(weapon, mapFilter)) return false;
      if (!q) return true;
      return `${weapon.id} ${weapon.type} ${weapon.assignedTo} ${weapon.squad} ${weapon.serial}`
        .toLowerCase()
        .includes(q);
    });
  }, [mapFilter, tableQuery]);

  const pageCount = Math.max(1, Math.ceil(tableRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = tableRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rangeStart = tableRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, tableRows.length);

  return (
    <div className="wpn-page">
      <header className="wpn-head">
        <div>
          <h1>Weapons</h1>
          <p>Monitor and manage all weapon assets, their status, assignment, and operational readiness.</p>
        </div>
      </header>

      <section className="wpn-stats">
        {weaponStats.map((stat) => (
          <article key={stat.label} className={`wpn-stat ${stat.tone}`}>
            <span className="wpn-stat-icon">
              <Icon name={stat.icon} size={16} />
            </span>
            <div>
              <small>{stat.label}</small>
              <strong>{stat.value}</strong>
              <em>{stat.meta}</em>
            </div>
          </article>
        ))}
      </section>

      <section className="wpn-mid">
        <div className="panel wpn-map-panel">
          <div className="wpn-map-filters" role="tablist" aria-label="Weapon map filters">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={mapFilter === item.id}
                className={mapFilter === item.id ? "on" : ""}
                onClick={() => {
                  setMapFilter(item.id);
                  setPage(1);
                }}
              >
                {item.label} ({item.count})
              </button>
            ))}
          </div>
          <WeaponMap filter={mapFilter} selectedId={selected.id} onSelect={setSelectedId} />
        </div>

        <aside className="wpn-charts">
          <div className="panel wpn-status-chart">
            <h3>Weapon Status</h3>
            <div className="wpn-status-body">
              <img className="wpn-status-photo" src="/images/weapon-rifle-plain.jpg" alt="Assault rifle" />
              <div className="wpn-status-legend">
                {weaponStatusBreakdown.map((item) => (
                  <span key={item.label}>
                    <i style={{ background: item.color }} />
                    <em>{item.label}</em>
                    <b style={{ color: item.color }}>{item.value}</b>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="panel wpn-types-chart">
            <h3>Weapon Types</h3>
            <div className="wpn-type-list">
              {weaponTypeBreakdown.map((item) => (
                <div key={item.type} className="wpn-type-row">
                  <span className="wpn-type-icon" style={{ color: item.color }}>
                    <Icon name="crosshair" size={14} />
                  </span>
                  <div>
                    <strong>{item.type}</strong>
                    <span className="wpn-type-bar">
                      <i style={{ width: `${item.pct}%`, background: item.color }} />
                    </span>
                  </div>
                  <em>
                    {item.count}
                    <small>{item.pct.toFixed(1)}%</small>
                  </em>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="wpn-bottom">
        <div className="panel wpn-table-panel">
          <div className="wpn-table-head">
            <div>
              <h2>All Weapons</h2>
              <p>{tableRows.length} assets in current view</p>
            </div>
            <label className="cmd-table-search">
              <Icon name="search" size={14} />
              <input
                value={tableQuery}
                onChange={(e) => {
                  setTableQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search weapons..."
              />
            </label>
            <button type="button" className="wpn-export">
              <Icon name="download" size={14} />
              Export
            </button>
          </div>
          <div className="cmd-table-wrap">
            <table className="cmd-table wpn-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Battery</th>
                  <th>Assigned To</th>
                  <th>Squad</th>
                  <th>Last Seen</th>
                  <th>Location</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((weapon) => (
                  <tr
                    key={weapon.id}
                    className={`${weapon.status}${selected.id === weapon.id ? " selected" : ""}`}
                    onClick={() => setSelectedId(weapon.id)}
                  >
                    <td>
                      <code>{weapon.id}</code>
                    </td>
                    <td>
                      <strong>{weapon.type}</strong>
                    </td>
                    <td>
                      <span className={`cmd-status ${statusClass(weapon.status)}`}>
                        <i />
                        {statusLabel(weapon.status)}
                      </span>
                    </td>
                    <td>{weapon.battery != null ? `${weapon.battery}%` : "—"}</td>
                    <td>
                      <button type="button" className="wpn-link">
                        {weapon.assignedTo}
                      </button>
                    </td>
                    <td>{weapon.squad}</td>
                    <td>{weapon.lastSeen}</td>
                    <td>
                      <small>
                        {weapon.lat.toFixed(4)}, {weapon.lng.toFixed(4)}
                      </small>
                    </td>
                    <td>
                      <div className="wpn-row-actions">
                        <button type="button" aria-label="View">
                          <Icon name="search" size={14} />
                        </button>
                        <button type="button" aria-label="More">
                          <Icon name="more" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cmd-pager">
            <span>
              {rangeStart}–{rangeEnd} of {tableRows.length}
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
        </div>

        <aside className="panel wpn-detail">
          <div className="wpn-detail-head">
            <div className="wpn-detail-visual" aria-hidden="true">
              <Icon name="crosshair" size={28} />
            </div>
            <div>
              <div className="wpn-detail-title">
                <strong>{selected.type}</strong>
                <span className={`cmd-status ${statusClass(selected.status)}`}>
                  <i />
                  {statusLabel(selected.status)}
                </span>
              </div>
              <p>
                <code>{selected.id}</code>
                <span>·</span>
                Serial {selected.serial}
              </p>
            </div>
          </div>
          <div className="wpn-detail-tabs">
            {DETAIL_TABS.map((tab) => (
              <button key={tab} type="button" className={detailTab === tab ? "on" : ""} onClick={() => setDetailTab(tab)}>
                {tab}
              </button>
            ))}
          </div>
          {detailTab === "Overview" ? (
            <div className="wpn-detail-grid">
              <div>
                <small>Status</small>
                <strong className={statusClass(selected.status)}>{statusLabel(selected.status)}</strong>
              </div>
              <div>
                <small>Assigned To</small>
                <strong>
                  <button type="button" className="wpn-link">
                    {selected.assignedTo}
                  </button>
                </strong>
              </div>
              <div className="wpn-battery-cell">
                <small>Battery</small>
                <strong>{selected.battery != null ? `${selected.battery}%` : "—"}</strong>
                {selected.battery != null && (
                  <span className="wpn-battery-bar">
                    <i
                      style={{
                        width: `${selected.battery}%`,
                        background: selected.battery < 20 ? "#fbbf24" : selected.battery < 40 ? "#fb923c" : "#34d399",
                      }}
                    />
                  </span>
                )}
              </div>
              <div>
                <small>Squad</small>
                <strong>{selected.squad}</strong>
              </div>
              <div>
                <small>Last Seen</small>
                <strong>{selected.lastSeen}</strong>
              </div>
              <div>
                <small>Temperature</small>
                <strong className={selected.temperature != null && selected.temperature >= 32 ? "hot" : ""}>
                  {selected.temperature != null ? `${selected.temperature.toFixed(1)} °C` : "—"}
                </strong>
              </div>
            </div>
          ) : (
            <div className="wpn-detail-empty">
              {detailTab} details for {selected.id} will appear here.
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
