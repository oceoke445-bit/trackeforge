"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import GroupMap from "./group-map";
import { groups, groupStats, type GroupId } from "./groups-data";

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
    <div className="cmd-donut grp-donut" style={{ background: `conic-gradient(${stops})` }}>
      <div>
        <strong>{centerValue}</strong>
        <span>{centerLabel}</span>
      </div>
    </div>
  );
}

export default function GroupsPage() {
  const [selectedId, setSelectedId] = useState<GroupId>("alpha");
  const [query, setQuery] = useState("");
  const [assetTab, setAssetTab] = useState<"weapons" | "vehicles" | "infra">("weapons");

  const group = groups.find((item) => item.id === selectedId) ?? groups[0];
  const stats = groupStats(group);

  const members = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return group.members;
    return group.members.filter((member) =>
      `${member.id} ${member.name} ${member.rank} ${member.weapon}`.toLowerCase().includes(q),
    );
  }, [group, query]);

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
      <header className="grp-head">
        <div>
          <h1>Groups</h1>
          <p>Manage and monitor operational groups, their personnel, assets, and mission status.</p>
        </div>
        <button type="button" className="grp-create">
          <Icon name="plus" size={15} />
          Create Group
        </button>
      </header>

      <div className="grp-selector">
        {groups.map((item) => {
          const s = groupStats(item);
          return (
            <button
              key={item.id}
              type="button"
              className={`grp-card ${item.tone}${selectedId === item.id ? " on" : ""}`}
              onClick={() => setSelectedId(item.id)}
            >
              <span className="grp-card-icon">
                <Icon name={item.emblem} size={18} />
              </span>
              <div>
                <strong>{item.name}</strong>
                <small>
                  {s.personnel} Personnel · {s.online} Online · {s.alerts} Alert · {s.weapons} Weapons
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
                <button type="button" className="secondary">
                  View on Full Map
                </button>
                <button type="button" className="secondary">
                  <Icon name="layers" size={14} /> Map Layers
                </button>
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
                  onChange={(e) => setQuery(e.target.value)}
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
                  {members.map((member) => (
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
              <p>{group.brief}</p>
            </div>

            <div className="panel grp-status">
              <h3>Group Status</h3>
              <div className="grp-status-grid">
                <div>
                  <Icon name="users" size={14} />
                  <small>Personnel</small>
                  <strong>{stats.personnel}</strong>
                </div>
                <div>
                  <Icon name="signal" size={14} />
                  <small>Online</small>
                  <strong className="ok">{stats.online}</strong>
                </div>
                <div>
                  <Icon name="bell" size={14} />
                  <small>Alerts</small>
                  <strong className="bad">{stats.alerts}</strong>
                </div>
                <div>
                  <Icon name="crosshair" size={14} />
                  <small>Weapons</small>
                  <strong>{stats.weapons}</strong>
                </div>
                <div>
                  <Icon name="signal" size={14} />
                  <small>Coverage</small>
                  <strong>{group.coverage}%</strong>
                </div>
                <div>
                  <Icon name="clock" size={14} />
                  <small>Avg. Latency</small>
                  <strong>{group.latency}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="grp-side-mid">
            <div className="panel grp-mission">
              <h3>Mission Details</h3>
              <dl>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <span className="cmd-status online">
                      <i />
                      {group.missionStatus}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Start Time</dt>
                  <dd>{group.startTime}</dd>
                </div>
                <div>
                  <dt>Est. Duration</dt>
                  <dd>{group.duration}</dd>
                </div>
                <div>
                  <dt>Area of Operation</dt>
                  <dd>{group.area}</dd>
                </div>
              </dl>
            </div>

            <div className="panel grp-health">
              <h3>Group Health</h3>
              <div className="grp-health-body">
                <Donut
                  segments={health}
                  centerValue={String(group.members.length)}
                  centerLabel="Personnel"
                />
                <div className="cmd-legend">
                  {health.map((item) => (
                    <span key={item.label}>
                      <i style={{ background: item.color }} />
                      {item.label}
                      <b>{item.value}</b>
                    </span>
                  ))}
                </div>
              </div>
              <div className="grp-vitals">
                <div>
                  <small>Avg Heart Rate</small>
                  <strong>{avgHr} BPM</strong>
                  <em>Normal</em>
                </div>
                <div>
                  <small>Avg Temperature</small>
                  <strong>{avgTemp} °C</strong>
                  <em>Normal</em>
                </div>
              </div>
            </div>
          </div>

          <div className="grp-side-bottom">
            <div className="panel grp-assets">
              <div className="grp-assets-head">
                <h3>Group Assets ({group.weapons.length})</h3>
                <div className="cmd-asset-tabs">
                  {(
                    [
                      ["weapons", `Weapons (${group.weapons.length})`],
                      ["vehicles", "Vehicles (2)"],
                      ["infra", "Infrastructure (1)"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={assetTab === id ? "on" : ""}
                      onClick={() => setAssetTab(id)}
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
                      <th>Type</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(assetTab === "weapons" ? group.weapons : []).map((weapon) => (
                      <tr key={weapon.id}>
                        <td>
                          <code>{weapon.id}</code>
                        </td>
                        <td>{weapon.type}</td>
                        <td>
                          <span className={`cmd-status ${weapon.status === "connected" ? "online" : weapon.status === "disconnected" ? "critical" : "offline"}`}>
                            <i />
                            {weapon.status[0].toUpperCase() + weapon.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          <button type="button" className="grp-weapon-link">
                            {weapon.assignedTo}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {assetTab !== "weapons" && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                          No {assetTab} assigned to this group.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel grp-activity">
              <h3>Group Activity</h3>
              <div className="grp-activity-list">
                {group.activity.map((item) => (
                  <article key={item.time + item.text} className={`cmd-feed-item ${item.tone}`}>
                    <time>{item.time}</time>
                    <div>
                      <strong>{item.text}</strong>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
