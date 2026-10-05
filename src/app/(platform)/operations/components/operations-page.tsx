"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/ui/icon";
import { GEOFENCES, TYPE_META, type GeofenceZone } from "@/app/(platform)/groups/components/geofence-data";
import { useGeofenceFeed } from "@/lib/geofence-feed";
import { fetchGeofences, GEOFENCE_CHANGED } from "@/lib/geofences";
import OperationsMap from "./operations-map";
import {
  CATALOG_GROUPS,
  OPERATIONS,
  OP_STATUSES,
  membersFor,
  type OpLayers,
  type OpStatus,
  type Operation,
} from "./operations-data";

type View = "list" | "detail";
type DetailTab = "overview" | "map" | "alerts" | "tickets";

const EMPTY_LAYERS: OpLayers = { groups: true, personnel: true };
const TIMES = ["All Time", "Last 7 days", "Last 30 days", "This month"] as const;
const PAGE_SIZE = 5;

function statusClass(status: OpStatus) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function statusLabel(status: OpStatus) {
  return status.toUpperCase();
}

export default function OperationsPage() {
  const { mode: geofenceMode } = useGeofenceFeed();
  const [rows, setRows] = useState(OPERATIONS);
  const [view, setView] = useState<View>("list");
  const [selectedId, setSelectedId] = useState(OPERATIONS[0]?.id ?? "");
  const [tab, setTab] = useState<DetailTab>("overview");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All Status" | OpStatus>("All Status");
  const [time, setTime] = useState<(typeof TIMES)[number]>("All Time");
  const [groupFilter, setGroupFilter] = useState("All Groups");
  const [page, setPage] = useState(1);
  const [layers, setLayers] = useState<OpLayers>(EMPTY_LAYERS);
  const [actionsOpen, setActionsOpen] = useState(false);

  const [draftName, setDraftName] = useState("");
  const [draftSummary, setDraftSummary] = useState("");
  const [draftStart, setDraftStart] = useState("");
  const [draftEnd, setDraftEnd] = useState("");
  const [groupQuery, setGroupQuery] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [liveGeofences, setLiveGeofences] = useState<GeofenceZone[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [draftDays, setDraftDays] = useState("");
  const [draftStatus, setDraftStatus] = useState<OpStatus>("Planning");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!createOpen && !editOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setCreateOpen(false);
      setEditOpen(false);
      setActionsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [createOpen, editOpen]);

  const selected = rows.find((item) => item.id === selectedId) ?? rows[0] ?? null;
  const geofenceCatalog = geofenceMode === "live" ? liveGeofences : GEOFENCES;

  useEffect(() => {
    if (geofenceMode !== "live") return;
    let ignore = false;
    const load = () => {
      fetchGeofences()
        .then((zones) => {
          if (!ignore) setLiveGeofences(zones);
        })
        .catch(() => {
          if (!ignore) setLiveGeofences([]);
        });
    };
    load();
    window.addEventListener(GEOFENCE_CHANGED, load);
    return () => {
      ignore = true;
      window.removeEventListener(GEOFENCE_CHANGED, load);
    };
  }, [geofenceMode]);
  const groupNames = useMemo(() => Array.from(new Set(rows.flatMap((item) => item.groupRows.map((row) => row.name.split("-")[0] || row.name)))), [rows]);

  const filtered = useMemo(() => {
    return rows.filter((item) => {
      if (status !== "All Status" && item.status !== status) return false;
      if (groupFilter !== "All Groups" && !item.groupRows.some((row) => row.name.toLowerCase().includes(groupFilter.toLowerCase()))) return false;
      const q = query.trim().toLowerCase();
      if (q && !`${item.name} ${item.summary} ${item.sector}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [groupFilter, query, rows, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1;
  const to = Math.min(current * PAGE_SIZE, filtered.length);
  const totalCount = rows.length;
  const activeCount = rows.filter((item) => item.status === "Active").length;
  const onHoldCount = rows.filter((item) => item.status === "On Hold").length;
  const planningCount = rows.filter((item) => item.status === "Planning").length;

  const availableGroups = CATALOG_GROUPS.filter(
    (item) => !selectedGroups.includes(item.id) && item.name.toLowerCase().includes(groupQuery.trim().toLowerCase()),
  );

  function resetFilters() {
    setQuery("");
    setStatus("All Status");
    setTime("All Time");
    setGroupFilter("All Groups");
    setPage(1);
  }

  function openCreate() {
    setDraftName("");
    setDraftSummary("");
    setDraftStart("");
    setDraftEnd("");
    setGroupQuery("");
    setSelectedGroups([]);
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
  }

  function openEditDetails() {
    if (!selected) return;
    setDraftName(selected.name);
    setDraftSummary(selected.summary);
    setDraftStart(selected.startAt);
    setDraftEnd(selected.endAt);
    setDraftDays(selected.days);
    setDraftStatus(selected.status);
    setActionsOpen(false);
    setTab("overview");
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
  }

  function saveOperationDetails(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const summary = draftSummary.trim() || selected.summary;
    const startAt = draftStart.trim() || selected.startAt;
    const endAt = draftEnd.trim() || selected.endAt;
    const name = draftName.trim() || selected.name;
    setRows((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              name,
              summary,
              startAt,
              endAt,
              start: startAt.slice(0, 11),
              end: endAt.slice(0, 11),
              days: draftDays.trim() || item.days,
              status: draftStatus,
              updatedAt: "05 Oct 2026 16:00",
            }
          : item,
      ),
    );
    setEditOpen(false);
  }

  function openDetail(id: string) {
    const operation = rows.find((item) => item.id === id);
    setSelectedId(id);
    setTab("overview");
    setActionsOpen(false);
    setOpenGroup(operation?.groupRows[0]?.name ?? null);
    setView("detail");
  }

  function deleteOperation(id: string) {
    setRows((current) => {
      const next = current.filter((item) => item.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? "");
      return next;
    });
    setPage(1);
  }

  function createOperation(event: FormEvent) {
    event.preventDefault();
    const name = draftName.trim() || "New Operation";
    const groups = CATALOG_GROUPS.filter((item) => selectedGroups.includes(item.id));
    const base = OPERATIONS[0];
    const id = `op-${Date.now()}`;
    const created: Operation = {
      ...base,
      id,
      name,
      sector: "Unassigned area",
      summary: draftSummary.trim() || "New tactical operation.",
      startAt: draftStart || "05 Oct 2026 08:00",
      endAt: draftEnd || "07 Oct 2026 18:00",
      start: (draftStart || "05 Oct 2026").slice(0, 11),
      end: (draftEnd || "07 Oct 2026").slice(0, 11),
      days: "2 days",
      status: "Planning",
      groups: groups.length || 0,
      personnel: groups.reduce((sum, item) => sum + item.personnel, 0),
      geofences: 0,
      devices: Math.max(4, groups.length * 4),
      createdBy: "Admin User",
      createdAt: "05 Oct 2026 15:00",
      updatedAt: "05 Oct 2026 15:00",
      groupsActive: 0,
      personnelOnline: groups.reduce((sum, item) => sum + item.personnel, 0),
      alerts: 0,
      critical: 0,
      groupRows: groups.map((item, index) => ({
        name: item.name,
        count: item.personnel,
        commander: item.commander,
        status: "Planning",
        members: membersFor(item.commander, item.personnel, index),
      })),
      geofenceRows: [],
      alertRows: [],
      timeline: [{ time: "15:00", text: `${name} created` }],
      pins: groups.map((item, index) => ({
        name: item.name,
        lng: base.center[0] - 0.01 + index * 0.01,
        lat: base.center[1] + 0.002 - index * 0.006,
      })),
    };
    setRows((currentRows) => [created, ...currentRows]);
    setCreateOpen(false);
    openDetail(id);
  }

  const createModal = mounted && createOpen
    ? createPortal(
        <div className="ops2-modal-overlay" role="presentation" onClick={closeCreate}>
          <form
            className="ops2-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ops2-create-title"
            onClick={(event) => event.stopPropagation()}
            onSubmit={createOperation}
          >
            <header className="ops2-modal-head">
              <div>
                <h2 id="ops2-create-title">Create Operation</h2>
                <p>Define mission details and assign groups for this operation.</p>
              </div>
              <button type="button" className="ops2-modal-close" aria-label="Close" onClick={closeCreate}>
                <Icon name="close" size={14} />
              </button>
            </header>

            <div className="ops2-modal-body ops2-create">
              <section>
                <h3>Basic Information</h3>
                <label>
                  <span>Operation Name</span>
                  <input
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    placeholder="Operation Alpha"
                    required
                    autoFocus
                  />
                </label>
                <label>
                  <span>Description</span>
                  <textarea
                    value={draftSummary}
                    onChange={(event) => setDraftSummary(event.target.value)}
                    rows={3}
                    placeholder="Mission objectives and notes..."
                  />
                </label>
                <div className="ops2-create-row">
                  <label>
                    <span>Start Date</span>
                    <span className="ops2-date">
                      <Icon name="calendar" size={14} />
                      <input value={draftStart} onChange={(event) => setDraftStart(event.target.value)} placeholder="05 Oct 2026 08:00" />
                    </span>
                  </label>
                  <label>
                    <span>End Date</span>
                    <span className="ops2-date">
                      <Icon name="calendar" size={14} />
                      <input value={draftEnd} onChange={(event) => setDraftEnd(event.target.value)} placeholder="07 Oct 2026 18:00" />
                    </span>
                  </label>
                </div>
              </section>

              <section className="ops2-assign-groups">
                <h3>Assigned Groups</h3>
                <div className="ops2-pick">
                  <div className="ops2-pick-col">
                    <div className="ops2-search">
                      <Icon name="search" size={14} />
                      <input value={groupQuery} onChange={(event) => setGroupQuery(event.target.value)} placeholder="Search groups..." />
                    </div>
                    <ul className="ops2-pick-list">
                      {availableGroups.map((item) => (
                        <li key={item.id}>
                          <button type="button" onClick={() => setSelectedGroups((current) => [...current, item.id])}>
                            <span>
                              <strong>{item.name}</strong>
                              <small>{item.personnel} personnel · {item.commander}</small>
                            </span>
                            <Icon name="plus" size={14} />
                          </button>
                        </li>
                      ))}
                      {!availableGroups.length ? <li className="ops2-pick-empty">No groups available</li> : null}
                    </ul>
                  </div>
                  <div className="ops2-pick-col">
                    <header>
                      <h3>Selected ({selectedGroups.length})</h3>
                      {selectedGroups.length ? (
                        <button type="button" onClick={() => setSelectedGroups([])}>Clear all</button>
                      ) : null}
                    </header>
                    <ul className="ops2-selected">
                      {selectedGroups.map((id) => {
                        const item = CATALOG_GROUPS.find((group) => group.id === id);
                        if (!item) return null;
                        return (
                          <li key={id}>
                            <div>
                              <strong>{item.name}</strong>
                              <small>{item.personnel} personnel</small>
                            </div>
                            <button
                              type="button"
                              aria-label={`Remove ${item.name}`}
                              onClick={() => setSelectedGroups((current) => current.filter((value) => value !== id))}
                            >
                              <Icon name="close" size={13} />
                            </button>
                          </li>
                        );
                      })}
                      {!selectedGroups.length ? <li className="ops2-pick-empty">No groups selected</li> : null}
                    </ul>
                  </div>
                </div>
              </section>
            </div>

            <footer className="ops2-modal-actions">
              <button type="button" className="ops2-ghost" onClick={closeCreate}>Cancel</button>
              <button type="submit" className="ops2-primary">
                <Icon name="plus" size={14} />
                Create Operation
              </button>
            </footer>
          </form>
        </div>,
        document.body,
      )
    : null;

  const editModal = mounted && editOpen && selected
    ? createPortal(
        <div className="ops2-modal-overlay" role="presentation" onClick={closeEdit}>
          <form
            className="ops2-modal ops2-modal-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ops2-edit-title"
            onClick={(event) => event.stopPropagation()}
            onSubmit={saveOperationDetails}
          >
            <header className="ops2-modal-head">
              <div>
                <h2 id="ops2-edit-title">Edit details</h2>
                <p>Update the operation details shown on this page.</p>
              </div>
              <button type="button" className="ops2-modal-close" aria-label="Close" onClick={closeEdit}>
                <Icon name="close" size={14} />
              </button>
            </header>

            <div className="ops2-modal-body ops2-create">
              <section>
                <h3>Operation Details</h3>
                <label>
                  <span>Operation Name</span>
                  <input value={draftName} onChange={(event) => setDraftName(event.target.value)} required autoFocus />
                </label>
                <label>
                  <span>Description</span>
                  <textarea value={draftSummary} onChange={(event) => setDraftSummary(event.target.value)} rows={3} />
                </label>
                <div className="ops2-create-row">
                  <label>
                    <span>Start Date</span>
                    <span className="ops2-date">
                      <Icon name="calendar" size={14} />
                      <input value={draftStart} onChange={(event) => setDraftStart(event.target.value)} />
                    </span>
                  </label>
                  <label>
                    <span>End Date</span>
                    <span className="ops2-date">
                      <Icon name="calendar" size={14} />
                      <input value={draftEnd} onChange={(event) => setDraftEnd(event.target.value)} />
                    </span>
                  </label>
                </div>
                <div className="ops2-create-row">
                  <label>
                    <span>Duration</span>
                    <input value={draftDays} onChange={(event) => setDraftDays(event.target.value)} placeholder="2 days" />
                  </label>
                  <label>
                    <span>Status</span>
                    <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as OpStatus)}>
                      {OP_STATUSES.map((item) => (
                        <option key={item} value={item}>{statusLabel(item)}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="ops2-edit-meta">
                  <div>
                    <span>Created By</span>
                    <strong>{selected.createdBy}</strong>
                  </div>
                  <div>
                    <span>Created At</span>
                    <strong>{selected.createdAt}</strong>
                  </div>
                </div>
              </section>
            </div>

            <footer className="ops2-modal-actions">
              <button type="button" className="ops2-ghost" onClick={closeEdit}>Cancel</button>
              <button type="submit" className="ops2-primary">Save changes</button>
            </footer>
          </form>
        </div>,
        document.body,
      )
    : null;

  if (view === "detail" && selected) {
    return (
      <>
      <div className="ops2-page">
        <header className="ops2-detail-head">
          <div className="ops2-detail-title">
            <button type="button" className="ops2-back" onClick={() => setView("list")}>
              <Icon name="arrow" size={14} />
            </button>
            <div>
              <div className="ops2-title-row">
                <h1>{selected.name}</h1>
                <em className={`ops2-pill ${statusClass(selected.status)}`}>{statusLabel(selected.status)}</em>
              </div>
              <p>{selected.summary}</p>
            </div>
          </div>
          <div className="ops2-actions">
            <button type="button" className="ops2-ghost" onClick={() => setActionsOpen((open) => !open)}>
              Actions
              <Icon name="chevron" size={13} />
            </button>
            {actionsOpen ? (
              <div className="ops2-menu">
                <button type="button" onClick={openEditDetails}>Edit details</button>
              </div>
            ) : null}
          </div>
        </header>

        <nav className="ops2-tabs" aria-label="Operation sections">
          {([
            ["overview", "Overview"],
            ["map", "Map"],
            ["alerts", "Alerts"],
            ["tickets", "Tickets"],
          ] as const).map(([id, label]) => (
            <button key={id} type="button" className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>

        {tab === "overview" ? (
          <div className="ops2-overview">
            <aside className="ops2-overview-left">
              <section className="ops2-card ops2-details">
                <h2>Operation Details</h2>
                <dl>
                  <div><dt>Description</dt><dd>{selected.summary}</dd></div>
                  <div><dt>Start Date</dt><dd>{selected.startAt}</dd></div>
                  <div><dt>End Date</dt><dd>{selected.endAt}</dd></div>
                  <div><dt>Duration</dt><dd>{selected.days}</dd></div>
                  <div><dt>Status</dt><dd><em className={`ops2-pill ${statusClass(selected.status)}`}>{statusLabel(selected.status)}</em></dd></div>
                  <div><dt>Created By</dt><dd>{selected.createdBy}</dd></div>
                  <div><dt>Created At</dt><dd>{selected.createdAt}</dd></div>
                </dl>
              </section>
            </aside>

            <section className="ops2-overview-main">
              <div className="ops2-metrics">
                <article>
                  <Icon name="users" size={15} />
                  <div>
                    <strong>{selected.groups}</strong>
                    <small>Groups</small>
                  </div>
                </article>
                <article>
                  <Icon name="user" size={15} />
                  <div>
                    <strong>{selected.personnel}</strong>
                    <small>Personnel</small>
                  </div>
                </article>
                <article>
                  <Icon name="shield" size={15} />
                  <div>
                    <strong>{geofenceCatalog.length}</strong>
                    <small>Geofences</small>
                  </div>
                </article>
              </div>

              <div className="ops2-card ops2-map-card">
                <header>
                  <h2>Operation Area</h2>
                </header>
                <div className="ops2-map-wrap">
                  <OperationsMap operation={selected} layers={layers} />
                  <div className="ops2-layers">
                    {(["groups", "personnel"] as const).map((key) => (
                      <label key={key}>
                        <input
                          type="checkbox"
                          checked={layers[key]}
                          onChange={() => setLayers((current) => ({ ...current, [key]: !current[key] }))}
                        />
                        {key[0].toUpperCase() + key.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <aside className="ops2-overview-side">
              <section className="ops2-card">
                <header>
                  <h2>Groups & Personnel</h2>
                  <button type="button" className="ops2-mini">
                    <Icon name="plus" size={12} />
                    Add Group
                  </button>
                </header>
                <ul className="ops2-group-roster">
                  {selected.groupRows.map((row, index) => {
                    const expanded = openGroup === row.name;
                    return (
                      <li key={row.name} className={expanded ? "on" : ""}>
                        <button
                          type="button"
                          className="ops2-group-head"
                          onClick={() => setOpenGroup(expanded ? null : row.name)}
                          aria-expanded={expanded}
                        >
                          <span className="ops2-group-index">{index + 1}</span>
                          <div>
                            <strong>{row.name}</strong>
                            <small>{row.commander} · {row.count} personnel</small>
                          </div>
                          <em className={`ops2-pill ${row.status.toLowerCase().replace(/\s+/g, "-")}`}>{row.status}</em>
                          <Icon name="chevron" size={13} />
                        </button>
                        {expanded ? (
                          <ul className="ops2-member-list">
                            {row.members.map((member, memberIndex) => (
                              <li key={`${row.name}-${member}-${memberIndex}`}>
                                <Icon name="user" size={12} />
                                <span>{member}</span>
                                {memberIndex === 0 ? <small>Commander</small> : null}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
                  {!selected.groupRows.length ? (
                    <li className="ops2-empty">No groups assigned to this operation.</li>
                  ) : null}
                </ul>
              </section>
            </aside>

            <section className="ops2-card ops2-overview-geofences">
              <header>
                <h2>Geofences</h2>
              </header>
              <div className="ops2-geofence-table-wrap">
                <table className="ops2-mini-table ops2-geofence-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Assigned Groups</th>
                      <th>Area Size</th>
                      <th>Triggered (24h)</th>
                      <th>Last Triggered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geofenceCatalog.map((zone, index) => (
                      <tr key={zone.id}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{zone.name}</strong>
                          {zone.description ? <small>{zone.description}</small> : null}
                        </td>
                        <td>
                          <span className="ops2-type" style={{ color: TYPE_META[zone.type].color }}>
                            {TYPE_META[zone.type].label}
                          </span>
                        </td>
                        <td><em className={`ops2-pill ${zone.status}`}>{zone.status}</em></td>
                        <td>{zone.groups.join(", ") || "—"}</td>
                        <td>{zone.areaKm2} km²</td>
                        <td>{zone.triggered24h}</td>
                        <td>{zone.lastTriggered || "—"}</td>
                      </tr>
                    ))}
                    {!geofenceCatalog.length ? (
                      <tr>
                        <td colSpan={8} className="ops2-empty">No geofences in the geofence list yet.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}

        {tab === "map" ? (
          <section className="ops2-card ops2-map-card ops2-map-full">
            <header><h2>Operation Map</h2></header>
            <div className="ops2-map-wrap tall">
              <OperationsMap operation={selected} layers={layers} />
              <div className="ops2-layers">
                {(["groups", "personnel"] as const).map((key) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={layers[key]}
                      onChange={() => setLayers((current) => ({ ...current, [key]: !current[key] }))}
                    />
                    {key[0].toUpperCase() + key.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {tab === "alerts" ? (
          <section className="ops2-card">
            <header><h2>Alerts</h2></header>
            {selected.alertRows.length ? (
              <ul className="ops2-alert-list">
                {selected.alertRows.map((row) => (
                  <li key={row.title}>
                    <Icon name="warn" size={14} />
                    <div>
                      <strong>{row.title}</strong>
                      <small>{row.detail}</small>
                    </div>
                    <em className={`ops2-pill ${row.level.toLowerCase()}`}>{row.level}</em>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ops2-empty">No alerts for this operation.</p>
            )}
          </section>
        ) : null}

        {tab === "tickets" ? (
          <section className="ops2-card">
            <header><h2>Tickets</h2></header>
            <p className="ops2-empty">No tickets linked to this operation yet.</p>
          </section>
        ) : null}
      </div>
      {createModal}
      {editModal}
      </>
    );
  }

  return (
    <>
    <div className="ops2-page ops2-list">
      <header className="page-title">
        <span className="page-title-icon"><Icon name="compass" size={15} /></span>
        <div>
          <h1>Operations</h1>
          <p>Plan, manage and monitor operational missions.</p>
        </div>
        <button type="button" className="ops2-primary" onClick={openCreate}>
          <Icon name="plus" size={14} />
          Create Operation
        </button>
      </header>

      <section className="ops2-stats" aria-label="Operation totals">
        <article className="total">
          <span><Icon name="layers" size={12} /></span>
          <div>
            <small>Total</small>
            <strong>{totalCount}</strong>
          </div>
        </article>
        <article className="active">
          <span><Icon name="play" size={12} /></span>
          <div>
            <small>Active</small>
            <strong>{activeCount}</strong>
          </div>
        </article>
        <article className="hold">
          <span><Icon name="pause" size={12} /></span>
          <div>
            <small>On Hold</small>
            <strong>{onHoldCount}</strong>
          </div>
        </article>
        <article className="planning">
          <span><Icon name="calendar" size={12} /></span>
          <div>
            <small>Planning</small>
            <strong>{planningCount}</strong>
          </div>
        </article>
      </section>

      <div className="ops2-list-body">
        <aside className="ops2-filters">
          <header>
            <h2>
              <Icon name="filter" size={14} />
              Filters
            </h2>
          </header>

          <div className="ops2-filter-scroll">
            <section>
              <h3>Search</h3>
              <label className="ops2-search">
                <Icon name="search" size={13} />
                <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search operation name..." />
              </label>
            </section>

            <section>
              <h3>Status</h3>
              <label className="ops2-filter-check">
                <input
                  type="radio"
                  name="ops-status"
                  checked={status === "All Status"}
                  onChange={() => { setStatus("All Status"); setPage(1); }}
                />
                <span>All Status</span>
              </label>
              {OP_STATUSES.map((item) => (
                <label key={item} className="ops2-filter-check">
                  <input
                    type="radio"
                    name="ops-status"
                    checked={status === item}
                    onChange={() => { setStatus(item); setPage(1); }}
                  />
                  <em className={`ops2-pill ${statusClass(item)}`}>{statusLabel(item)}</em>
                </label>
              ))}
            </section>

            <section>
              <h3>Time</h3>
              <label className="ops2-filter-field">
                <Icon name="calendar" size={13} />
                <select value={time} onChange={(event) => setTime(event.target.value as typeof time)}>
                  {TIMES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </section>

            <section>
              <h3>Groups</h3>
              <label className="ops2-filter-field">
                <Icon name="users" size={13} />
                <select value={groupFilter} onChange={(event) => { setGroupFilter(event.target.value); setPage(1); }}>
                  <option>All Groups</option>
                  {groupNames.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </section>
          </div>

          <div className="ops2-filter-clear">
            <button type="button" onClick={resetFilters}>Reset Filters</button>
          </div>
        </aside>

        <section className="ops2-list-card">
          <div className="ops2-table-wrap">
            <table className="ops2-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Operation Name</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Groups</th>
                  <th>Personnel</th>
                  <th>Geofences</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item, index) => (
                  <tr key={item.id} onClick={() => openDetail(item.id)}>
                    <td>{from + index}</td>
                    <td>
                      <strong>{item.name}</strong>
                      <small>{item.sector}</small>
                    </td>
                    <td><em className={`ops2-pill ${statusClass(item.status)}`}>{statusLabel(item.status)}</em></td>
                    <td>{item.startAt}</td>
                    <td>{item.endAt}</td>
                    <td>{item.groups}</td>
                    <td>{item.personnel}</td>
                    <td>{item.geofences}</td>
                    <td className="ops2-desc">{item.summary}</td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <button
                        type="button"
                        className="ops2-delete"
                        aria-label={`Delete ${item.name}`}
                        onClick={() => deleteOperation(item.id)}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!visible.length ? (
                  <tr>
                    <td colSpan={10} className="ops2-empty">No operations match the current filters.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <footer className="ops2-pager">
            <span>Showing {from} to {to} of {filtered.length} operations</span>
            <div>
              <button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)} aria-label="Previous page">
                <Icon name="chevron" size={14} />
              </button>
              {Array.from({ length: pageCount }, (_, index) => (
                <button key={index} type="button" className={current === index + 1 ? "on" : ""} onClick={() => setPage(index + 1)}>
                  {index + 1}
                </button>
              ))}
              <button type="button" disabled={current >= pageCount} onClick={() => setPage(current + 1)} aria-label="Next page">
                <Icon name="chevron" size={14} />
              </button>
            </div>
          </footer>
        </section>
      </div>
    </div>
    {createModal}
    </>
  );
}
