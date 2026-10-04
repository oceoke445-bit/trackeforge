"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import Icon from "@/components/ui/icon";
import GroupMap from "./group-map";
import { groups, groupStats, type GroupId } from "./groups-data";

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
        d: ringSlice(start + pad, Math.max(start + pad + 0.4, start + span - pad)),
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

export default function GroupsPage() {
  const [selectedId, setSelectedId] = useState<GroupId>("alpha");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [healthHover, setHealthHover] = useState<number | null>(null);
  const pageSize = 5;

  const group = groups.find((item) => item.id === selectedId) ?? groups[0];
  const stats = groupStats(group);

  const members = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return group.members;
    return group.members.filter((member) =>
      `${member.id} ${member.name} ${member.rank} ${member.weapon}`.toLowerCase().includes(q),
    );
  }, [group, query]);
  const pageCount = Math.max(1, Math.ceil(members.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageRows = members.slice(pageStart, pageStart + pageSize);
  const rangeStart = members.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + pageSize, members.length);

  const health = useMemo(() => {
    const normal = group.members.filter((m) => m.status === "online").length;
    const elevated = group.members.filter((m) => m.status === "warning").length;
    const critical = group.members.filter((m) => m.status === "critical").length;
    const noData = group.members.filter((m) => m.status === "offline").length;
    return [
      { label: "Normal", value: normal, color: "#34d399" },
      { label: "Elevated", value: elevated, color: "#fbbf24" },
      { label: "Critical", value: critical, color: "#f87171" },
      { label: "No Data", value: noData, color: "#64748b" },
    ];
  }, [group]);

  const avgHr = Math.round(
    group.members.reduce((sum, m) => sum + (m.hr ?? 0), 0) / Math.max(1, group.members.filter((m) => m.hr != null).length),
  );
  const avgTemp = (
    group.members.reduce((sum, m) => sum + (m.temp ?? 0), 0) /
    Math.max(1, group.members.filter((m) => m.temp != null).length)
  ).toFixed(1);

  return (
    <div className="grp-page">
      <header className="grp-head page-title">
        <span className="page-title-icon"><Icon name="layers" size={15} /></span>
        <div>
          <h1>Groups</h1>
          <p>Manage and monitor operational groups, their personnel, assets, and mission status.</p>
        </div>
      </header>

      <div className="grp-selector">
        {groups.map((item) => {
          const s = groupStats(item);
          return (
            <button
              key={item.id}
              type="button"
              className={`grp-card ${item.tone}${selectedId === item.id ? " on" : ""}`}
              onClick={() => {
                setSelectedId(item.id);
                setPage(1);
              }}
            >
              <span className="grp-card-icon">
                <Icon name={item.emblem} size={18} />
              </span>
              <div>
                <strong>{item.name}</strong>
                <small>
                  <span className="personnel">
                    <b>{s.personnel}</b> Personnel
                  </span>
                  <span className="online">
                    <b>{s.online}</b> Online
                  </span>
                  <span className="alert">
                    <b>{s.alerts}</b> Alert
                  </span>
                  <span className="weapons">
                    <b>{s.weapons}</b> Weapons
                  </span>
                </small>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grp-body">
        <section className="grp-main">
          <div className="panel grp-map-panel">
            <div className="grp-map-head">
              <div>
                <div className="grp-map-title">
                  <h2>Group {group.name}</h2>
                  <em className={group.status === "Active" ? "active" : "standby"}>{group.status}</em>
                </div>
                <p>
                  {group.platoon} · {group.sector} · {group.mission}
                </p>
              </div>
              <div className="grp-map-actions">
                <button type="button" className="tf-icon-btn" aria-label="Fullscreen">
                  <Icon name="monitor" size={15} />
                </button>
              </div>
            </div>
            <GroupMap group={group} />
          </div>

          <div className="panel grp-table-panel">
            <div className="grp-table-head">
              <h2>Group Personnel ({group.members.length})</h2>
              <label className="cmd-table-search">
                <Icon name="search" size={14} />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search personnel..."
                />
              </label>
              <button type="button" className="grp-export">
                <Icon name="download" size={14} />
                Export
              </button>
            </div>
            <div className="cmd-table-wrap">
              <table className="cmd-table grp-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Rank</th>
                    <th>Status</th>
                    <th>HR</th>
                    <th>Temp</th>
                    <th>Battery</th>
                    <th>Weapon</th>
                    <th>Last Seen</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((member) => (
                    <tr key={member.id} className={member.status}>
                      <td>
                        <code>{member.id}</code>
                      </td>
                      <td>
                        <strong>{member.name}</strong>
                      </td>
                      <td>{member.rank}</td>
                      <td>
                        <span className={`cmd-status ${member.status}`}>
                          <i />
                          {member.status === "warning"
                            ? "Warning"
                            : member.status[0].toUpperCase() + member.status.slice(1)}
                        </span>
                      </td>
                      <td>{member.hr ?? "—"}</td>
                      <td>{member.temp != null ? `${member.temp}°C` : "—"}</td>
                      <td>{member.battery != null ? `${member.battery}%` : "—"}</td>
                      <td>
                        <button type="button" className="grp-weapon-link">
                          {member.weapon}
                        </button>
                      </td>
                      <td>{member.lastSeen}</td>
                      <td>
                        <button type="button" aria-label="View">
                          <Icon name="more" size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="cmd-pager">
              <span>
                {rangeStart}–{rangeEnd} of {members.length}
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
        </section>

        <aside className="grp-side">
          <div className="grp-side-top">
            <div className="panel grp-info">
              <h3>Group Information</h3>
              <div className="grp-commander">
                <span className="cmd-avatar">
                  {group.commander
                    .replace(/^Cpt\.\s*|^Lt\.\s*/i, "")
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <div>
                  <strong>{group.commander}</strong>
                  <small>{group.callSign}</small>
                </div>
              </div>
              <div className="grp-status-grid">
                <div>
                  <Icon name="users" size={12} />
                  <small>Personnel</small>
                  <strong>{stats.personnel}</strong>
                </div>
                <div>
                  <Icon name="signal" size={12} />
                  <small>Online</small>
                  <strong className="ok">{stats.online}</strong>
                </div>
                <div>
                  <Icon name="bell" size={12} />
                  <small>Alerts</small>
                  <strong className="bad">{stats.alerts}</strong>
                </div>
                <div>
                  <Icon name="crosshair" size={12} />
                  <small>Weapons</small>
                  <strong>{stats.weapons}</strong>
                </div>
                <div>
                  <Icon name="signal" size={12} />
                  <small>Coverage</small>
                  <strong>{group.coverage}%</strong>
                </div>
                <div>
                  <Icon name="clock" size={12} />
                  <small>Avg. Latency</small>
                  <strong>{group.latency}</strong>
                </div>
              </div>
            </div>

            <div className="panel grp-health">
              <h3>Group Health</h3>
              <div className="grp-health-body">
                <Donut
                  segments={health}
                  centerValue={String(group.members.length)}
                  centerLabel="Personnel"
                  active={healthHover}
                  onActive={setHealthHover}
                />
                <div className="grp-health-legend">
                  {health.map((item, index) => (
                    <span
                      key={item.label}
                      className={healthHover === index ? "is-up" : ""}
                      onPointerEnter={() => setHealthHover(index)}
                      onPointerLeave={() => setHealthHover(null)}
                    >
                      <i style={{ background: item.color }} />
                      <em>{item.label}</em>
                      <b style={{ color: item.color }}>{item.value}</b>
                    </span>
                  ))}
                </div>
              </div>
              <div className="grp-vitals">
                <div>
                  <span className="cmd-mini-icon green">
                    <Icon name="heart" size={13} />
                  </span>
                  <div>
                    <small>Avg Heart Rate</small>
                    <strong className="hr">{avgHr} BPM</strong>
                    <em>Normal</em>
                  </div>
                </div>
                <div>
                  <span className="cmd-mini-icon amber">
                    <Icon name="thermo" size={13} />
                  </span>
                  <div>
                    <small>Avg Temperature</small>
                    <strong className="temp">{avgTemp} °C</strong>
                    <em>Normal</em>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
