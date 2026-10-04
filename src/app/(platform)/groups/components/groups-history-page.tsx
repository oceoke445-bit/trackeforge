"use client";

import { useMemo, useState } from "react";
import Icon, { type IconName } from "@/components/ui/icon";
import HistoryMiniMap from "./history-mini-map";
import {
  EVENT_META,
  EVENT_TYPES,
  HISTORY_EVENTS,
  UNITS,
  type HistoryEntityKind,
  type HistoryEvent,
  type HistoryEventType,
} from "./history-data";

const RANGES = [
  { id: "1h", label: "Last 1 Hour" },
  { id: "6h", label: "Last 6 Hours" },
  { id: "24h", label: "Last 24 Hours" },
  { id: "7d", label: "Last 7 Days" },
] as const;

const ENTITY_OPTIONS: { id: HistoryEntityKind; label: string }[] = [
  { id: "soldier", label: "Soldier" },
  { id: "weapon", label: "Weapon" },
  { id: "gateway", label: "Gateway" },
  { id: "system", label: "System" },
];

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function entityIcon(kind: HistoryEntityKind): IconName {
  if (kind === "weapon") return "crosshair";
  if (kind === "gateway") return "server";
  if (kind === "system") return "cpu";
  return "user";
}

function splitTime(time: string) {
  const [date = time, clock = ""] = time.split(" ");
  return { date, clock };
}

export default function GroupsHistoryPage() {
  const [draftRange, setDraftRange] = useState<(typeof RANGES)[number]["id"]>("7d");
  const [draftTypes, setDraftTypes] = useState<HistoryEventType[]>(EVENT_TYPES);
  const [draftEntities, setDraftEntities] = useState<HistoryEntityKind[]>([
    "soldier",
    "weapon",
    "gateway",
    "system",
  ]);
  const [draftUnits, setDraftUnits] = useState<string[]>([...UNITS.filter((item) => item !== "All Units")]);
  const [unitQuery, setUnitQuery] = useState("");

  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("7d");
  const [types, setTypes] = useState<HistoryEventType[]>(EVENT_TYPES);
  const [entities, setEntities] = useState<HistoryEntityKind[]>(["soldier", "weapon", "gateway", "system"]);
  const [units, setUnits] = useState<string[]>([...UNITS.filter((item) => item !== "All Units")]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState(HISTORY_EVENTS[0]?.id ?? "");
  const [open, setOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [tab, setTab] = useState<"details" | "location">("details");
  const [query, setQuery] = useState("");

  const rowsFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    void range;
    return HISTORY_EVENTS.filter((event) => {
      if (!types.includes(event.type)) return false;
      if (!entities.includes(event.entityKind)) return false;
      const unitOk = event.entityUnit === "HQ" || units.includes(event.entityUnit);
      if (!unitOk) return false;
      if (!q) return true;
      return `${event.entityId} ${event.entityUnit} ${event.type} ${event.details} ${event.description}`
        .toLowerCase()
        .includes(q);
    });
  }, [entities, query, range, types, units]);

  const pageCount = Math.max(1, Math.ceil(rowsFiltered.length / pageSize));
  const current = Math.min(page, pageCount);
  const rows = rowsFiltered.slice((current - 1) * pageSize, current * pageSize);
  const selected = rowsFiltered.find((item) => item.id === selectedId) ?? rowsFiltered[0] ?? null;

  const stats = useMemo(
    () => ({
      sos: HISTORY_EVENTS.filter((item) => item.type === "SOS").length,
      alert: HISTORY_EVENTS.filter((item) => item.type === "Alert" || item.type === "Casualty").length,
      movement: HISTORY_EVENTS.filter((item) => item.type === "Movement").length,
      total: HISTORY_EVENTS.length,
    }),
    [],
  );

  function countType(type: HistoryEventType) {
    return HISTORY_EVENTS.filter((item) => item.type === type).length;
  }
  function countEntity(kind: HistoryEntityKind) {
    return HISTORY_EVENTS.filter((item) => item.entityKind === kind).length;
  }
  function countUnit(unit: string) {
    return HISTORY_EVENTS.filter((item) => item.entityUnit === unit).length;
  }

  function reset() {
    setDraftRange("7d");
    setDraftTypes(EVENT_TYPES);
    setDraftEntities(["soldier", "weapon", "gateway", "system"]);
    setDraftUnits([...UNITS.filter((item) => item !== "All Units")]);
    setUnitQuery("");
  }

  function applyFilters() {
    setRange(draftRange);
    setTypes(draftTypes);
    setEntities(draftEntities);
    setUnits(draftUnits);
    setPage(1);
  }

  function exportHistory() {
    const header = ["Time", "Event Type", "Entity", "Unit", "Details", "Location", "Status"];
    const lines = rowsFiltered.map((item) => [
      item.time,
      item.type,
      item.entityId,
      item.entityUnit,
      item.details,
      `${item.lat}, ${item.lng}`,
      item.status,
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "history.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const unitOptions = UNITS.filter((item) => item !== "All Units").filter((item) =>
    item.toLowerCase().includes(unitQuery.trim().toLowerCase()),
  );

  return (
    <div className="alt-page hist-alt">
      <header className="alt-head page-title">
        <span className="alt-head-icon page-title-icon">
          <Icon name="clock" size={15} />
        </span>
        <div>
          <h1>History</h1>
          <p>View all historical activities, movements, and events from your unit.</p>
        </div>
        <section className="alt-stats">
          <article className="critical">
            <span>
              <Icon name="bell" size={13} />
            </span>
            <div>
              <small>SOS</small>
              <strong>{stats.sos}</strong>
            </div>
          </article>
          <article className="warning">
            <span>
              <Icon name="bolt" size={13} />
            </span>
            <div>
              <small>Alerts</small>
              <strong>{stats.alert}</strong>
            </div>
          </article>
          <article className="info">
            <span>
              <Icon name="route" size={13} />
            </span>
            <div>
              <small>Movement</small>
              <strong>{stats.movement}</strong>
            </div>
          </article>
          <article className="total">
            <span>
              <Icon name="layers" size={13} />
            </span>
            <div>
              <small>Total</small>
              <strong>{stats.total}</strong>
            </div>
          </article>
        </section>
      </header>

      <div className={`alt-body${open && selected ? " has-detail" : ""}${filtersOpen ? "" : " filters-closed"}`}>
        {filtersOpen ? (
          <aside className="alt-filters">
            <header>
              <h2>
                <Icon name="filter" size={14} />
                Filters
              </h2>
              <button
                type="button"
                className="alt-filter-collapse"
                aria-label="Hide filters"
                onClick={() => setFiltersOpen(false)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M9 4v16" />
                  <path d="m13 15-3-3 3-3" />
                </svg>
              </button>
            </header>
            <div className="alt-filter-actions">
              <button type="button" aria-label="Reset filters" onClick={reset}>
                <Icon name="refresh" size={14} />
              </button>
              <button type="button" className="alt-export" onClick={exportHistory}>
                <Icon name="download" size={13} /> Export
              </button>
            </div>
            <div className="alt-filter-scroll">
              <section>
                <h3>Time range</h3>
                <div className="alt-range-grid">
                  {RANGES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={draftRange === item.id ? "on" : ""}
                      onClick={() => setDraftRange(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <h3>Event type</h3>
                {EVENT_TYPES.map((item) => (
                  <label key={item}>
                    <input
                      type="checkbox"
                      checked={draftTypes.includes(item)}
                      onChange={() => setDraftTypes((current) => toggle(current, item))}
                    />
                    <Icon name={EVENT_META[item].icon} size={13} />
                    <span>{item}</span>
                    <b>{countType(item)}</b>
                  </label>
                ))}
              </section>
              <section>
                <h3>Entity type</h3>
                {ENTITY_OPTIONS.map((item) => (
                  <label key={item.id}>
                    <input
                      type="checkbox"
                      checked={draftEntities.includes(item.id)}
                      onChange={() => setDraftEntities((current) => toggle(current, item.id))}
                    />
                    <Icon name={entityIcon(item.id)} size={13} />
                    <span>{item.label}</span>
                    <b>{countEntity(item.id)}</b>
                  </label>
                ))}
              </section>
              <section>
                <h3>Unit / Soldier</h3>
                <label className="alt-group-search">
                  <Icon name="search" size={13} />
                  <input
                    value={unitQuery}
                    onChange={(event) => setUnitQuery(event.target.value)}
                    placeholder="Search unit..."
                  />
                </label>
                {unitOptions.map((item) => (
                  <label key={item}>
                    <input
                      type="checkbox"
                      checked={draftUnits.includes(item)}
                      onChange={() => setDraftUnits((current) => toggle(current, item))}
                    />
                    <span>{item}</span>
                    <b>{countUnit(item)}</b>
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
          <button
            type="button"
            className="alt-filter-reopen"
            aria-label="Open filters"
            onClick={() => setFiltersOpen(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M9 4v16" />
              <path d="m14 10 3 2-3 2" />
            </svg>
          </button>
        )}

        <section className="alt-table-card">
          <div className="alt-toolbar hist-toolbar">
            <label className="hist-toolbar-search">
              <Icon name="search" size={13} />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by soldier, weapon, event type..."
              />
            </label>
          </div>
          <div className="alt-table-wrap">
            <table className="alt-table">
              <thead>
                <tr>
                  <th />
                  <th>Event Time</th>
                  <th>Event Type</th>
                  <th>Entity</th>
                  <th>Unit</th>
                  <th>Details</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => {
                  const { date, clock } = splitTime(item.time);
                  const meta = EVENT_META[item.type];
                  return (
                    <tr
                      key={item.id}
                      className={selected?.id === item.id ? "on" : ""}
                      onClick={() => {
                        setSelectedId(item.id);
                        setOpen(true);
                      }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selected?.id === item.id}
                          onChange={() => {
                            setSelectedId(item.id);
                            setOpen(true);
                          }}
                          aria-label={`Select ${item.id}`}
                        />
                      </td>
                      <td>
                        <strong>{date}</strong>
                        <small>{clock}</small>
                      </td>
                      <td>
                        <span className={`hist-type ${meta.tone}`}>
                          <Icon name={meta.icon} size={12} />
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        <strong>{item.entityId}</strong>
                        <small>{item.entityKind}</small>
                      </td>
                      <td>{item.entityUnit}</td>
                      <td>{item.details}</td>
                      <td>
                        <strong>
                          {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                        </strong>
                        <small>Elev. {item.elevation}m</small>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="cmd-pager">
            <span>{rowsFiltered.length.toLocaleString()} results</span>
            <div>
              <button
                type="button"
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
                aria-label="Previous page"
              >
                <Icon name="chevron" size={14} />
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                <button
                  key={number}
                  type="button"
                  className={number === current ? "on" : ""}
                  onClick={() => setPage(number)}
                >
                  {number}
                </button>
              ))}
              <button
                type="button"
                disabled={current === pageCount}
                onClick={() => setPage(current + 1)}
                aria-label="Next page"
              >
                <Icon name="chevron" size={14} />
              </button>
            </div>
            <label className="alt-page-size">
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
              </select>
            </label>
          </div>
        </section>

        {open && selected ? (
          <HistoryDetail event={selected} tab={tab} onTab={setTab} onClose={() => setOpen(false)} />
        ) : null}
      </div>
    </div>
  );
}

function HistoryDetail({
  event,
  tab,
  onTab,
  onClose,
}: {
  event: HistoryEvent;
  tab: "details" | "location";
  onTab: (tab: "details" | "location") => void;
  onClose: () => void;
}) {
  const meta = EVENT_META[event.type];
  return (
    <aside className="alt-detail">
      <header>
        <span className={`hist-detail-chip ${meta.tone}`}>{event.type}</span>
        <div>
          <strong>
            {event.type} Event
          </strong>
          <small>#{event.id}</small>
        </div>
        <em className={`hist-status ${event.status.toLowerCase()}`}>{event.status}</em>
        <button type="button" aria-label="Close" onClick={onClose}>
          ×
        </button>
      </header>
      <div className="alt-tabs">
        {(["details", "location"] as const).map((item) => (
          <button key={item} type="button" className={tab === item ? "on" : ""} onClick={() => onTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      {tab === "details" ? (
        <dl className="alt-fields">
          <div>
            <dt>Event Time</dt>
            <dd>{event.time}</dd>
          </div>
          <div>
            <dt>Event Type</dt>
            <dd>{event.type}</dd>
          </div>
          <div>
            <dt>Entity</dt>
            <dd>
              {event.entityId} · {event.entityUnit}
            </dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>{event.description}</dd>
          </div>
          <div>
            <dt>Battery</dt>
            <dd>{event.battery != null ? `${event.battery}%` : "—"}</dd>
          </div>
          <div>
            <dt>Signal</dt>
            <dd>{event.signal != null ? `${event.signal} dBm` : "—"}</dd>
          </div>
          <div>
            <dt>Gateway Received</dt>
            <dd>
              {event.gatewayReceived ?? "—"}
              {event.gatewayDelay ? <small>{event.gatewayDelay}</small> : null}
            </dd>
          </div>
          <div>
            <dt>Satellite Uplink</dt>
            <dd>
              {event.satelliteUplink ?? "—"}
              {event.satelliteDelay ? <small>{event.satelliteDelay}</small> : null}
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd className="ok">{event.status}</dd>
          </div>
        </dl>
      ) : null}
      <div className="alt-loc-head">
        <h3>
          <Icon name="pin" size={14} /> Location
        </h3>
        <span>
          {event.lat.toFixed(4)}, {event.lng.toFixed(4)}
        </span>
      </div>
      <div className="hist-alt-map">
        <HistoryMiniMap event={event} />
      </div>
    </aside>
  );
}
