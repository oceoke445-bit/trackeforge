"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Dropdown from "@/components/ui/dropdown";
import Icon, { type IconName } from "@/components/ui/icon";
import { useHistoryFeed } from "@/lib/history-feed";
import {
  fetchHistory,
  fetchHistoryPoint,
  formatHistoryTime,
  historyQuery,
  kindLabel,
  sourceLabel,
  trackToPoints,
  type HistoryBundle,
  type HistoryPointDetail,
} from "@/lib/history-api";
import HistoryTrackMap, { HistoryZoomMap } from "./history-track-map";
import {
  ALL_SOLDIERS,
  GROUPS,
  SOLDIERS,
  SOURCE_COLOR,
  TRACK_DAY,
  TRACK_SOURCES,
  buildTrack,
  deliveryLabel,
  formatClock,
  groupFor,
  hasPayload,
  inRange,
  membersOf,
  noonIndex,
  payloadHex,
  positionUncertainty,
  summarize,
  type TrackPoint,
  type TrackSource,
} from "./history-track";

const RANGES = [
  { id: "1h", label: "Last 1 Hour" },
  { id: "6h", label: "Last 6 Hours" },
  { id: "24h", label: "Last 24 Hours" },
  { id: "7d", label: "Last 7 Days" },
] as const;

type RangeId = (typeof RANGES)[number]["id"] | "custom";
type ViewBy = "soldier" | "group" | "weapon";
type DataType = "telemetry" | "mesh" | "uplink" | "beacon" | "special" | "system";

const DATA_TYPES: { id: DataType; label: string; icon: IconName; color: string }[] = [
  { id: "telemetry", label: "Telemetry", icon: "heart", color: "#f87171" },
  { id: "mesh", label: "Mesh Frame", icon: "signal", color: "#60a5fa" },
  { id: "uplink", label: "Uplink", icon: "upload", color: "#a78bfa" },
  { id: "beacon", label: "Beacon", icon: "pin", color: "#34d399" },
  { id: "special", label: "Special", icon: "warn", color: "#fbbf24" },
  { id: "system", label: "System", icon: "settings", color: "#94a3b8" },
];

const VIEWS: { id: ViewBy; label: string; icon: IconName }[] = [
  { id: "soldier", label: "Soldier", icon: "user" },
  { id: "group", label: "Group", icon: "users" },
  { id: "weapon", label: "Weapon", icon: "crosshair" },
];

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function optionsFor(view: ViewBy) {
  if (view === "group") return GROUPS;
  if (view === "soldier") return [ALL_SOLDIERS, ...SOLDIERS.map((item) => item.id)];
  return [];
}

function chartText(value: number, unit: string) {
  if (unit === "%") return `${Math.round(value)}%`;
  if (unit === "°C" || unit === "km/h") return `${value.toFixed(1)} ${unit}`;
  return `${Math.round(value)} ${unit}`;
}

function Spark({
  points,
  selected,
  pick,
  min,
  max,
  color,
  icon,
  title,
  unit,
}: {
  points: TrackPoint[];
  selected: TrackPoint | null;
  pick: (point: TrackPoint) => number;
  min: number;
  max: number;
  color: string;
  icon: IconName;
  title: string;
  unit: string;
}) {
  const yOf = (value: number) => 12 + (1 - (value - min) / (max - min)) * 76;
  const line = points.map((point) => {
    const x = (point.seconds / 86400) * 100;
    return `${x.toFixed(2)},${yOf(pick(point)).toFixed(2)}`;
  }).join(" ");
  const x = selected ? (selected.seconds / 86400) * 100 : 0;
  const value = selected ? pick(selected) : min;
  const y = yOf(value);
  return (
    <article className="trk-chart">
      <header>
        <Icon name={icon} size={icon === "bolt" ? 11 : 14} />
        <span>{title}<small>({unit})</small></span>
      </header>
      <div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={line} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
          {selected ? <line x1={x} x2={x} y1="4" y2="96" stroke="rgba(148,163,184,.55)" strokeDasharray="1.2 1.6" vectorEffect="non-scaling-stroke" /> : null}
        </svg>
        {selected ? (
          <b style={{ left: `${Math.min(84, Math.max(16, x))}%`, top: `${y}%`, color }}>{chartText(value, unit)}</b>
        ) : null}
      </div>
      <footer><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></footer>
    </article>
  );
}

export default function GroupsHistoryPage() {
  const [draftView, setDraftView] = useState<ViewBy>("soldier");
  const [draftEntity, setDraftEntity] = useState("S-104");
  const [draftRange, setDraftRange] = useState<RangeId>("24h");
  const [draftTypes, setDraftTypes] = useState<DataType[]>(DATA_TYPES.map((item) => item.id));
  const [draftSources, setDraftSources] = useState<TrackSource[]>([...TRACK_SOURCES]);
  const [view, setView] = useState<ViewBy>("soldier");
  const [entity, setEntity] = useState("S-104");
  const [range, setRange] = useState<RangeId>("24h");
  const [types, setTypes] = useState<DataType[]>(DATA_TYPES.map((item) => item.id));
  const [sources, setSources] = useState<TrackSource[]>([...TRACK_SOURCES]);
  const [tab, setTab] = useState<"timeline" | "summary">("timeline");
  const [rawOpen, setRawOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [detailOpen, setDetailOpen] = useState(true);
  const [cursor, setCursor] = useState(() => noonIndex(buildTrack("S-104")));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState("1x");
  const { mode, status, pending, runId, reload, finish, fail } = useHistoryFeed();
  const [live, setLive] = useState<HistoryBundle | null>(null);
  const [liveError, setLiveError] = useState("");
  const [liveDetail, setLiveDetail] = useState<HistoryPointDetail | null>(null);
  const skipRefresh = useRef(false);
  const applyRequest = useRef<{ view: ViewBy; entity: string; range: RangeId; types: DataType[]; sources: TrackSource[] } | null>(null);

  const track = useMemo(() => {
    if (view === "weapon") return [];
    const allowed = new Set(DATA_TYPES.filter((item) => types.includes(item.id)).map((item) => item.label));
    const visible = new Set(sources);
    return buildTrack(entity).filter((point) => {
      if (!allowed.has(point.kind) || !inRange(point, range)) return false;
      if (!point.source) return true;
      return visible.has(point.source);
    });
  }, [entity, range, sources, types, view]);
  const livePoints = useMemo(() => (mode === "live" && live ? trackToPoints(live.track) : []), [live, mode]);
  const activeTrack = mode === "live" ? livePoints : track;
  const selected = activeTrack[cursor] ?? null;
  const route = useMemo(() => (mode === "live" ? livePoints : track.filter((point) => point.source)), [livePoints, mode, track]);
  const payload = useMemo(() => track.filter(hasPayload), [track]);
  const stats = useMemo(() => {
    if (mode === "live" && live) {
      return {
        distance: live.cards.total_distance_km,
        hr: live.cards.heart_rate_avg_bpm,
        battery: live.cards.battery_avg_percent,
        count: live.cards.total_records,
      };
    }
    const mock = summarize(route.length ? route : payload);
    return { distance: mock.distance, hr: mock.hr, battery: mock.battery, count: mock.count };
  }, [live, mode, payload, route]);

  function appliedQuery() {
    return historyQuery({ view, entity, range, types, sources });
  }

  function liveSoldierQuery() {
    const soldier = view === "soldier" && /^S-\d+$/.test(entity) ? entity : "S-104";
    if (view !== "soldier" || entity !== soldier) {
      setView("soldier");
      setEntity(soldier);
    }
    if (draftView !== "soldier" || draftEntity !== soldier) {
      setDraftView("soldier");
      setDraftEntity(soldier);
    }
    return historyQuery({ view: "soldier", entity: soldier, range, types, sources });
  }

  async function openPoint(sourceId: number) {
    try {
      const detail = await fetchHistoryPoint(sourceId);
      setLiveDetail(detail);
      setLiveError("");
      setDetailOpen(true);
      setRawOpen(false);
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : "History point was not found.");
    }
  }

  useEffect(() => {
    if (!pending) return;
    const run = runId;
    const request = applyRequest.current;
    if (request) {
      setView(request.view);
      setEntity(request.entity);
      setRange(request.range);
      setTypes(request.types);
      setSources(request.sources);
      setLiveDetail(null);
      if (pending === "mock") {
        const timer = window.setTimeout(() => {
          applyRequest.current = null;
          finish(run);
        }, 400);
        return () => window.clearTimeout(timer);
      }
      const query = historyQuery(request);
      if (!query) {
        setLive(null);
        setLiveError(request.view === "weapon" ? "" : "Select one soldier or one group for live history.");
        const timer = window.setTimeout(() => {
          applyRequest.current = null;
          finish(run);
        }, 200);
        return () => window.clearTimeout(timer);
      }
      let ignore = false;
      fetchHistory(query)
        .then((next) => {
          if (ignore) return;
          applyRequest.current = null;
          setLive(next);
          setLiveError("");
          skipRefresh.current = true;
          finish(run);
        })
        .catch((error: unknown) => {
          if (ignore) return;
          setLiveError(error instanceof Error ? error.message : "Live history is unavailable.");
          fail(run);
        });
      return () => {
        ignore = true;
      };
    }
    if (pending === "mock") {
      const timer = window.setTimeout(() => {
        setLiveDetail(null);
        finish(run);
      }, 400);
      return () => window.clearTimeout(timer);
    }
    const query = liveSoldierQuery();
    if (!query) {
      setLive(null);
      setLiveDetail(null);
      setLiveError("Select one soldier for live history.");
      const timer = window.setTimeout(() => finish(run), 200);
      return () => window.clearTimeout(timer);
    }
    let ignore = false;
    fetchHistory(query)
      .then((next) => {
        if (ignore) return;
        setLive(next);
        setLiveDetail(null);
        setLiveError("");
        skipRefresh.current = true;
        finish(run);
      })
      .catch((error: unknown) => {
        if (ignore) return;
        setLiveError(error instanceof Error ? error.message : "Live history is unavailable.");
        fail(run);
      });
    return () => {
      ignore = true;
    };
  }, [fail, finish, pending, runId]);

  useEffect(() => {
    if (mode !== "live" || pending) return;
    if (skipRefresh.current) {
      skipRefresh.current = false;
      return;
    }
    const query = appliedQuery();
    if (!query) {
      setLive(null);
      setLiveDetail(null);
      setLiveError(view === "weapon" ? "" : "Select one soldier or one group for live history.");
      return;
    }
    let ignore = false;
    fetchHistory(query)
      .then((next) => {
        if (ignore) return;
        setLive(next);
        setLiveDetail(null);
        setLiveError("");
      })
      .catch((error: unknown) => {
        if (!ignore) setLiveError(error instanceof Error ? error.message : "Live history is unavailable.");
      });
    return () => {
      ignore = true;
    };
  }, [entity, mode, pending, range, sources, types, view]);

  useEffect(() => {
    setCursor(mode === "live" ? 0 : noonIndex(activeTrack));
    setPlaying(false);
  }, [activeTrack, mode]);

  useEffect(() => {
    if (mode !== "live") return;
    const sourceId = activeTrack[cursor]?.sourceId;
    if (sourceId == null) return;
    const timer = window.setTimeout(() => {
      void openPoint(sourceId);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [activeTrack, cursor, mode]);

  useEffect(() => {
    if (!playing || activeTrack.length < 2) return;
    const step = Number(speed.replace("x", "")) || 1;
    const timer = window.setInterval(() => {
      setCursor((current) => {
        if (current >= activeTrack.length - 1) {
          setPlaying(false);
          return current;
        }
        return Math.min(activeTrack.length - 1, current + step * 4);
      });
    }, 350);
    return () => window.clearInterval(timer);
  }, [activeTrack.length, playing, speed]);

  function applyFilters() {
    if (status !== "idle") return;
    applyRequest.current = {
      view: draftView,
      entity: draftEntity,
      range: draftRange,
      types: draftTypes,
      sources: draftSources,
    };
    reload(mode);
  }

  function reset() {
    setDraftView("soldier");
    setDraftEntity("S-104");
    setDraftRange("24h");
    setDraftTypes(DATA_TYPES.map((item) => item.id));
    setDraftSources([...TRACK_SOURCES]);
  }

  function chooseView(next: ViewBy) {
    setDraftView(next);
    if (next === "weapon") return;
    setDraftEntity(next === "soldier" ? "S-104" : optionsFor(next)[0]);
  }

  function togglePlay() {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (activeTrack.length < 2) return;
    if (cursor >= activeTrack.length - 1) setCursor(0);
    setPlaying(true);
  }

  function seek(seconds: number) {
    if (!activeTrack.length) return;
    const index = activeTrack.reduce((best, point, item) => (
      Math.abs(point.seconds - seconds) < Math.abs(activeTrack[best].seconds - seconds) ? item : best
    ), 0);
    setCursor(index);
  }

  const entityOptions = mode === "live"
    ? draftView === "soldier"
      ? [...new Set([...SOLDIERS.map((item) => item.id), ...(live?.options.soldiers ?? []).map((id) => `S-${id}`)])]
      : draftView === "group"
        ? [...new Set([...GROUPS, ...(live?.options.groups ?? [])])]
        : []
    : optionsFor(draftView);

  const showRoute = route.length > 0;
  const showVital = payload.length > 0;
  const showBattery = payload.length > 0;
  const showEvents = types.includes("system");

  return (
    <div className={`trk-page${detailOpen && tab === "timeline" ? "" : " detail-closed"}${filtersOpen ? "" : " filters-closed"}`}>
      <div className="trk-board">
      <header className="trk-board-head">
        {filtersOpen ? (
          <div className="trk-filters-head">
            <h2><Icon name="filter" size={15} /> Filters</h2>
            <button type="button" className="trk-filter-collapse" aria-label="Hide filters" onClick={() => setFiltersOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M9 4v16" />
                <path d="m13 15-3-3 3-3" />
              </svg>
            </button>
          </div>
        ) : (
          <button type="button" className="trk-reopen" aria-label="Open filters" onClick={() => setFiltersOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M9 4v16" />
              <path d="m14 10 3 2-3 2" />
            </svg>
          </button>
        )}
        <div className="trk-head">
          <span><Icon name="clock" size={16} /></span>
          <div>
            <h1>History</h1>
            <p>View historical activities, telemetry, movements, and system events from your unit.</p>
          </div>
        </div>
      </header>
      <aside className="trk-filters">
        <div className="trk-filter-scroll">
          <section>
            <h3>View By</h3>
            <div className="trk-views">
              {VIEWS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={draftView === item.id ? "on" : ""}
                  disabled={item.id === "weapon"}
                  onClick={() => chooseView(item.id)}
                >
                  <Icon name={item.icon} size={13} /> {item.label}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3>{VIEWS.find((item) => item.id === draftView)?.label}</h3>
            {draftView === "weapon" ? (
              <p className="trk-soon">Coming soon. Weapon tracker is not in this spec yet.</p>
            ) : (
              <Dropdown value={draftEntity} options={entityOptions.length ? entityOptions : optionsFor(draftView)} onChange={setDraftEntity} ariaLabel="History entity" block />
            )}
          </section>
          <section>
            <h3>Time Range</h3>
            <div className="trk-ranges">
              {RANGES.map((item) => (
                <button key={item.id} type="button" className={draftRange === item.id ? "on" : ""} onClick={() => setDraftRange(item.id)}>{item.label}</button>
              ))}
              <button type="button" className={draftRange === "custom" ? "on wide" : "wide"} onClick={() => setDraftRange("custom")}>Custom Range</button>
            </div>
            {mode === "live" ? <p className="trk-live-note">Live clock ends 04 Oct 2026 08:30 UTC. The seed window is 08:00–08:29 UTC.</p> : null}
          </section>
          <section>
            <h3>Data Type</h3>
            {DATA_TYPES.map((item) => (
              <label key={item.id}>
                <input type="checkbox" checked={draftTypes.includes(item.id)} onChange={() => setDraftTypes((current) => toggle(current, item.id))} />
                <Icon name={item.icon} size={13} />
                <span style={{ color: item.color }}>{item.label}</span>
              </label>
            ))}
          </section>
          <section>
            <h3>Position Source</h3>
            {TRACK_SOURCES.map((item) => (
              <label key={item}>
                <input type="checkbox" checked={draftSources.includes(item)} onChange={() => setDraftSources((current) => toggle(current, item))} />
                <i style={{ background: SOURCE_COLOR[item] }} />
                <span>{item}</span>
              </label>
            ))}
          </section>
        </div>
        <div className="trk-apply-bar">
          <button type="button" className="trk-reset" onClick={reset}>Reset</button>
          <button type="button" className="trk-apply" onClick={applyFilters} disabled={status !== "idle"}><Icon name="search" size={14} /> Apply</button>
        </div>
      </aside>

      <div className="trk-main">
        <div className="trk-tabs">
          {([["timeline", "Timeline & Map"], ["summary", "Summary"]] as const).map(([id, label]) => (
            <button key={id} type="button" className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {liveError ? <p className="trk-empty">{liveError}</p> : null}
        {view === "weapon" ? (
          <p className="trk-empty">Weapon tracker is coming soon. The weapon specification is not ready yet.</p>
        ) : tab === "timeline" ? (
          <>
            <section className="trk-kpis">
              <article><Icon name="pin" size={16} /><div><small>Total Distance <em>derived</em></small><strong>{mode === "live" ? stats.distance.toFixed(3) : stats.distance.toFixed(1)} km</strong></div><Icon name="chart" size={16} /></article>
              <article><Icon name="heart" size={16} /><div><small>Heart Rate (avg)</small><strong>{stats.hr == null ? "—" : `${stats.hr} bpm`}</strong></div><Icon name="chart" size={16} /></article>
              <article><Icon name="bolt" size={16} /><div><small>Battery (avg)</small><strong>{stats.battery == null ? "—" : `${stats.battery} %`}</strong></div><Icon name="chart" size={16} /></article>
            </section>
            {!pending && showRoute ? (
              <HistoryTrackMap
                points={showEvents ? route : route.map((point) => ({ ...point, event: false }))}
                selected={selected}
                onSelect={(index) => {
                  const found = activeTrack.findIndex((point) => point.index === index);
                  if (found < 0) return;
                  setCursor(found);
                  const sourceId = activeTrack[found].sourceId;
                  if (mode === "live" && sourceId != null) void openPoint(sourceId);
                }}
              />
            ) : <p className="trk-empty">Position is hidden by the current data type filter.</p>}
            <div className="trk-player">
              <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={togglePlay}>
                <Icon name={playing ? "pause" : "play"} size={16} />
              </button>
              <div>
                <span>{TRACK_DAY} 00:00</span>
                <div className="trk-rail">
                  {showEvents ? activeTrack.filter((point) => point.event).map((point) => (
                    <i key={point.index} style={{ left: `${(point.seconds / 86400) * 100}%` }} />
                  )) : null}
                  <input
                    type="range"
                    min={0}
                    max={86400}
                    value={selected?.seconds ?? 0}
                    aria-label="History playback"
                    style={{ ["--pct" as string]: `${((selected?.seconds ?? 0) / 86400) * 100}%` }}
                    onChange={(event) => seek(Number(event.target.value))}
                  />
                  {selected ? <b style={{ left: `${(selected.seconds / 86400) * 100}%` }}>{formatClock(selected.seconds)}</b> : null}
                </div>
                <span>{TRACK_DAY} 23:59</span>
              </div>
              <Dropdown value={speed} options={["1x", "2x", "4x", "8x"]} onChange={setSpeed} ariaLabel="Playback speed" />
            </div>
            {mode === "live" ? null : (
            <section className="trk-charts">
              {showVital ? <Spark points={payload} selected={selected && hasPayload(selected) ? selected : null} pick={(point) => point.hr} min={60} max={120} color="#f87171" icon="heart" title="Heart Rate" unit="bpm" /> : null}
              {showVital ? <Spark points={payload} selected={selected && hasPayload(selected) ? selected : null} pick={(point) => point.temp} min={35} max={39} color="#fb923c" icon="thermo" title="Body Temperature" unit="°C" /> : null}
              {showBattery ? <Spark points={payload} selected={selected && hasPayload(selected) ? selected : null} pick={(point) => point.battery} min={40} max={100} color="#22c55e" icon="bolt" title="Battery Level" unit="%" /> : null}
            </section>
            )}
          </>
        ) : (
          <SummaryPanel
            track={mode === "live" ? activeTrack : track}
            stats={stats}
            live={mode === "live"}
            items={live?.items ?? []}
            counts={live?.statistics.by_data_type ?? []}
            selected={selected}
            showPosition={!pending && showRoute}
            showVital={showVital}
            showBattery={showBattery}
            onSelect={(index) => {
              const found = activeTrack.findIndex((point) => point.index === index);
              if (found < 0) return;
              setCursor(found);
              const sourceId = activeTrack[found].sourceId;
              if (mode === "live" && sourceId != null) void openPoint(sourceId);
            }}
            onOpen={(index) => {
              const found = (mode === "live" ? activeTrack : track).findIndex((point) => point.index === index);
              if (found < 0) return;
              setCursor(found);
              setDetailOpen(true);
              if (mode === "live") {
                const sourceId = activeTrack[found].sourceId;
                if (sourceId != null) void openPoint(sourceId);
                setTab("timeline");
              } else {
                setTab("timeline");
              }
            }}
            onOpenSource={(sourceId) => {
              const found = activeTrack.findIndex((point) => point.sourceId === sourceId);
              if (found >= 0) setCursor(found);
              void openPoint(sourceId);
              setTab("timeline");
            }}
          />
        )}
      </div>
      </div>

      {detailOpen && tab === "timeline" ? (
        <aside className="trk-point">
          <header>
            <h2><Icon name="pin" size={14} /> Detail</h2>
            <button type="button" aria-label="Close" onClick={() => setDetailOpen(false)}>×</button>
          </header>
          {pending ? null : view === "weapon" ? (
            <p className="trk-empty">Weapon tracker detail is not in this spec yet.</p>
          ) : mode === "live" ? (
            liveDetail ? (
              <LivePointDetail detail={liveDetail} rawOpen={rawOpen} onToggleRaw={() => setRawOpen((current) => !current)} />
            ) : <p className="trk-empty">Select a record or a map point.</p>
          ) : selected ? (
            <PointDetail
              point={selected}
              entity={entity}
              view={view}
              rawOpen={rawOpen}
              onToggleRaw={() => setRawOpen((current) => !current)}
            />
          ) : <p className="trk-empty">No point in this filter.</p>}
        </aside>
      ) : null}
    </div>
  );
}

const RECORD_KINDS = DATA_TYPES.map((item) => ({ id: item.label, color: item.color }));

function SummaryPanel({
  track,
  stats,
  live,
  items,
  counts: liveCounts,
  selected,
  showPosition,
  showVital,
  showBattery,
  onSelect,
  onOpen,
  onOpenSource,
}: {
  track: TrackPoint[];
  stats: { distance: number; hr: number | null; battery: number | null; count: number };
  live: boolean;
  items: HistoryBundle["items"];
  counts: HistoryBundle["statistics"]["by_data_type"];
  selected: TrackPoint | null;
  showPosition: boolean;
  showVital: boolean;
  showBattery: boolean;
  onSelect: (index: number) => void;
  onOpen: (index: number) => void;
  onOpenSource: (sourceId: number) => void;
}) {
  const payload = track.filter(hasPayload);
  const route = track.filter((point) => point.source);
  const chartPoint = selected && hasPayload(selected) ? selected : null;
  const counts = RECORD_KINDS.map((kind) => ({
    ...kind,
    count: track.filter((point) => point.kind === kind.id).length,
  }));
  const recent = track.slice(-8).reverse();
  return (
    <section className="trk-summary">
      <h2>Summary</h2>
      <div className="trk-sum-cards">
        <article>
          <small>Total Distance <em>Derived</em></small>
          <strong>{live ? stats.distance.toFixed(3) : stats.distance.toFixed(1)} km</strong>
          <p>Derived from historical position records</p>
        </article>
        <article>
          <small>Heart Rate (avg)</small>
          <strong>{stats.hr == null ? "—" : `${stats.hr} bpm`}</strong>
          <p>Average heart rate during the selected period</p>
        </article>
        <article>
          <small>Battery (avg)</small>
          <strong>{stats.battery == null ? "—" : `${stats.battery}%`}</strong>
          <p>Average battery level during the selected period</p>
        </article>
        <article>
          <small>Total Records</small>
          <strong>{stats.count.toLocaleString("en-US")}</strong>
          <p>All historical records in the selected period</p>
        </article>
      </div>

      <article className="trk-sum-block">
        <h3>Historical Route</h3>
        <p>Historical position track based on recorded position points.</p>
        {showPosition && route.length ? (
          <div className="trk-sum-map">
            <HistoryTrackMap points={route} selected={selected} onSelect={onSelect} />
          </div>
        ) : <p className="trk-empty">Position is hidden by the current data type filter.</p>}
      </article>

      {live ? null : (
        <>
      {showVital ? (
        <article className="trk-sum-block">
          <h3>Vitals Over Time</h3>
          <p>Heart rate, HRV/RMSSD, SpO₂, and body temperature recorded during the selected period.</p>
          <div className="trk-charts trk-vitals">
            <Spark points={payload} selected={chartPoint} pick={(point) => point.hr} min={60} max={120} color="#f87171" icon="heart" title="Heart Rate" unit="bpm" />
            <Spark points={payload} selected={chartPoint} pick={(point) => point.hrv} min={20} max={50} color="#fb7185" icon="heart" title="HRV / RMSSD" unit="ms" />
            <Spark points={payload} selected={chartPoint} pick={(point) => point.spo2} min={90} max={100} color="#38bdf8" icon="heart" title="SpO₂" unit="%" />
            <Spark points={payload} selected={chartPoint} pick={(point) => point.temp} min={35} max={39} color="#fb923c" icon="thermo" title="Body Temperature" unit="°C" />
          </div>
        </article>
      ) : null}

      {showBattery ? (
        <article className="trk-sum-block">
          <h3>Battery Level</h3>
          <p>Battery level recorded over time.</p>
          <div className="trk-charts trk-battery">
            <Spark points={payload} selected={chartPoint} pick={(point) => point.battery} min={40} max={100} color="#22c55e" icon="bolt" title="Battery Level" unit="%" />
          </div>
        </article>
      ) : null}
        </>
      )}

      <article className="trk-sum-block">
        <h3>Records by Type</h3>
        <p>Distribution of telemetry, mesh frame, uplink, beacon, special, and system records.</p>
        <div className="trk-sum-bars">
          {(live ? liveCounts.map((item) => ({
            id: kindLabel(item.name),
            color: DATA_TYPES.find((type) => type.label === kindLabel(item.name))?.color ?? "#94a3b8",
            count: item.count,
          })) : counts).map((kind) => {
            const pct = stats.count ? (kind.count / stats.count) * 100 : 0;
            const share = pct > 0 && pct < 1 ? "<1%" : `${Math.round(pct)}%`;
            return (
              <div key={kind.id}>
                <span>{kind.id}</span>
                <i><b style={{ width: `${pct}%`, background: kind.color }} /></i>
                <span>{kind.count.toLocaleString("en-US")} · {share}</span>
              </div>
            );
          })}
        </div>
      </article>

      <article className="trk-sum-block">
        <h3>Recent Records</h3>
        <p>Latest historical records in the selected period.</p>
        <div className="trk-sum-table">
          <table>
            <thead>
              <tr>
                <th>Event Time</th>
                <th>Data Type</th>
                <th>Position Source</th>
                <th>Location</th>
                <th>Heart Rate</th>
                <th>SpO₂</th>
                <th>Temperature</th>
                <th>Battery</th>
                <th>Gateway</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {live ? (items.length ? items.map((item) => (
                <tr key={item.id}>
                  <td>{formatHistoryTime(item.event_time)}</td>
                  <td>{kindLabel(item.data_type)}</td>
                  <td>{sourceLabel(item.position_source) ?? "—"}</td>
                  <td>{item.latitude != null && item.longitude != null ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}` : "—"}</td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                  <td>{item.gateway_id ?? "—"}</td>
                  <td><button type="button" onClick={() => onOpenSource(item.source_id)}>View</button></td>
                </tr>
              )) : (
                <tr><td colSpan={10}>No records in this filter.</td></tr>
              )) : recent.length ? recent.map((point) => (
                <tr key={`${point.soldierId}-${point.index}`}>
                  <td>{TRACK_DAY} {formatClock(point.seconds)}</td>
                  <td>{point.kind}</td>
                  <td>{point.source ?? "—"}</td>
                  <td>{point.source ? `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}` : "—"}</td>
                  <td>{hasPayload(point) ? (point.strap ? `${point.hr} bpm` : "TANPA VITAL") : "—"}</td>
                  <td>{hasPayload(point) && point.strap ? `${point.spo2}%` : "—"}</td>
                  <td>{hasPayload(point) && point.strap ? `${point.temp.toFixed(1)} °C` : "—"}</td>
                  <td>{hasPayload(point) ? `${point.battery}%` : "—"}</td>
                  <td>{point.gateway}</td>
                  <td><button type="button" onClick={() => onOpen(point.index)}>View</button></td>
                </tr>
              )) : (
                <tr><td colSpan={10}>No records in this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function deliveryText(mode: string | undefined) {
  if (mode === "STORE_AND_CARRY") return "Delayed / Store-and-Carry";
  if (mode === "LIVE") return "Live";
  return mode ?? "";
}

function transportText(value: string) {
  if (value === "LORAWAN" || value === "LORA") return "LoRa";
  if (value === "MESH") return "Mesh";
  return value;
}

function LivePointDetail({
  detail,
  rawOpen,
  onToggleRaw,
}: {
  detail: HistoryPointDetail;
  rawOpen: boolean;
  onToggleRaw: () => void;
}) {
  const position = detail.details.position;
  const vitals = detail.details.vitals;
  const device = detail.details.device;
  const communication = detail.details.communication ?? {};
  const timing = detail.details.timing;
  const raw = detail.details.raw_data;
  const source = sourceLabel(detail.position_source ?? position?.position_source);
  const lat = position?.latitude ?? detail.latitude;
  const lng = position?.longitude ?? detail.longitude;
  const strap = device?.flags?.strap_connected;
  const showVitals = strap !== false && vitals?.hr != null;
  const zoom = lat != null && lng != null ? {
    index: 0,
    soldierId: detail.soldier_id == null ? "unknown" : `S-${detail.soldier_id}`,
    seconds: 0,
    lng,
    lat,
    kind: "Telemetry" as const,
    source,
    hr: vitals?.hr ?? 0,
    hrv: vitals?.hrv ?? 0,
    spo2: vitals?.spo2 ?? 0,
    temp: vitals?.temp ?? 0,
    battery: device?.batt ?? 0,
    strap: strap !== false,
    gateway: communication.gateway_id ?? "",
    hop: communication.hop_count ?? 0,
    rssi: communication.rssi ?? 0,
    snr: communication.snr ?? 0,
    receivedLag: 0,
    seq: 0,
    flags: 0,
    event: false,
    sourceId: detail.source_id,
  } : null;
  const commRows: [string, string, string?][] = [];
  if (communication.transport) commRows.push(["Transport", transportText(communication.transport)]);
  if (communication.gateway_id) commRows.push(["Gateway", communication.gateway_id]);
  if (communication.hop_count != null) commRows.push(["Hop Count", String(communication.hop_count)]);
  if (communication.rssi != null) commRows.push(["RSSI", `${communication.rssi} dBm`]);
  if (communication.snr != null) commRows.push(["SNR", `${communication.snr} dB`]);
  if (communication.ttl != null) commRows.push(["TTL", String(communication.ttl)]);
  const delivery = deliveryText(communication.delivery_mode);
  const rawRows: [string, string, string?][] = [];
  if (raw?.raw_format) rawRows.push(["Raw Format", raw.raw_format]);
  if (raw?.raw_bytes_length != null) rawRows.push(["Raw Length", `${raw.raw_bytes_length} bytes`]);
  if (raw?.raw_hex) rawRows.push(["Raw Hex", raw.raw_hex]);

  return (
    <div className="trk-point-body">
      <div className="trk-point-title">
        <span><Icon name="pin" size={14} /></span>
        <div>
          <strong>{kindLabel(detail.data_type)}</strong>
          <small>{formatHistoryTime(timing?.event_time ?? detail.event_time)}</small>
        </div>
      </div>
      <section className="trk-block">
        <h3>Event</h3>
        <Rows rows={[
          ["Data Type", kindLabel(detail.data_type)],
          ["Position Source", source ?? "—", source === "GNSS" ? "gnss" : ""],
          ["Soldier", detail.soldier_id == null ? "—" : `S-${detail.soldier_id}`],
          ["Group", detail.group_id ?? "—"],
        ]} />
      </section>
      <section className="trk-block">
        <h3>Position</h3>
        {lat != null && lng != null ? (
          <>
            <Rows rows={[
              ["Latitude", lat.toFixed(4)],
              ["Longitude", lng.toFixed(4)],
              ["Position Uncertainty", source ? positionUncertainty(source) : "—"],
            ]} />
            <div className="trk-zoom-head"><h3>Location (zoomed)</h3><span>{lat.toFixed(4)}, {lng.toFixed(4)}</span></div>
            <HistoryZoomMap point={zoom} />
          </>
        ) : <p className="trk-novital">No position on this record.</p>}
      </section>
      <section className="trk-block">
        <h3>Vitals</h3>
        {showVitals ? (
          <Rows rows={[
            ["Heart Rate", `${vitals?.hr} bpm`],
            ["HRV / RMSSD", vitals?.hrv == null ? "—" : `${vitals.hrv} ms`],
            ["SpO₂", vitals?.spo2 == null ? "—" : `${vitals.spo2} %`],
            ["Body Temperature", vitals?.temp == null ? "—" : `${vitals.temp.toFixed(1)} °C`],
          ]} />
        ) : <p className="trk-novital">TANPA VITAL</p>}
      </section>
      <section className="trk-block">
        <h3>Device</h3>
        <Rows rows={[
          ["Battery", device?.batt == null ? "—" : `${device.batt} %`],
          ["Chest Strap", strap == null ? "—" : strap ? "Connected" : "Disconnected", strap ? "ok" : strap == null ? "" : "warn"],
        ]} />
      </section>
      {commRows.length ? (
        <section className="trk-block">
          <h3>Communication</h3>
          <Rows rows={commRows} />
        </section>
      ) : null}
      <section className="trk-block">
        <h3>Timing</h3>
        <Rows rows={[
          ["Event Time", formatHistoryTime(timing?.event_time ?? detail.event_time)],
          ["Received At", formatHistoryTime(timing?.received_at ?? detail.received_at)],
          ...(delivery ? [["Delivery", delivery, delivery === "Live" ? "ok" : "warn"] as [string, string, string?]] : []),
        ]} />
      </section>
      <section className="trk-block">
        <button type="button" className="trk-raw-toggle" aria-expanded={rawOpen} onClick={onToggleRaw}>
          Raw Data
          <Icon name="chevron" size={14} />
        </button>
        {rawOpen ? (rawRows.length ? <Rows rows={rawRows} /> : <p className="trk-novital">No raw payload on this record.</p>) : null}
      </section>
    </div>
  );
}

function Rows({ rows }: { rows: [string, string, string?][] }) {
  return (
    <dl>
      {rows.map(([label, value, tone]) => (
        <div key={label}><dt>{label}</dt><dd className={tone}>{value}</dd></div>
      ))}
    </dl>
  );
}

function PointDetail({
  point,
  entity,
  view,
  rawOpen,
  onToggleRaw,
}: {
  point: TrackPoint;
  entity: string;
  view: "soldier" | "group" | "weapon";
  rawOpen: boolean;
  onToggleRaw: () => void;
}) {
  const grouped = view === "group";
  const payloadRecord = hasPayload(point);
  const members = grouped ? membersOf(entity) : [];
  const received = point.seconds + point.receivedLag;
  const eventRows: [string, string, string?][] = [
    ["Data Type", point.kind],
    ["Position Source", point.source ?? "—", point.source === "GNSS" ? "gnss" : ""],
  ];
  if (grouped) {
    eventRows.push(["Group", entity], ["Members", members.length ? members.join(", ") : "—"]);
  } else if (entity === ALL_SOLDIERS) {
    eventRows.push(["Soldier", point.soldierId], ["Group", groupFor(point.soldierId)]);
  } else {
    eventRows.push(["Soldier", entity], ["Group", groupFor(entity)]);
  }
  return (
    <div className="trk-point-body">
      <div className="trk-point-title">
        <span><Icon name="pin" size={14} /></span>
        <div>
          <strong>{payloadRecord ? (grouped ? "Group Update" : "Position Update") : point.kind}</strong>
          <small>{TRACK_DAY} {formatClock(point.seconds)}</small>
        </div>
      </div>
      <section className="trk-block">
        <h3>Event</h3>
        <Rows rows={eventRows} />
      </section>
      {point.source ? (
        <section className="trk-block">
          <h3>Position</h3>
          <Rows rows={[
            ["Latitude", point.lat.toFixed(4)],
            ["Longitude", point.lng.toFixed(4)],
            ["Position Uncertainty", positionUncertainty(point.source)],
          ]} />
          <div className="trk-zoom-head"><h3>Location (zoomed)</h3><span>{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</span></div>
          <HistoryZoomMap point={point} />
        </section>
      ) : (
        <section className="trk-block">
          <h3>Position</h3>
          <p className="trk-novital">No position source on this record.</p>
        </section>
      )}
      {payloadRecord ? (
        <section className="trk-block">
          <h3>Vitals{grouped ? " · member average" : ""}</h3>
          {point.strap ? (
            <Rows rows={[
              ["Heart Rate", `${point.hr} bpm`],
              ["HRV / RMSSD", `${point.hrv} ms`],
              ["SpO₂", `${point.spo2} %`],
              ["Body Temperature", `${point.temp.toFixed(1)} °C`],
            ]} />
          ) : <p className="trk-novital">TANPA VITAL</p>}
        </section>
      ) : null}
      {payloadRecord ? (
        <section className="trk-block">
          <h3>Device</h3>
          <Rows rows={[
            ["Battery", `${point.battery} %`],
            ["Chest Strap", point.strap ? "Connected" : "Disconnected", point.strap ? "ok" : "warn"],
          ]} />
        </section>
      ) : null}
      <section className="trk-block">
        <h3>Communication</h3>
        <Rows rows={[
          ["Transport", point.kind === "Uplink" ? "Satellite" : "LoRa / Mesh"],
          ["Gateway", point.gateway],
          ["Hop Count", String(point.hop)],
          ["RSSI", `${point.rssi} dBm`],
          ["SNR", `${point.snr} dB`],
        ]} />
      </section>
      <section className="trk-block">
        <h3>Timing</h3>
        <Rows rows={[
          ["Event Time", `${TRACK_DAY} ${formatClock(point.seconds)}`],
          ["Received At", `${TRACK_DAY} ${formatClock(received)}`],
          ["Delivery", deliveryLabel(point), deliveryLabel(point) === "Live" ? "ok" : "warn"],
        ]} />
      </section>
      <section className="trk-block">
        <button type="button" className="trk-raw-toggle" aria-expanded={rawOpen} onClick={onToggleRaw}>
          Raw Data
          <Icon name="chevron" size={14} />
        </button>
        {rawOpen ? (
          grouped ? (
            <p className="trk-novital">Aggregated from {members.length || 0} member records.</p>
          ) : payloadRecord ? (
            <Rows rows={[
              ["Sequence", String(point.seq)],
              ["Flags", `0x${point.flags.toString(16).padStart(2, "0")}`],
              ["Raw Format", point.kind === "Mesh Frame" ? "FRAME_25" : "PAYLOAD_21"],
              ["Raw Length", point.kind === "Mesh Frame" ? "25 bytes" : "21 bytes"],
              ["Raw Hex", payloadHex(point.seq)],
            ]} />
          ) : <p className="trk-novital">This record is not a soldier position payload.</p>
        ) : null}
      </section>
    </div>
  );
}
