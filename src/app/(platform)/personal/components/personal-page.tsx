"use client";

import { useMemo, useState } from "react";
import Icon, { type IconName } from "@/components/ui/icon";
import PersonalMap from "./personal-map";
import {
  personalProfiles,
  statusLabel,
  type PersonalEventType,
  type PersonalProfile,
} from "./personal-data";

function sparkPath(values: number[], width = 120, height = 36) {
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 4) - 2;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function sparkArea(values: number[], width = 120, height = 36) {
  const line = sparkPath(values, width, height);
  if (!line) return "";
  return `${line} L${width} ${height} L0 ${height} Z`;
}

function eventIcon(type: PersonalEventType): IconName {
  if (type === "Movement") return "route";
  if (type === "Vital") return "heart";
  if (type === "Equipment") return "cpu";
  if (type === "Alert") return "bolt";
  return "server";
}

function avatarTone(status: PersonalProfile["status"]) {
  return status;
}

export default function PersonalPage() {
  const [selectedId, setSelectedId] = useState(personalProfiles[0]?.id ?? "");
  const [query, setQuery] = useState("");

  const person =
    personalProfiles.find((item) => item.id === selectedId) ?? personalProfiles[0] ?? null;

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return personalProfiles;
    return personalProfiles.filter((item) =>
      `${item.code} ${item.name} ${item.unit} ${item.role}`.toLowerCase().includes(q),
    );
  }, [query]);

  if (!person) return null;

  return (
    <div className="prs-page">
      <header className="page-title">
        <span className="page-title-icon"><Icon name="user" size={15} /></span>
        <div>
          <h1>Personal</h1>
          <p>Monitor a soldier&apos;s status, equipment, vitals, and recent activity.</p>
        </div>
      </header>
      <div className="prs-topbar">
        <label className="prs-top-search">
          <Icon name="search" size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by soldier, weapon, event type, or location..."
            list="prs-people"
          />
          <datalist id="prs-people">
            {options.map((item) => (
              <option key={item.id} value={`${item.code} · ${item.name}`} />
            ))}
          </datalist>
        </label>
        <select
          className="prs-person-select"
          value={person.id}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {personalProfiles.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code} · {item.name}
            </option>
          ))}
        </select>
      </div>

      <Overview person={person} />
    </div>
  );
}

function Overview({ person }: { person: PersonalProfile }) {
  const pageSize = 4;
  const [page, setPage] = useState(1);
  const [pagedFor, setPagedFor] = useState(person.id);
  if (pagedFor !== person.id) {
    setPagedFor(person.id);
    setPage(1);
  }
  const pageCount = Math.max(1, Math.ceil(person.events.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const rows = person.events.slice(start, start + pageSize);
  const rangeStart = person.events.length === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(start + pageSize, person.events.length);

  return (
    <div className="prs-overview">
      <section className="prs-hero">
        <article className="panel prs-profile-card">
          <div className={`prs-photo ${avatarTone(person.status)}`} aria-hidden="true">
            <Icon name="user" size={42} />
          </div>
          <div className="prs-profile-copy">
            <div className="prs-id-row">
              <h1>{person.code}</h1>
              <em className={person.status}>{statusLabel(person.status)}</em>
            </div>
            <p className="prs-unit-line">
              {person.unit} | {person.platoon} | {person.squad} (Danru: {person.danru})
            </p>
            <dl className="prs-meta-grid">
              <div>
                <dt>Name</dt>
                <dd>{person.name}</dd>
              </div>
              <div>
                <dt>Rank</dt>
                <dd>{person.rank}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{person.role}</dd>
              </div>
              <div>
                <dt>Callsign</dt>
                <dd>{person.callSign}</dd>
              </div>
              <div>
                <dt>Blood Type</dt>
                <dd>{person.bloodType}</dd>
              </div>
              <div>
                <dt>Join Date</dt>
                <dd>{person.joinDate}</dd>
              </div>
            </dl>
          </div>
        </article>
        <div className="prs-hero-map-wrap panel">
          <PersonalMap person={person} />
        </div>
      </section>

      <section className="prs-widgets">
        <article className="panel prs-status">
          <h3>Current Status</h3>
          <div className="prs-status-grid">
            <div>
              <Icon name="signal" size={11} />
              <div>
                <small>Status</small>
                <strong className={person.status}>{statusLabel(person.status)}</strong>
              </div>
            </div>
            <div>
              <Icon name="pin" size={11} />
              <div>
                <small>Location</small>
                <strong>
                  {person.lat.toFixed(4)}, {person.lng.toFixed(4)}
                </strong>
                <em>Elev. {person.elevation} m</em>
              </div>
            </div>
            <div>
              <Icon name="route" size={11} />
              <div>
                <small>Movement</small>
                <strong>{person.movement}</strong>
                <em>{person.speed.toFixed(1)} km/h</em>
              </div>
            </div>
            <div>
              <Icon name="signal" size={11} />
              <div>
                <small>Signal</small>
                <strong>{person.signal != null ? `${person.signal} dBm` : "—"}</strong>
                <em className={person.signalLabel === "Good" || person.signalLabel === "Excellent" ? "ok" : ""}>
                  {person.signalLabel}
                </em>
              </div>
            </div>
            <div className="wide">
              <Icon name="bolt" size={11} />
              <div>
                <small>Battery Level</small>
                <strong>{person.battery != null ? `${person.battery}%` : "—"}</strong>
                <em>{person.batteryEta}</em>
                <i className="prs-batt">
                  <b style={{ width: `${person.battery ?? 0}%` }} />
                </i>
              </div>
            </div>
          </div>
        </article>

        <article className="panel prs-vitals-card">
          <h3>Vital Signs</h3>
          <div className="prs-vital-tiles">
            <VitalTile
              icon="heart"
              tone="red"
              label="Heart Rate"
              value={person.hr != null ? `${person.hr}` : "—"}
              unit="bpm"
              values={person.sparklines.hr}
            />
            <VitalTile
              icon="signal"
              tone="blue"
              label="Respiratory Rate"
              value={person.resp != null ? `${person.resp}` : "—"}
              unit="br/min"
              values={person.sparklines.resp}
            />
            <VitalTile
              icon="thermo"
              tone="amber"
              label="Body Temperature"
              value={person.temp != null ? `${person.temp}` : "—"}
              unit="°C"
              values={person.sparklines.temp}
            />
            <VitalTile
              icon="chart"
              tone="green"
              label="HRV (RMSSD)"
              value={person.hrv != null ? `${person.hrv}` : "—"}
              unit="ms"
              values={person.sparklines.hrv}
            />
          </div>
        </article>

        <article className="panel prs-equip-card">
          <h3>Equipment Status</h3>
          <ul className="prs-equip-list">
            {person.equipment.map((item) => (
              <li key={item.id}>
                <span className={`prs-equip-thumb ${item.tone}`}>
                  <Icon name={item.id === "weapon" ? "crosshair" : item.id === "strap" ? "heart" : "shield"} size={11} />
                </span>
                <div>
                  <strong>{item.name}</strong>
                  <small className={item.status === "Connected" ? "ok" : "bad"}>
                    <i /> {item.status}
                  </small>
                </div>
                <div className="prs-equip-batt">
                  <em>{item.battery}%</em>
                  <i>
                    <b style={{ width: `${item.battery}%` }} />
                  </i>
                </div>
                <Icon name="chevron" size={14} />
              </li>
            ))}
          </ul>
        </article>

        <article className="panel prs-events-card">
          <header>
            <h3>Recent Events</h3>
          </header>
          <div className="prs-events-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Event Type</th>
                  <th>Details</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((event) => (
                  <tr key={event.id}>
                    <td>{event.time}</td>
                    <td>
                      <span className={`prs-event-type ${event.type.toLowerCase()}`}>
                        <Icon name={eventIcon(event.type)} size={12} />
                        {event.type}
                      </span>
                    </td>
                    <td>{event.details}</td>
                    <td>
                      {event.lat.toFixed(4)}, {event.lng.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cmd-pager prs-events-pager">
            <span>
              {rangeStart}–{rangeEnd} of {person.events.length}
            </span>
            <div>
              <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page">
                <Icon name="chevron" size={12} />
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                <button key={number} type="button" className={number === currentPage ? "on" : ""} onClick={() => setPage(number)}>
                  {number}
                </button>
              ))}
              <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Next page">
                <Icon name="chevron" size={12} />
              </button>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

function VitalTile({
  icon,
  tone,
  label,
  value,
  unit,
  values,
}: {
  icon: IconName;
  tone: string;
  label: string;
  value: string;
  unit: string;
  values: number[];
}) {
  return (
    <div className={`prs-vital-tile ${tone}`}>
      <div className="prs-vital-top">
        <span>
          <Icon name={icon} size={11} />
        </span>
        <small>{label}</small>
        <strong>
          {value}
          <em>{unit}</em>
        </strong>
      </div>
      <svg viewBox="0 0 120 36" preserveAspectRatio="none" className="prs-spark" aria-hidden="true">
        <defs>
          <linearGradient id={`prs-spark-${tone}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.55" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="prs-spark-fill" d={sparkArea(values)} fill={`url(#prs-spark-${tone})`} />
        <path className="prs-spark-line" d={sparkPath(values)} />
      </svg>
    </div>
  );
}
