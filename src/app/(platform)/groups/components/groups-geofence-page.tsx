"use client";

import { useEffect, useMemo, useState } from "react";
import Icon, { type IconName } from "@/components/ui/icon";
import { useGeofenceFeed } from "@/lib/geofence-feed";
import {
  createGeofence,
  deleteGeofence,
  fetchGeofences,
  notifyGeofencesChanged,
  polygonAreaKm2,
  type GeofenceDraft,
} from "@/lib/geofences";
import GeofenceMap from "./geofence-map";
import {
  GEOFENCE_TYPES,
  GEOFENCES,
  GROUPS,
  TYPE_META,
  type GeofenceStatus,
  type GeofenceType,
  type GeofenceZone,
} from "./geofence-data";

const CREATE_STEPS = ["Basic Info", "Area"] as const;

const TYPE_ICON: Record<GeofenceType, IconName> = {
  restricted: "warn",
  silent: "warn",
  safe: "check",
};

export default function GroupsGeofencePage() {
  const [headerQuery, setHeaderQuery] = useState("");
  const [headerGroup, setHeaderGroup] = useState("all");
  const [listQuery, setListQuery] = useState("");
  const [listType, setListType] = useState<"all" | GeofenceType>("all");
  const [listStatus, setListStatus] = useState<"all" | GeofenceStatus>("all");
  const [listGroup, setListGroup] = useState("all");
  const [listPage, setListPage] = useState(1);
  const [selectedId, setSelectedId] = useState(GEOFENCES[0]?.id ?? "");
  const [checked, setChecked] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [draftPoints, setDraftPoints] = useState<[number, number][]>([]);
  const activeStep = Math.min(step, CREATE_STEPS.length - 1);
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);

  const [draftName, setDraftName] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftType, setDraftType] = useState<GeofenceType>("silent");
  const [draftActive, setDraftActive] = useState(true);
  const [draftGroups, setDraftGroups] = useState<string[]>(["Alpha"]);
  const [mockZones, setMockZones] = useState(GEOFENCES);
  const [liveZones, setLiveZones] = useState<GeofenceZone[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const { mode, pending, runId, finish, fail } = useGeofenceFeed();

  const sourceZones = mode === "live" ? liveZones : mockZones;
  const stats = useMemo(() => {
    const total = sourceZones.length;
    const active = sourceZones.filter((zone) => zone.status === "active").length;
    const inactive = sourceZones.filter((zone) => zone.status === "inactive").length;
    const triggeredToday = sourceZones.filter((zone) => zone.triggered24h > 0).length;
    const pct = (count: number) => (total ? ((count / total) * 100).toFixed(1) : "0");
    return { total, active, inactive, triggeredToday, activePct: pct(active), inactivePct: pct(inactive) };
  }, [sourceZones]);

  useEffect(() => {
    if (!pending) return;
    const run = runId;
    if (pending === "mock") {
      const timer = window.setTimeout(() => finish(run), 400);
      return () => window.clearTimeout(timer);
    }
    let ignore = false;
    fetchGeofences()
      .then((zones) => {
        if (ignore) return;
        setLiveZones(zones);
        finish(run);
      })
      .catch(() => {
        if (ignore) return;
        fail(run);
      });
    return () => {
      ignore = true;
    };
  }, [fail, finish, pending, runId]);

  const mapZones = useMemo(() => {
    const q = headerQuery.trim().toLowerCase();
    return sourceZones.filter((zone) => {
      if (headerGroup !== "all" && !zone.groups.includes(headerGroup)) return false;
      if (!q) return true;
      return `${zone.name} ${zone.description} ${zone.groups.join(" ")}`.toLowerCase().includes(q);
    });
  }, [headerGroup, headerQuery, sourceZones]);

  const rows = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    return sourceZones.filter((zone) => {
      if (listType !== "all" && zone.type !== listType) return false;
      if (listStatus !== "all" && zone.status !== listStatus) return false;
      if (listGroup !== "all" && !zone.groups.includes(listGroup)) return false;
      if (!q) return true;
      return `${zone.name} ${zone.description}`.toLowerCase().includes(q);
    });
  }, [listGroup, listQuery, listStatus, listType, sourceZones]);

  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(listPage, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(pageStart, pageStart + pageSize);
  const rangeStart = rows.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + pageSize, rows.length);
  const allChecked = pageRows.length > 0 && pageRows.every((row) => checked.includes(row.id));

  function toggleCheck(id: string) {
    setChecked((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function toggleAll() {
    if (allChecked) setChecked((prev) => prev.filter((id) => !pageRows.some((row) => row.id === id)));
    else setChecked((prev) => [...new Set([...prev, ...pageRows.map((row) => row.id)])]);
  }

  function removeDraftGroup(group: string) {
    setDraftGroups((prev) => prev.filter((item) => item !== group));
  }

  function addDraftGroup(group: string) {
    setDraftGroups((prev) => (prev.includes(group) ? prev : [...prev, group]));
    setGroupMenuOpen(false);
  }

  function openCreate() {
    setCreateOpen(true);
    setStep(0);
    setSaveError("");
  }

  async function saveGeofence() {
    const draft: GeofenceDraft = {
      name: draftName.trim(),
      description: draftDesc.trim(),
      status: draftActive ? "active" : "inactive",
      groups: draftGroups,
      polygon: draftPoints.slice(0, 3),
    };
    setSaving(true);
    setSaveError("");
    try {
      if (mode === "live") {
        await createGeofence(draft);
        setLiveZones(await fetchGeofences());
        notifyGeofencesChanged();
      } else {
        const closed = [...draft.polygon, draft.polygon[0]] as [number, number][];
        setMockZones((current) => [
          {
            id: `local-${Date.now()}`,
            name: draft.name,
            type: "silent",
            status: draft.status,
            groups: draft.groups,
            areaKm2: polygonAreaKm2(draft.polygon),
            triggered24h: 0,
            lastTriggered: null,
            description: draft.description,
            shape: "polygon",
            color: draft.status === "active" ? "#f59e0b" : "#94a3b8",
            polygon: closed,
          },
          ...current,
        ]);
      }
      setDraftName("");
      setDraftDesc("");
      setDraftPoints([]);
      setStep(0);
      setCreateOpen(false);
    } catch {
      setSaveError(mode === "live" ? "Could not save to live data." : "Could not add the geofence.");
    } finally {
      setSaving(false);
    }
  }

  async function removeZone(id: string) {
    if (mode === "live") {
      await deleteGeofence(id);
      setLiveZones(await fetchGeofences());
      notifyGeofencesChanged();
      return;
    }
    setMockZones((current) => current.filter((zone) => zone.id !== id));
  }

  function selectRow(zone: GeofenceZone) {
    setSelectedId(zone.id);
  }

  return (
    <div className={`gfn-page ${createOpen ? "drawer-on" : ""}`}>
      <header className="gfn-head page-title">
        <span className="page-title-icon"><Icon name="shield" size={15} /></span>
        <div>
          <h1>Geofences</h1>
          <p>Create and manage geofences to monitor movements, restrict areas, and receive alerts.</p>
        </div>
        <div className="gfn-head-actions">
          <label className="gfn-search">
            <Icon name="search" size={15} />
            <input
              value={headerQuery}
              onChange={(e) => setHeaderQuery(e.target.value)}
              placeholder="Search location, name..."
            />
          </label>
          <select value={headerGroup} onChange={(e) => setHeaderGroup(e.target.value)}>
            <option value="all">All Groups</option>
            {GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          <button type="button" className="gfn-primary" onClick={openCreate}>
            <Icon name="plus" size={15} />
            Create Geofence
          </button>
        </div>
      </header>

      <section className="gfn-stats">
        <article>
          <span className="gfn-stat-icon blue">
            <Icon name="pin" size={15} />
          </span>
          <div>
            <small>Total Geofences</small>
            <div className="gfn-stat-value">
              <strong>{stats.total}</strong>
            </div>
          </div>
        </article>
        <article>
          <span className="gfn-stat-icon green">
            <Icon name="check" size={15} />
          </span>
          <div>
            <small>Active</small>
            <div className="gfn-stat-value">
              <strong>{stats.active}</strong>
              <em>{stats.activePct}%</em>
            </div>
          </div>
        </article>
        <article>
          <span className="gfn-stat-icon gray">
            <Icon name="pause" size={15} />
          </span>
          <div>
            <small>Inactive</small>
            <div className="gfn-stat-value">
              <strong>{stats.inactive}</strong>
              <em>{stats.inactivePct}%</em>
            </div>
          </div>
        </article>
        <article>
          <span className="gfn-stat-icon red">
            <Icon name="warn" size={15} />
          </span>
          <div>
            <small>Triggered Today</small>
            <div className="gfn-stat-value">
              <strong>{stats.triggeredToday}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="gfn-main">
        <div className="gfn-map-wrap panel">
          <GeofenceMap
            zones={mapZones}
            selectedId={selectedId}
            onSelect={setSelectedId}
            drawing={createOpen && activeStep === 1}
            draftPoints={draftPoints}
            draftColor={TYPE_META[draftType].color}
            onDraftPoint={(point) =>
              setDraftPoints((current) => (current.length >= 3 ? current : [...current, point]))
            }
          />
        </div>

        {createOpen ? (
          <aside className="panel gfn-drawer">
            <header className="gfn-drawer-head">
              <h2>Create Geofence</h2>
              <button type="button" aria-label="Close" onClick={() => setCreateOpen(false)}>
                ×
              </button>
            </header>
            <nav className="gfn-steps" aria-label="Create steps">
              {CREATE_STEPS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className={activeStep === index ? "on" : ""}
                  onClick={() => setStep(index)}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="gfn-form">
              {activeStep === 0 ? (
                <>
                  <label>
                    <span>
                      Name <b>*</b>
                    </span>
                    <input value={draftName} onChange={(e) => setDraftName(e.target.value)} maxLength={80} />
                  </label>

                  <label>
                    <span>Description</span>
                    <textarea
                      value={draftDesc}
                      onChange={(e) => setDraftDesc(e.target.value.slice(0, 200))}
                      rows={3}
                      maxLength={200}
                    />
                    <small>{draftDesc.length}/200</small>
                  </label>

                  <fieldset>
                    <legend>
                      Type <b>*</b>
                    </legend>
                    <div className="gfn-type-grid">
                      {(["silent"] as const).map((type) => (
                        <label key={type} className={`gfn-type-card ${type} ${draftType === type ? "on" : ""}`}>
                          <input
                            type="radio"
                            name="gfn-type"
                            checked={draftType === type}
                            onChange={() => setDraftType(type)}
                          />
                          <span className="gfn-radio" />
                          <span className="gfn-type-ico">
                            <Icon name={TYPE_ICON[type]} size={13} />
                          </span>
                          <strong>{TYPE_META[type].label}</strong>
                          <small>{TYPE_META[type].hint}</small>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="gfn-switch-row">
                    <strong>Status</strong>
                    <div className="gfn-switch-side">
                      <em>{draftActive ? "Active" : "Inactive"}</em>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={draftActive}
                        className={`gfn-switch ${draftActive ? "on" : ""}`}
                        onClick={() => setDraftActive((v) => !v)}
                      >
                        <i />
                      </button>
                    </div>
                  </div>

                  <label className="gfn-groups-field">
                    <span>
                      Assigned Groups <em>(optional)</em>
                    </span>
                    <div className="gfn-tag-input" onClick={() => setGroupMenuOpen((v) => !v)}>
                      {draftGroups.map((group) => (
                        <button key={group} type="button" className="gfn-tag" onClick={(event) => {
                          event.stopPropagation();
                          removeDraftGroup(group);
                        }}>
                          {group} <span aria-hidden="true">×</span>
                        </button>
                      ))}
                      {!draftGroups.length ? <span className="gfn-tag-placeholder">Add group</span> : null}
                      {draftGroups.length ? (
                        <button
                          type="button"
                          className="gfn-tag-clear"
                          aria-label="Clear groups"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDraftGroups([]);
                          }}
                        >
                          ×
                        </button>
                      ) : null}
                    </div>
                    {groupMenuOpen ? (
                      <div className="gfn-tag-menu">
                        {GROUPS.filter((group) => !draftGroups.includes(group)).map((group) => (
                          <button key={group} type="button" onClick={() => addDraftGroup(group)}>
                            {group}
                          </button>
                        ))}
                        {!GROUPS.some((group) => !draftGroups.includes(group)) ? (
                          <span>All groups assigned</span>
                        ) : null}
                      </div>
                    ) : null}
                  </label>
                </>
              ) : (
                <div className="gfn-draw-panel">
                  <p>Press Draw on the map so it stays still, then click three corners. The lines close into a triangle.</p>
                  <ol>
                    {draftPoints.map((point, index) => (
                      <li key={`${point[0]}-${point[1]}`}>
                        Corner {index + 1}: {point[0].toFixed(3)}, {point[1].toFixed(3)}
                      </li>
                    ))}
                    {draftPoints.length < 3 ? (
                      <li className="pending">Waiting for corner {draftPoints.length + 1}</li>
                    ) : null}
                  </ol>
                  <button
                    type="button"
                    className="gfn-draw-clear"
                    disabled={draftPoints.length === 0}
                    onClick={() => setDraftPoints([])}
                  >
                    Clear triangle
                  </button>
                </div>
              )}
            </div>

            <footer>
              {saveError ? <p className="gfn-save-error">{saveError}</p> : null}
              <button type="button" className="gfn-ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="gfn-primary"
                onClick={() => {
                  if (activeStep < CREATE_STEPS.length - 1) setStep((prev) => prev + 1);
                  else void saveGeofence();
                }}
                disabled={
                  saving ||
                  (activeStep === 0 && !draftName.trim()) ||
                  (activeStep === 1 && draftPoints.length < 3)
                }
              >
                {activeStep >= CREATE_STEPS.length - 1 ? (saving ? "Saving..." : "Create") : "Next →"}
              </button>
            </footer>
          </aside>
        ) : null}

        <section className="panel gfn-table-panel">
        <header>
          <h2>Geofence List</h2>
          <div className="gfn-table-tools">
            <label className="gfn-search">
              <Icon name="search" size={14} />
              <input
                value={listQuery}
                onChange={(e) => {
                  setListQuery(e.target.value);
                  setListPage(1);
                }}
                placeholder="Search geofence..."
              />
            </label>
            <select value={listType} onChange={(e) => { setListType(e.target.value as "all" | GeofenceType); setListPage(1); }}>
              <option value="all">All Types</option>
              {GEOFENCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TYPE_META[type].label}
                </option>
              ))}
            </select>
            <select value={listStatus} onChange={(e) => { setListStatus(e.target.value as "all" | GeofenceStatus); setListPage(1); }}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={listGroup} onChange={(e) => { setListGroup(e.target.value); setListPage(1); }}>
              <option value="all">All Groups</option>
              {GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="gfn-table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Select all" />
                </th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Assigned Groups</th>
                <th>Area Size</th>
                <th>Triggered (24h)</th>
                <th>Last Triggered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((zone) => (
                <tr
                  key={zone.id}
                  className={selectedId === zone.id ? "on" : ""}
                  onClick={() => selectRow(zone)}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={checked.includes(zone.id)}
                      onChange={() => toggleCheck(zone.id)}
                      aria-label={`Select ${zone.name}`}
                    />
                  </td>
                  <td className="gfn-name-cell">
                    <strong>{zone.name}</strong>
                    <small>{zone.description}</small>
                  </td>
                  <td>
                    <span className={`gfn-type-pill ${zone.type}`}>
                      <Icon name={TYPE_ICON[zone.type]} size={11} />
                      {TYPE_META[zone.type].label}
                    </span>
                  </td>
                  <td>
                    <span className={`gfn-status-pill ${zone.status}`}>
                      <i />
                      {zone.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{zone.groups.join(", ")}</td>
                  <td>{zone.areaKm2.toFixed(1)} km²</td>
                  <td className={zone.triggered24h ? "hot" : ""}>{zone.triggered24h}</td>
                  <td>{zone.lastTriggered ?? "—"}</td>
                  <td className="gfn-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" aria-label="Edit" onClick={openCreate}>
                      <Icon name="pencil" size={12} />
                    </button>
                    <button type="button" aria-label="Delete" className="danger" onClick={() => void removeZone(zone.id)}>
                      <Icon name="trash" size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={9} className="gfn-empty">
                    {sourceZones.length === 0 ? "No geofences yet." : "No geofences match the current filters."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="cmd-pager">
          <span>
            {rangeStart}–{rangeEnd} of {rows.length}
          </span>
          <div>
            <button type="button" disabled={currentPage === 1} onClick={() => setListPage(currentPage - 1)} aria-label="Previous page">
              <Icon name="chevron" size={14} />
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
              <button key={number} type="button" className={number === currentPage ? "on" : ""} onClick={() => setListPage(number)}>
                {number}
              </button>
            ))}
            <button type="button" disabled={currentPage === pageCount} onClick={() => setListPage(currentPage + 1)} aria-label="Next page">
              <Icon name="chevron" size={14} />
            </button>
          </div>
        </div>
      </section>
      </section>
    </div>
  );
}
