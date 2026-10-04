"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  CHART_BARS,
  CHART_LABELS,
  COMMON_FIELDS,
  EXPLORER_EVENTS,
  FIELD_GROUPS,
  SERIES,
  eventJson,
  type ExplorerEvent,
} from "./search-data";

const ENTITY_TYPES = ["All", "Personnel", "Gateway"];
const GROUPS = ["All Groups", "Alpha", "Bravo", "Charlie"];
const DATA_TYPES = ["All Types", "Position", "Vital", "Alert", "Communication", "Weapon", "System", "Mesh", "Uplink", "Battery"];
const SOURCES = ["All Sources", "GNSS", "Strap", "System", "Starlink"];
const GATEWAYS = ["All Gateways", "GW-01", "GW-02"];

function JsonView({ value }: { value: unknown }) {
  const text = JSON.stringify(value, null, 2);
  const html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/("(?:\\.|[^"\\])*")(\s*:)?|\b(-?\d+(?:\.\d+)?)\b/g, (match, str: string | undefined, colon: string | undefined, num: string | undefined) => {
      if (str && colon) return `<span class="k">${str}</span>${colon}`;
      if (str) return `<span class="s">${str}</span>`;
      if (num) return `<span class="n">${num}</span>`;
      return match;
    });
  return <pre className="exp-json" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function SearchPage() {
  const [draft, setDraft] = useState("src_ip:10.0.0.0/8 AND severity:critical");
  const [query, setQuery] = useState("");
  const [entityType, setEntityType] = useState(ENTITY_TYPES[0]);
  const [group, setGroup] = useState(GROUPS[0]);
  const [dataType, setDataType] = useState(DATA_TYPES[0]);
  const [eventType, setEventType] = useState("All Events");
  const [source, setSource] = useState(SOURCES[0]);
  const [gateway, setGateway] = useState(GATEWAYS[0]);
  const [range, setRange] = useState("Last 24 hours");
  const [bucket, setBucket] = useState("30m");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [selectedId, setSelectedId] = useState(EXPLORER_EVENTS[0].id);
  const [jsonOpen, setJsonOpen] = useState(true);
  const [checkedFields, setCheckedFields] = useState<string[]>([]);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [fieldQuery, setFieldQuery] = useState("");

  const eventTypes = useMemo(() => ["All Events", ...Array.from(new Set(EXPLORER_EVENTS.map((item) => item.event)))], []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXPLORER_EVENTS.filter((item) => {
      if (entityType === "Personnel" && item.entity.startsWith("GW")) return false;
      if (entityType === "Gateway" && !item.entity.startsWith("GW")) return false;
      if (group !== "All Groups" && item.group !== group) return false;
      if (dataType !== "All Types" && item.kind !== dataType) return false;
      if (eventType !== "All Events" && item.event !== eventType) return false;
      if (source !== "All Sources" && item.source !== source) return false;
      if (gateway !== "All Gateways" && item.gateway !== gateway) return false;
      if (!q) return true;
      return `${item.time} ${item.entity} ${item.kind} ${item.event} ${item.source} ${item.gateway} ${item.summary}`.toLowerCase().includes(q);
    });
  }, [dataType, entityType, eventType, gateway, group, query, source]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = rows.find((item) => item.id === selectedId) ?? pageRows[0] ?? null;

  function toggleField(name: string) {
    setCheckedFields((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]));
  }

  function clearFilters() {
    setDraft("");
    setQuery("");
    setEntityType(ENTITY_TYPES[0]);
    setGroup(GROUPS[0]);
    setDataType(DATA_TYPES[0]);
    setEventType("All Events");
    setSource(SOURCES[0]);
    setGateway(GATEWAYS[0]);
    setPage(1);
  }

  const visibleFields = COMMON_FIELDS.filter((field) => field.name.includes(fieldQuery.trim().toLowerCase()));

  return (
    <div className="exp-page">
      <header className="page-title">
        <span className="page-title-icon"><Icon name="search" size={15} /></span>
        <div>
          <h1>Search / Explorer</h1>
          <p>Explore all incoming data, events, and system records</p>
        </div>
      </header>

      <div className="exp-query">
        <label>
          <Icon name="search" size={14} />
          <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (setQuery(draft), setPage(1))} />
        </label>
        <button type="button" className="exp-run" onClick={() => { setQuery(draft); setPage(1); }}>
          <Icon name="play" size={12} />
          Run
        </button>
        <label className="exp-select">
          <Icon name="calendar" size={13} />
          <select value={range} onChange={(event) => setRange(event.target.value)}>
            <option>Last 24 hours</option>
            <option>Last 6 hours</option>
            <option>Last 7 days</option>
          </select>
        </label>
        <button type="button" className="exp-export">
          <Icon name="download" size={13} />
          Export
        </button>
      </div>

      <div className="exp-filters">
        <label>Entity Type<select value={entityType} onChange={(event) => { setEntityType(event.target.value); setPage(1); }}>{ENTITY_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Group<select value={group} onChange={(event) => { setGroup(event.target.value); setPage(1); }}>{GROUPS.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Data Type<select value={dataType} onChange={(event) => { setDataType(event.target.value); setPage(1); }}>{DATA_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Event Type<select value={eventType} onChange={(event) => { setEventType(event.target.value); setPage(1); }}>{eventTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Source<select value={source} onChange={(event) => { setSource(event.target.value); setPage(1); }}>{SOURCES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Gateway<select value={gateway} onChange={(event) => { setGateway(event.target.value); setPage(1); }}>{GATEWAYS.map((item) => <option key={item}>{item}</option>)}</select></label>
        <button type="button" onClick={clearFilters}>Clear</button>
      </div>

      <section className="exp-chart panel">
        <header>
          <div>
            <strong>Events over time</strong>
            <small>875,698 events · 03 Oct, 08:29 – 04 Oct, 08:29</small>
          </div>
          <div className="exp-legend">
            {SERIES.map((item) => (
              <span key={item.label}><i style={{ background: item.color }} />{item.label} {item.value}</span>
            ))}
          </div>
          <select value={bucket} onChange={(event) => setBucket(event.target.value)} aria-label="Bucket">
            <option>15m</option>
            <option>30m</option>
            <option>1h</option>
          </select>
        </header>
        <div className="exp-bars" aria-hidden="true">
          {CHART_BARS.map((bar, index) => (
            <span key={index}>
              {bar.map((height, part) => (
                <i key={part} style={{ height: `${height}px`, background: SERIES[part].color }} />
              ))}
            </span>
          ))}
        </div>
        <div className="exp-axis">
          {CHART_LABELS.map((label) => <span key={label}>{label}</span>)}
        </div>
      </section>

      <section className={`exp-body${jsonOpen ? "" : " json-off"}`}>
        <aside className="panel exp-fields">
          <header>
            <strong>Fields</strong>
            <button type="button" aria-label="Fields"><Icon name="filter" size={12} /></button>
          </header>
          <label className="exp-field-search">
            <Icon name="search" size={12} />
            <input value={fieldQuery} onChange={(event) => setFieldQuery(event.target.value)} placeholder="Search fields..." />
          </label>
          <div className="exp-field-meta">
            <span>All Fields</span>
            <em>Selected ({checkedFields.length})</em>
          </div>
          <div className="exp-field-list">
            <p>Common Fields</p>
            {visibleFields.map((field) => (
              <label key={field.name}>
                <input type="checkbox" checked={checkedFields.includes(field.name)} onChange={() => toggleField(field.name)} />
                <span>{field.name}</span>
                <b>{field.count}</b>
              </label>
            ))}
            {FIELD_GROUPS.map((item) => {
              const open = openGroups.includes(item.name);
              return (
                <div key={item.name}>
                  <button type="button" className={`exp-fold${open ? " open" : ""}`} onClick={() => setOpenGroups((prev) => open ? prev.filter((name) => name !== item.name) : [...prev, item.name])}>
                    <Icon name="chevron" size={12} />
                    <span>{item.name}</span>
                    <b>{item.count}</b>
                  </button>
                  {open ? item.fields.map((field) => (
                    <label key={field} className="nested">
                      <input type="checkbox" checked={checkedFields.includes(field)} onChange={() => toggleField(field)} />
                      <span>{field}</span>
                    </label>
                  )) : null}
                </div>
              );
            })}
          </div>
        </aside>

        <div className="panel exp-results">
          <header>
            <strong>Results ({rows.length} events)</strong>
          </header>
          <div className="exp-table-wrap">
            <table>
              <thead>
                <tr>
                  <th />
                  <th>Time</th>
                  <th>Entity</th>
                  <th>Type</th>
                  <th>Event</th>
                  <th>Source</th>
                  <th>Gateway</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((item) => (
                  <ResultRow key={item.id} item={item} selected={selected?.id === item.id} onSelect={() => setSelectedId(item.id)} />
                ))}
                {!pageRows.length ? (
                  <tr><td colSpan={8} className="exp-empty">No events match the current search.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <footer className="cmd-pager">
            <span>{rows.length} documents · 100 ms</span>
            <div>
              <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page"><Icon name="chevron" size={12} /></button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                <button key={number} type="button" className={number === currentPage ? "on" : ""} onClick={() => setPage(number)}>{number}</button>
              ))}
              <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Next page"><Icon name="chevron" size={12} /></button>
              <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} aria-label="Page size">
                <option value={8}>8 / page</option>
                <option value={12}>12 / page</option>
              </select>
            </div>
          </footer>
        </div>

        {jsonOpen && selected ? (
          <aside className="panel exp-raw">
            <header>
              <strong>Raw JSON</strong>
              <button type="button" aria-label="Close" onClick={() => setJsonOpen(false)}>×</button>
            </header>
            <JsonView value={eventJson(selected)} />
          </aside>
        ) : null}
      </section>
    </div>
  );
}

function ResultRow({ item, selected, onSelect }: { item: ExplorerEvent; selected: boolean; onSelect: () => void }) {
  return (
    <tr className={selected ? "on" : ""} onClick={onSelect}>
      <td><input type="checkbox" checked={selected} onChange={onSelect} aria-label={`Select ${item.id}`} /></td>
      <td>{item.time}</td>
      <td>{item.entity}</td>
      <td><span className={`exp-kind ${item.tone}`}><Icon name={item.icon} size={11} />{item.kind}</span></td>
      <td className={item.kind === "Alert" ? "hot" : ""}>{item.event}</td>
      <td>{item.source}</td>
      <td>{item.gateway}</td>
      <td>{item.summary}</td>
    </tr>
  );
}
