"use client";

import { useMemo, useState } from "react";
import Icon, { type IconName } from "@/components/ui/icon";
import GeofenceMap from "./geofence-map";
import {
  GEOFENCE_TYPES,
  GEOFENCES,
  GROUPS,
  TYPE_META,
  geofenceStats,
  type GeofenceStatus,
  type GeofenceType,
  type GeofenceZone,
} from "./geofence-data";

const CREATE_STEPS = ["Basic Info", "Area", "Rules", "Review"] as const;

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
  const [selectedId, setSelectedId] = useState(GEOFENCES[0]?.id ?? "");
  const [checked, setChecked] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);

  const [draftName, setDraftName] = useState("Restricted Area Alpha");
  const [draftDesc, setDraftDesc] = useState("No entry zone. Enemy territory.");
  const [draftType, setDraftType] = useState<GeofenceType>("restricted");
  const [draftActive, setDraftActive] = useState(true);
  const [draftGroups, setDraftGroups] = useState<string[]>(["Alpha"]);

  const stats = geofenceStats();

  const mapZones = useMemo(() => {
    const q = headerQuery.trim().toLowerCase();
    return GEOFENCES.filter((zone) => {
      if (headerGroup !== "all" && !zone.groups.includes(headerGroup)) return false;
      if (!q) return true;
      return `${zone.name} ${zone.description} ${zone.groups.join(" ")}`.toLowerCase().includes(q);
    });
  }, [headerGroup, headerQuery]);

  const rows = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    return GEOFENCES.filter((zone) => {
      if (listType !== "all" && zone.type !== listType) return false;
      if (listStatus !== "all" && zone.status !== listStatus) return false;
      if (listGroup !== "all" && !zone.groups.includes(listGroup)) return false;
      if (!q) return true;
      return `${zone.name} ${zone.description}`.toLowerCase().includes(q);
    });
  }, [listGroup, listQuery, listStatus, listType]);

  const allChecked = rows.length > 0 && rows.every((row) => checked.includes(row.id));

  function toggleCheck(id: string) {
    setChecked((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  function toggleAll() {
    if (allChecked) setChecked((prev) => prev.filter((id) => !rows.some((row) => row.id === id)));
    else setChecked((prev) => [...new Set([...prev, ...rows.map((row) => row.id)])]);
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
  }

  function selectRow(zone: GeofenceZone) {
    setSelectedId(zone.id);
  }

  return (
    <div className={`gfn-page ${createOpen ? "drawer-on" : ""}`}>
      <header className="gfn-head">
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
            <Icon name="pin" size={18} />
          </span>
          <div>
            <small>Total Geofences</small>
            <div className="gfn-stat-value">
              <strong>{stats.total}</strong>
              <em className="up">↑ 2 new</em>
            </div>
          </div>
        </article>
        <article>
          <span className="gfn-stat-icon green">
            <Icon name="check" size={18} />
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
            <Icon name="pause" size={18} />
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
            <Icon name="warn" size={18} />
          </span>
          <div>
            <small>Triggered Today</small>
            <div className="gfn-stat-value">
              <strong>{stats.triggeredToday}</strong>
              <em className="down">↑ 2 new</em>
            </div>
          </div>
        </article>
      </section>

      <section className="gfn-main">
        <div className="gfn-map-wrap panel">
          <GeofenceMap zones={mapZones} selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        {createOpen ? (
          <aside className="panel gfn-drawer">
            <nav className="gfn-steps" aria-label="Create steps">
              {CREATE_STEPS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className={step === index ? "on" : ""}
                  onClick={() => setStep(index)}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="gfn-form">
              {step === 0 ? (
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
                      {GEOFENCE_TYPES.map((type) => (
                        <label key={type} className={`gfn-type-card ${type} ${draftType === type ? "on" : ""}`}>
                          <input
                            type="radio"
                            name="gfn-type"
                            checked={draftType === type}
                            onChange={() => setDraftType(type)}
                          />
                          <span className="gfn-type-ico">
                            <Icon name={TYPE_ICON[type]} size={16} />
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
                    <div className="gfn-tag-input">
                      {draftGroups.map((group) => (
                        <button key={group} type="button" className="gfn-tag" onClick={() => removeDraftGroup(group)}>
                          {group} <span aria-hidden="true">×</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        className="gfn-tag-add"
                        onClick={() => setGroupMenuOpen((v) => !v)}
                      >
                        + Add
                      </button>
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
                <div className="gfn-step-placeholder">
                  <Icon name="layers" size={18} />
                  <strong>{CREATE_STEPS[step]}</strong>
                  <p>
                    Configure {CREATE_STEPS[step].toLowerCase()} for{" "}
                    {draftName.trim() || "the new geofence"}.
                  </p>
                </div>
              )}
            </div>

            <footer>
              <button type="button" className="gfn-ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="gfn-primary"
                onClick={() => setStep((prev) => Math.min(CREATE_STEPS.length - 1, prev + 1))}
                disabled={step === 0 && !draftName.trim()}
              >
                {step >= CREATE_STEPS.length - 1 ? "Create" : "Next →"}
              </button>
            </footer>
          </aside>
        ) : null}
      </section>

      <section className="panel gfn-table-panel">
        <header>
          <h2>Geofence List</h2>
          <div className="gfn-table-tools">
            <label className="gfn-search">
              <Icon name="search" size={14} />
              <input
                value={listQuery}
                onChange={(e) => setListQuery(e.target.value)}
                placeholder="Search geofence..."
              />
            </label>
            <select value={listType} onChange={(e) => setListType(e.target.value as "all" | GeofenceType)}>
              <option value="all">All Types</option>
              {GEOFENCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TYPE_META[type].label}
                </option>
              ))}
            </select>
            <select value={listStatus} onChange={(e) => setListStatus(e.target.value as "all" | GeofenceStatus)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={listGroup} onChange={(e) => setListGroup(e.target.value)}>
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
              {rows.map((zone) => (
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
                      <Icon name={TYPE_ICON[zone.type]} size={13} />
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
                      <Icon name="pencil" size={14} />
                    </button>
                    <button type="button" aria-label="Duplicate">
                      <Icon name="copy" size={14} />
                    </button>
                    <button type="button" aria-label="Delete" className="danger">
                      <Icon name="trash" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={9} className="gfn-empty">
                    No geofences match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
