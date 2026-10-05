"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Dropdown from "@/components/ui/dropdown";
import Icon from "@/components/ui/icon";
import { useExplorerFeed } from "@/lib/explorer-feed";
import {
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  ENTITY_LABEL,
  EXPLORER_RANGES,
  compact,
  explorerSearch,
  fetchExplorerBundle,
  formatAxis,
  optionLabels,
  pretty,
  type LiveBundle,
} from "./explorer-api";
import {
  CHART_BARS,
  CHART_LABELS,
  EXPLORER_RECORDS,
  SERIES,
  type ExplorerRecord,
  type RecordLevel,
} from "./search-data";

const ENTITY_TYPES = ["All", "Personnel", "Gateway", "Beacon"];
const GROUPS = ["All Groups", "Alpha", "Bravo", "Charlie"];
const LEVELS = ["All Levels", "Telemetry", "Mesh", "Uplink", "Beacon", "Special"];
const SOURCES = ["All Sources", "GNSS", "Dead Reckoning", "Trilateration", "Stale", "LoRa", "RockBLOCK 9704", "Passive Beacon", "Chest Strap"];
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
  const [query, setQuery] = useState("");
  const [entityType, setEntityType] = useState(ENTITY_TYPES[0]);
  const [group, setGroup] = useState(GROUPS[0]);
  const [level, setLevel] = useState(LEVELS[0]);
  const [recordType, setRecordType] = useState("All Records");
  const [source, setSource] = useState(SOURCES[0]);
  const [gateway, setGateway] = useState(GATEWAYS[0]);
  const [range, setRange] = useState(EXPLORER_RANGES[0].label);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [selectedId, setSelectedId] = useState(EXPLORER_RECORDS[0].id);
  const [jsonOpen, setJsonOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [bundle, setBundle] = useState<LiveBundle | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const { mode, pending, runId, finish, fail } = useExplorerFeed();
  const optionsRef = useRef(bundle?.options);
  const skipBrowse = useRef(false);
  optionsRef.current = bundle?.options;
  const catalog = mode === "live" ? [] : EXPLORER_RECORDS;

  useEffect(() => {
    setPage(1);
  }, [mode]);

  function currentSearch(limit = pageSize, offset = (page - 1) * pageSize) {
    return explorerSearch({
      query,
      entityType,
      group,
      level,
      recordType,
      source,
      gateway,
      range,
      limit,
      offset,
      options: optionsRef.current,
    });
  }

  useEffect(() => {
    if (!pending) return;
    const run = runId;
    if (pending === "mock") {
      const timer = window.setTimeout(() => finish(run), 400);
      return () => window.clearTimeout(timer);
    }
    const controller = new AbortController();
    let ignore = false;
    const started = performance.now();
    fetchExplorerBundle(currentSearch(), controller.signal)
      .then((next) => {
        if (ignore) return;
        setBundle({ ...next, elapsedMs: Math.round(performance.now() - started) });
        setLiveError(null);
        skipBrowse.current = true;
        finish(run);
      })
      .catch((error: unknown) => {
        if (ignore || (error instanceof DOMException && error.name === "AbortError")) return;
        fail(run);
      });
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [fail, finish, pending, runId]);

  useEffect(() => {
    if (mode !== "live" || pending) return;
    if (skipBrowse.current) {
      skipBrowse.current = false;
      return;
    }
    const controller = new AbortController();
    let ignore = false;
    const started = performance.now();
    fetchExplorerBundle(currentSearch(), controller.signal)
      .then((next) => {
        if (ignore) return;
        setBundle({ ...next, elapsedMs: Math.round(performance.now() - started) });
        setLiveError(null);
      })
      .catch((error: unknown) => {
        if (ignore || (error instanceof DOMException && error.name === "AbortError")) return;
        setLiveError("Could not load records.");
      });
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [entityType, gateway, group, level, mode, page, pageSize, pending, query, range, recordType, source]);

  const recordTypes = useMemo(() => ["All Records", ...Array.from(new Set(EXPLORER_RECORDS.map((item) => item.record)))], []);
  const liveOptions = mode === "live" ? bundle?.options : undefined;
  const entityOptions = liveOptions ? ["All", ...optionLabels(liveOptions.entity_types, ENTITY_LABEL)] : [...ENTITY_TYPES];
  const groupOptions = liveOptions ? ["All Groups", ...liveOptions.groups] : [...GROUPS];
  const levelOptions = liveOptions ? ["All Levels", ...optionLabels(liveOptions.categories, CATEGORY_LABEL)] : [...LEVELS];
  const recordOptions = liveOptions ? ["All Records", ...optionLabels(liveOptions.data_types)] : recordTypes;
  const sourceOptions = liveOptions ? ["All Sources", ...optionLabels(liveOptions.position_sources)] : [...SOURCES];
  const gatewayOptions = liveOptions ? ["All Gateways", ...liveOptions.gateways] : [...GATEWAYS];

  const mockRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((item) => {
      if (entityType === "Personnel" && !item.entity.startsWith("P-")) return false;
      if (entityType === "Gateway" && !item.entity.startsWith("GW")) return false;
      if (entityType === "Beacon" && !item.entity.startsWith("B-")) return false;
      if (group !== "All Groups" && item.group !== group) return false;
      if (level !== "All Levels" && item.level !== level) return false;
      if (recordType !== "All Records" && item.record !== recordType) return false;
      if (source !== "All Sources" && item.source !== source) return false;
      if (gateway !== "All Gateways" && item.gateway !== gateway) return false;
      if (!q) return true;
      return `${item.time} ${item.received} ${item.entity} ${item.level} ${item.record} ${item.source} ${item.gateway} ${item.summary}`.toLowerCase().includes(q);
    });
  }, [catalog, entityType, gateway, group, level, query, recordType, source]);

  const rows = mode === "live" ? (bundle?.records ?? []) : mockRows;
  const total = mode === "live" ? (bundle?.total ?? 0) : rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = mode === "live" ? rows : rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = rows.find((item) => item.id === selectedId) ?? pageRows[0] ?? null;
  const legend = mode === "live" && bundle
    ? bundle.summary.by_category.map((item) => ({
      label: CATEGORY_LABEL[item.category] ?? pretty(item.category),
      value: compact(item.count),
      color: CATEGORY_COLOR[item.category] ?? "#94a3b8",
    }))
    : SERIES.map((item) => ({ label: item.label, value: item.value, color: item.color }));
  const liveMax = Math.max(...(bundle?.summary.timeline.map((item) => item.count) ?? [1]), 1);
  function segmentHeights(item: NonNullable<LiveBundle["summary"]["timeline"][number]>) {
    const segments = [...(item.segments ?? [])].reverse();
    const raw = segments.map((segment) => Math.max(3, (segment.count / liveMax) * 64));
    const sum = raw.reduce((totalHeight, height) => totalHeight + height, 0);
    const scale = sum > 64 ? 64 / sum : 1;
    return segments.map((segment, index) => ({
      category: segment.category,
      height: Math.max(3, Math.round(raw[index] * scale)),
    }));
  }
  const chartCaption = mode === "live"
    ? (bundle ? `${compact(bundle.summary.total)} records · ${range}` : "Live feed")
    : "875,698 records · 03 Oct, 08:29 – 04 Oct, 08:29";

  function exportCsv() {
    const params = currentSearch();
    params.delete("limit");
    params.delete("offset");
    const link = document.createElement("a");
    link.href = `/api/explorer/export.csv?${params.toString()}`;
    link.download = "explorer.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function clearFilters() {
    setQuery("");
    setEntityType(ENTITY_TYPES[0]);
    setGroup(GROUPS[0]);
    setLevel(LEVELS[0]);
    setRecordType("All Records");
    setSource(SOURCES[0]);
    setGateway(GATEWAYS[0]);
    setRange(EXPLORER_RANGES[0].label);
    setPage(1);
  }

  return (
    <div className="exp-page">
      <header className="page-title">
        <span className="page-title-icon"><Icon name="search" size={15} /></span>
        <div>
          <h1>Search / Explorer</h1>
          <p>Raw packets, decoded fields, and communication metadata</p>
        </div>
        <div className="exp-end">
          <label className="exp-select">
            <Icon name="calendar" size={13} />
            <Dropdown
              value={range}
              onChange={(value) => { setRange(value); setPage(1); }}
              options={EXPLORER_RANGES.map((item) => item.label)}
              ariaLabel="Time range"
            />
          </label>
          <button type="button" className="exp-export" onClick={mode === "live" ? exportCsv : undefined}>
            <Icon name="download" size={13} />
            Export
          </button>
        </div>
      </header>

      <section className="exp-chart panel">
        <header>
          <div>
            <strong>Records over time</strong>
            <small>{chartCaption}</small>
          </div>
          <div className="exp-legend">
            {legend.map((item) => (
              <span key={item.label}><i style={{ background: item.color }} />{item.label} {item.value}</span>
            ))}
          </div>
        </header>
        <div className={`exp-bars${mode === "live" && !bundle?.summary.timeline.length ? " is-live" : ""}`} aria-hidden="true">
          {mode === "live"
            ? bundle?.summary.timeline.map((item) => (
              <span key={item.time}>
                {segmentHeights(item).map((segment) => (
                  <i key={segment.category} style={{ height: `${segment.height}px`, background: CATEGORY_COLOR[segment.category] ?? "#94a3b8" }} />
                ))}
              </span>
            ))
            : CHART_BARS.map((bar, index) => (
            <span key={index}>
              {bar.map((height, part) => (
                <i key={part} style={{ height: `${height}px`, background: SERIES[part].color }} />
              ))}
            </span>
          ))}
        </div>
        <div className="exp-axis">
          {(mode === "live" && bundle ? bundle.summary.timeline.map((item) => formatAxis(item.time)) : CHART_LABELS).map((label) => <span key={label}>{label}</span>)}
        </div>
      </section>

      <section className={`exp-body${jsonOpen && selected ? "" : " json-off"}`}>
        <div className={`exp-board${filtersOpen ? "" : " filters-closed"}`}>
        {filtersOpen ? (
        <aside className="exp-fields">
          <header>
            <strong><Icon name="filter" size={13} /> Filters</strong>
            <button type="button" className="exp-filter-collapse" aria-label="Hide filters" onClick={() => setFiltersOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M9 4v16" />
                <path d="m13 15-3-3 3-3" />
              </svg>
            </button>
          </header>
          <div className="exp-filter-scroll">
          <div className="exp-side-filters">
            <label className="exp-event-search">
              <Icon name="search" size={13} />
              <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search records..." />
            </label>
            <label>Entity Type<Dropdown block value={entityOptions.includes(entityType) ? entityType : entityOptions[0]} onChange={(value) => { setEntityType(value); setPage(1); }} options={entityOptions} /></label>
            <label>Group<Dropdown block value={groupOptions.includes(group) ? group : groupOptions[0]} onChange={(value) => { setGroup(value); setPage(1); }} options={groupOptions} /></label>
            <label>Level<Dropdown block value={levelOptions.includes(level) ? level : levelOptions[0]} onChange={(value) => { setLevel(value); setPage(1); }} options={levelOptions} /></label>
            <label>Record<Dropdown block value={recordOptions.includes(recordType) ? recordType : recordOptions[0]} onChange={(value) => { setRecordType(value); setPage(1); }} options={recordOptions} /></label>
            <label>Source<Dropdown block value={sourceOptions.includes(source) ? source : sourceOptions[0]} onChange={(value) => { setSource(value); setPage(1); }} options={sourceOptions} /></label>
            <label>Gateway<Dropdown block value={gatewayOptions.includes(gateway) ? gateway : gatewayOptions[0]} onChange={(value) => { setGateway(value); setPage(1); }} options={gatewayOptions} /></label>
          </div>
          </div>
          <div className="exp-clear-bar">
            <button type="button" className="exp-clear" onClick={clearFilters}>
              <Icon name="refresh" size={13} /> Clear
            </button>
          </div>
        </aside>
        ) : (
          <button type="button" className="exp-filter-reopen" aria-label="Open filters" onClick={() => setFiltersOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M9 4v16" />
              <path d="m14 10 3 2-3 2" />
            </svg>
          </button>
        )}

        <div className="exp-results">
          <header>
            <strong>Results ({total} records)</strong>
          </header>
          <div className="exp-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event time</th>
                  <th>Received</th>
                  <th>Entity</th>
                  <th>Level</th>
                  <th>Record</th>
                  <th>Gateway</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((item) => (
                  <ResultRow key={item.id} item={item} selected={selected?.id === item.id} onSelect={() => setSelectedId(item.id)} />
                ))}
                {!pageRows.length ? (
                  <tr><td colSpan={7} className="exp-empty">{liveError ?? (mode === "live" ? "No live records yet." : "No records match the current search.")}</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <footer className="cmd-pager">
            <span>{total} records · {mode === "live" ? `${bundle?.elapsedMs ?? 0} ms` : "100 ms"}</span>
            <div>
              <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page"><Icon name="chevron" size={12} /></button>
              {pageNumbers(currentPage, pageCount).map((number) => (
                <button key={number} type="button" className={number === currentPage ? "on" : ""} onClick={() => setPage(number)}>{number}</button>
              ))}
              <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Next page"><Icon name="chevron" size={12} /></button>
              <Dropdown value={`${pageSize} / page`} onChange={(value) => { setPageSize(Number(value.replace(" / page", ""))); setPage(1); }} options={["8 / page", "12 / page"]} ariaLabel="Page size" />
            </div>
          </footer>
        </div>
        </div>

        {jsonOpen && selected ? (
          <aside className="panel exp-raw">
            <header>
              <strong>Record</strong>
              <button type="button" aria-label="Close" onClick={() => setJsonOpen(false)}>×</button>
            </header>
            <div className="exp-layers">
              <Layer title="Raw payload" value={selected.raw} />
              <Layer title="Decoded" value={selected.decoded} note={selected.decoded ? undefined : layerNote(selected.level, "decoded")} />
              <Layer title="Communication" value={selected.communication} note={selected.communication ? undefined : layerNote(selected.level, "communication")} />
            </div>
          </aside>
        ) : null}
      </section>
    </div>
  );
}

function pageNumbers(current: number, count: number) {
  const start = Math.max(1, Math.min(current - 3, count - 6));
  const end = Math.min(count, start + 6);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
}

function layerNote(level: RecordLevel, layer: "decoded" | "communication") {
  if (layer === "decoded" && level === "Uplink") return "Gateway stores the soldier payload undecoded. This record is transport metadata, not a sensor reading.";
  if (layer === "decoded" && level === "Beacon") return "Observation only. A trilateration fix, when one is produced, is a separate telemetry record.";
  if (layer === "communication" && level === "Telemetry") return "RSSI, SNR, hop, and TTL are not fields of the 21-byte payload. They are stored on a mesh record.";
  if (layer === "communication" && level === "Beacon") return "Beacon RSSI belongs to this observation. It is not LoRa metadata for a soldier packet.";
  if (layer === "communication" && level === "Special") return "RR series and EKG recordings are not the routine 21-byte packet.";
  return "This layer is not part of the record.";
}

function Layer({ title, value, note }: { title: string; value: Record<string, unknown> | null; note?: string }) {
  return (
    <section className="exp-layer">
      <h3>{title}</h3>
      {value ? <JsonView value={value} /> : <p className="exp-layer-note">{note}</p>}
    </section>
  );
}

function ResultRow({ item, selected, onSelect }: { item: ExplorerRecord; selected: boolean; onSelect: () => void }) {
  return (
    <tr className={selected ? "on" : ""} onClick={onSelect}>
      <td>{item.time}</td>
      <td>{item.received}</td>
      <td>{item.entity}</td>
      <td><span className={`exp-kind ${item.tone}`}><Icon name={item.icon} size={11} />{item.level}</span></td>
      <td>{item.record}</td>
      <td>{item.gateway}</td>
      <td className={item.summary === "TANPA VITAL" ? "void" : ""}>{item.summary}</td>
    </tr>
  );
}
