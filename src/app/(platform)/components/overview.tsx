"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/icon";
import TraxonMap from "@/components/map/traxon-map";
import {
  activeAlerts,
  assetBreakdown,
  commandStats,
  healthBreakdown,
  liveFeed,
  personnel,
  type PersonnelStatus,
} from "./command-data";

function Donut({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: { value: number; color: string }[];
  centerValue: string;
  centerLabel: string;
}) {
  const total = segments.reduce((sum, item) => sum + item.value, 0) || 1;
  let cursor = 0;
  const stops = segments
    .map((item) => {
      const start = (cursor / total) * 100;
      cursor += item.value;
      const end = (cursor / total) * 100;
      return `${item.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="cmd-donut" style={{ background: `conic-gradient(${stops})` }}>
      <div>
        <strong>{centerValue}</strong>
        <span>{centerLabel}</span>
      </div>
    </div>
  );
}

export default function Overview() {
  const [selected, setSelected] = useState(4);
  const [tableFilter, setTableFilter] = useState<"all" | PersonnelStatus>("all");
  const [tableQuery, setTableQuery] = useState("");
  const [assetTab, setAssetTab] = useState<"weapons" | "vehicles" | "infra">("weapons");

  const tableRows = useMemo(() => {
    return personnel.filter((person) => {
      if (tableFilter !== "all" && person.status !== tableFilter) return false;
      if (!tableQuery.trim()) return true;
      const q = tableQuery.trim().toLowerCase();
      return `${person.id} ${person.name} ${person.squad}`.toLowerCase().includes(q);
    });
  }, [tableFilter, tableQuery]);

  return (
    <div className="cmd-page">
      <header className="cmd-head">
        <div>
          <h1>Command Overview</h1>
          <p>Real-time overview of all personnel, weapons, and operational assets.</p>
        </div>
        <div className="cmd-head-side">
          <button type="button" className="cmd-op-pill">
            <i />
            Operation Alpha — Live Operation
            <Icon name="chevron" size={13} />
          </button>
          <div className="cmd-weather">
            <Icon name="sun" size={16} />
            <div>
              <strong>28°C · Partly Cloudy</strong>
              <small>Wind 12 km/h · Humidity 68%</small>
            </div>
          </div>
        </div>
      </header>

      <section className="cmd-stats">
        {commandStats.map((stat) => (
          <article key={stat.label} className={`cmd-stat ${stat.tone}`}>
            <div className="cmd-stat-top">
              <span className="cmd-stat-icon">
                <Icon name={stat.icon} size={15} />
              </span>
              {stat.ring != null && (
                <span className="cmd-ring" style={{ background: `conic-gradient(currentColor ${stat.ring}%, color-mix(in srgb, var(--border) 80%, transparent) 0)` }} />
              )}
            </div>
            <small>{stat.label}</small>
            <strong>{stat.value}</strong>
            <em>{stat.meta}</em>
          </article>
        ))}
        <article className="cmd-stat weather">
          <div className="cmd-stat-top">
            <span className="cmd-stat-icon">
              <Icon name="sun" size={15} />
            </span>
          </div>
          <small>Weather</small>
          <strong>28°C</strong>
          <em>Partly cloudy · 12 km/h</em>
        </article>
      </section>

      <section className="cmd-mid">
        <div className="cmd-map-panel panel">
          <TraxonMap selected={selected} onSelect={setSelected} />
        </div>

        <aside className="cmd-side">
          <div className="panel cmd-alerts">
            <div className="panel-header">
              <div>
                <h2>Active Alerts</h2>
                <p>{activeAlerts.length} requiring attention</p>
              </div>
              <button type="button" className="more-button">
                <Icon name="more" />
              </button>
            </div>
            <div className="cmd-alert-list">
              {activeAlerts.map((alert) => (
                <article key={alert.title + alert.time} className={`cmd-alert ${alert.level}`}>
                  <span className="cmd-alert-icon">
                    <Icon name={alert.icon} size={15} />
                  </span>
                  <div>
                    <strong>{alert.title}</strong>
                    <span>{alert.subject}</span>
                    <small>
                      <Icon name="clock" size={11} />
                      {alert.time}
                    </small>
                  </div>
                  <em>{alert.level}</em>
                </article>
              ))}
            </div>
          </div>

          <div className="panel cmd-feed">
            <div className="panel-header">
              <div>
                <h2>Live Activity</h2>
                <p>Streaming operational events</p>
              </div>
              <Link href="/activity-log" className="cmd-link">
                View all <Icon name="arrow" size={13} />
              </Link>
            </div>
            <div className="cmd-feed-list">
              {liveFeed.map((item) => (
                <article key={item.time + item.text} className={`cmd-feed-item ${item.tone}`}>
                  <time>{item.time}</time>
                  <div>
                    <strong>{item.text}</strong>
                    <span>{item.tag}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="cmd-bottom">
        <div className="panel cmd-table-panel">
          <div className="cmd-table-head">
            <div>
              <h2>All Personnel</h2>
              <p>Live roster and vitals</p>
            </div>
            <label className="cmd-table-search">
              <Icon name="search" size={14} />
              <input
                value={tableQuery}
                onChange={(e) => setTableQuery(e.target.value)}
                placeholder="Search personnel..."
              />
            </label>
            <div className="cmd-table-tabs">
              {(
                [
                  ["all", "All"],
                  ["online", "Online"],
                  ["warning", "Alert"],
                  ["offline", "Offline"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={tableFilter === id ? "on" : ""}
                  onClick={() => setTableFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="cmd-table-wrap">
            <table className="cmd-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Squad</th>
                  <th>HR</th>
                  <th>Temp</th>
                  <th>Battery</th>
                  <th>Last Seen</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tableRows.map((person) => (
                  <tr
                    key={person.id}
                    className={personnel.indexOf(person) === selected ? "selected" : ""}
                    onClick={() => setSelected(personnel.indexOf(person))}
                  >
                    <td>
                      <code>{person.id}</code>
                    </td>
                    <td>
                      <strong>{person.name}</strong>
                    </td>
                    <td>
                      <span className={`cmd-status ${person.status}`}>
                        <i />
                        {person.status === "warning" ? "Warning" : person.status[0].toUpperCase() + person.status.slice(1)}
                      </span>
                    </td>
                    <td>{person.squad}</td>
                    <td>{person.hr ?? "—"}</td>
                    <td>{person.temp != null ? `${person.temp}°C` : "—"}</td>
                    <td>{person.battery != null ? `${person.battery}%` : "—"}</td>
                    <td>{person.lastSeen}</td>
                    <td>
                      <button type="button" aria-label="Actions" onClick={(e) => e.stopPropagation()}>
                        <Icon name="more" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel cmd-health">
          <div className="panel-header">
            <div>
              <h2>Personnel Health Overview</h2>
              <p>Vitals distribution across the force</p>
            </div>
          </div>
          <div className="cmd-health-body">
            <Donut segments={healthBreakdown} centerValue="48" centerLabel="Personnel" />
            <div className="cmd-legend">
              {healthBreakdown.map((item) => (
                <span key={item.label}>
                  <i style={{ background: item.color }} />
                  {item.label}
                  <b>
                    {item.value} · {item.pct}
                  </b>
                </span>
              ))}
            </div>
          </div>
          <div className="cmd-mini-grid">
            <div>
              <small>Avg Heart Rate</small>
              <strong>82 BPM</strong>
            </div>
            <div>
              <small>Avg Temperature</small>
              <strong>36.6°C</strong>
            </div>
            <div>
              <small>Low Battery</small>
              <strong>6 Personnel</strong>
            </div>
            <div>
              <small>Health Alerts</small>
              <strong>4 Personnel</strong>
            </div>
          </div>
        </div>

        <div className="panel cmd-assets">
          <div className="panel-header">
            <div>
              <h2>Operational Assets</h2>
              <p>Weapons, vehicles, and infrastructure</p>
            </div>
          </div>
          <div className="cmd-asset-tabs">
            {(
              [
                ["weapons", "Weapons"],
                ["vehicles", "Vehicles"],
                ["infra", "Infrastructure"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" className={assetTab === id ? "on" : ""} onClick={() => setAssetTab(id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="cmd-health-body">
            <Donut
              segments={assetBreakdown}
              centerValue={assetTab === "weapons" ? "46" : assetTab === "vehicles" ? "12" : "8"}
              centerLabel={assetTab === "weapons" ? "Weapons" : assetTab === "vehicles" ? "Vehicles" : "Nodes"}
            />
            <div className="cmd-legend">
              {assetBreakdown.map((item) => (
                <span key={item.label}>
                  <i style={{ background: item.color }} />
                  {item.label}
                  <b>{item.value}</b>
                </span>
              ))}
            </div>
          </div>
          <div className="cmd-asset-counters">
            <div>
              <strong>43</strong>
              <small>Connected</small>
            </div>
            <div>
              <strong>2</strong>
              <small>Disconnected</small>
            </div>
            <div>
              <strong>1</strong>
              <small>Unassigned</small>
            </div>
            <div>
              <strong>3</strong>
              <small>Low Battery</small>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
