"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import Icon from "@/components/ui/icon";
import TraxonMap from "@/components/map/traxon-map";
import {
  activeAlerts,
  commandStats,
  healthBreakdown,
  liveFeed,
  personnel,
  type PersonnelStatus,
} from "./command-data";

function ringSlice(start: number, end: number, outer = 68, inner = 46) {
  const point = (deg: number, radius: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [Math.cos(rad) * radius, Math.sin(rad) * radius];
  };
  const large = end - start > 180 ? 1 : 0;
  const [x1, y1] = point(start, outer);
  const [x2, y2] = point(end, outer);
  const [x3, y3] = point(end, inner);
  const [x4, y4] = point(start, inner);
  return `M ${x1} ${y1} A ${outer} ${outer} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${large} 0 ${x4} ${y4} Z`;
}

function Donut({
  segments,
  centerValue,
  centerLabel,
  active,
  onActive,
}: {
  segments: { value: number; color: string; label: string }[];
  centerValue: string;
  centerLabel: string;
  active: number | null;
  onActive: (index: number | null) => void;
}) {
  const slices = useMemo(() => {
    const total = segments.reduce((sum, item) => sum + item.value, 0) || 1;
    let cursor = 0;
    return segments.map((item) => {
      const span = (item.value / total) * 360;
      const start = cursor;
      cursor += span;
      const pad = span > 10 ? 0.7 : 0.15;
      const mid = ((start + span / 2 - 90) * Math.PI) / 180;
      return {
        ...item,
        d: ringSlice(start + pad, start + span - pad),
        tx: Math.cos(mid),
        ty: Math.sin(mid),
      };
    });
  }, [segments]);
  const [angle, setAngle] = useState(0);
  const drag = useRef<{ x: number; a: number } | null>(null);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, a: angle };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    setAngle(drag.current.a + (event.clientX - drag.current.x) * 0.6);
  }

  function onPointerUp() {
    drag.current = null;
  }

  return (
    <div
      className="cmd-donut-stage"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="img"
      aria-label={`${centerValue} ${centerLabel}. Drag to rotate.`}
    >
      <div className="cmd-donut-spin" style={{ transform: `rotate(${angle}deg)` }}>
        <svg className="cmd-donut-svg" viewBox="-84 -84 168 168">
          <g className="cmd-donut-depth" transform="translate(0 6)">
            {slices.map((slice) => (
              <path key={slice.label} d={slice.d} fill={slice.color} />
            ))}
          </g>
          {slices.map((slice, index) => (
            <g key={slice.label}>
              <path
                className={active === index ? "cmd-arc is-up" : "cmd-arc"}
                d={slice.d}
                fill={slice.color}
                pointerEvents="none"
                style={{
                  transform: active === index ? `translate(${slice.tx * 12}px, ${slice.ty * 12}px)` : "translate(0, 0)",
                }}
              />
              <path
                className="cmd-arc-hit"
                d={slice.d}
                fill="transparent"
                onPointerEnter={() => onActive(index)}
                onPointerLeave={() => onActive(null)}
              />
            </g>
          ))}
        </svg>
      </div>
      <div className="cmd-donut-label">
        <strong>{centerValue}</strong>
        <span>{centerLabel}</span>
      </div>
    </div>
  );
}

export default function Overview() {
  const [selected, setSelected] = useState(-1);
  const [tableFilter, setTableFilter] = useState<"all" | PersonnelStatus>("all");
  const [tableQuery, setTableQuery] = useState("");
  const [page, setPage] = useState(1);
  const [healthHover, setHealthHover] = useState<number | null>(null);
  const pageSize = 6;

  const tableRows = useMemo(() => {
    return personnel.filter((person) => {
      if (tableFilter !== "all" && person.status !== tableFilter) return false;
      if (!tableQuery.trim()) return true;
      const q = tableQuery.trim().toLowerCase();
      return `${person.id} ${person.name} ${person.squad}`.toLowerCase().includes(q);
    });
  }, [tableFilter, tableQuery]);

  const pageCount = Math.max(1, Math.ceil(tableRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = tableRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rangeStart = tableRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, tableRows.length);

  return (
    <div className="cmd-page">
      <header className="cmd-head page-title">
        <span className="cmd-head-icon page-title-icon"><Icon name="grid" size={15} /></span>
        <div>
          <h1>Command Overview</h1>
          <p>Real-time overview of all personnel, weapons, and operational assets.</p>
        </div>
      </header>

      <section className="cmd-stats">
        {commandStats.map((stat) => (
          <article key={stat.label} className={`cmd-stat ${stat.tone}`}>
            {stat.ring != null ? (
              <span className="cmd-ring-wrap">
                <i
                  className="cmd-ring"
                  style={{ background: `conic-gradient(#34d399 ${stat.ring}%, rgba(52, 211, 153, 0.18) 0)` }}
                />
                <Icon name={stat.icon} size={14} />
              </span>
            ) : (
              <span className={`cmd-stat-icon ${stat.iconTone ?? "blue"}`}>
                <Icon name={stat.icon} size={15} />
              </span>
            )}
            <div className="cmd-stat-copy">
              <small>{stat.label}</small>
              <strong>{stat.value}</strong>
            </div>
          </article>
        ))}
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
              <Link href="/alerts" className="cmd-link">
                View all <Icon name="arrow" size={13} />
              </Link>
            </div>
            <div className="cmd-alert-list">
              {activeAlerts.map((alert) => (
                <article key={alert.title + alert.time} className={`cmd-alert ${alert.level}`}>
                  <span className="cmd-alert-icon">
                    <Icon name={alert.icon} size={13} />
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
              <Icon name="search" size={13} />
              <input
                value={tableQuery}
                onChange={(e) => {
                  setTableQuery(e.target.value);
                  setPage(1);
                }}
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
                  onClick={() => {
                    setTableFilter(id);
                    setPage(1);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="cmd-table-wrap">
            <table className="cmd-table">
              <colgroup>
                <col style={{ width: "72px" }} />
                <col />
                <col style={{ width: "118px" }} />
                <col style={{ width: "72px" }} />
                <col style={{ width: "48px" }} />
                <col style={{ width: "64px" }} />
                <col style={{ width: "72px" }} />
                <col style={{ width: "84px" }} />
                <col style={{ width: "36px" }} />
              </colgroup>
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
                {pageRows.map((person) => (
                  <tr
                    key={person.id}
                    className={personnel.indexOf(person) === selected ? "selected" : ""}
                    onClick={() => {
                      const index = personnel.indexOf(person);
                      setSelected((current) => (current === index ? -1 : index));
                    }}
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
                        <Icon name="more" size={14} />
                      </button>
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

        <div className="panel cmd-health">
          <div className="panel-header">
            <div>
              <h2>Personnel Health Overview</h2>
              <p>Vitals distribution across the force</p>
            </div>
            <span className="cmd-mini-icon green" aria-hidden="true">
              <Icon name="heart" size={13} />
            </span>
          </div>
          <div className="cmd-health-body">
            <Donut
              segments={healthBreakdown}
              centerValue="48"
              centerLabel="Personnel"
              active={healthHover}
              onActive={setHealthHover}
            />
            <div className="cmd-legend">
              {healthBreakdown.map((item, index) => (
                <span
                  key={item.label}
                  className={healthHover === index ? "is-up" : ""}
                  onPointerEnter={() => setHealthHover(index)}
                  onPointerLeave={() => setHealthHover(null)}
                >
                  <i style={{ background: item.color }} />
                  <em>{item.label}</em>
                  <b style={{ color: item.color }}>{item.value}</b>
                  <small>{item.pct}</small>
                </span>
              ))}
            </div>
          </div>
          <div className="cmd-mini-grid">
            <div>
              <span className="cmd-mini-icon green">
                <Icon name="heart" size={13} />
              </span>
              <div>
                <small>Avg Heart Rate</small>
                <strong className="green">82 BPM</strong>
              </div>
            </div>
            <div>
              <span className="cmd-mini-icon amber">
                <Icon name="thermo" size={13} />
              </span>
              <div>
                <small>Avg Temperature</small>
                <strong className="amber">36.6°C</strong>
              </div>
            </div>
            <div>
              <span className="cmd-mini-icon amber">
                <Icon name="bolt" size={13} />
              </span>
              <div>
                <small>Low Battery</small>
                <strong className="amber">6 Personnel</strong>
              </div>
            </div>
            <div>
              <span className="cmd-mini-icon red">
                <Icon name="bell" size={13} />
              </span>
              <div>
                <small>Health Alerts</small>
                <strong className="red">4 Personnel</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
