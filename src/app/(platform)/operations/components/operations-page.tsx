"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import OperationsMap from "./operations-map";
import { OP_TABS, OPERATIONS, type OpLayers, type OpStatus, type Operation } from "./operations-data";

const STATUSES: Array<"All Status" | OpStatus> = ["All Status", "Active", "Ongoing", "Planning", "Completed", "Cancelled"];

const EMPTY: OpLayers = { groups: true, personnel: true, weapons: true, geofences: true, routes: true };

export default function OperationsPage() {
  const [rows, setRows] = useState(OPERATIONS);
  const [selectedId, setSelectedId] = useState(OPERATIONS[0].id);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("All Status");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tab, setTab] = useState<(typeof OP_TABS)[number]>("Overview");
  const [layers, setLayers] = useState<OpLayers>(EMPTY);
  const [editor, setEditor] = useState<"create" | "edit" | null>(null);
  const [draft, setDraft] = useState({ name: "", status: "Planning" as OpStatus, startAt: "", endAt: "", sector: "", summary: "" });

  const selected = rows.find((item) => item.id === selectedId) ?? rows[0];
  const filtered = useMemo(() => rows.filter((item) => {
    if (status !== "All Status" && item.status !== status) return false;
    const q = query.trim().toLowerCase();
    return !q || `${item.name} ${item.sector}`.toLowerCase().includes(q);
  }), [rows, query, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);

  function openEditor(mode: "create" | "edit") {
    const source = mode === "edit" ? selected : null;
    setDraft({
      name: source?.name ?? "",
      status: source?.status ?? "Planning",
      startAt: source?.startAt ?? "",
      endAt: source?.endAt ?? "",
      sector: source?.sector ?? "",
      summary: source?.summary ?? "",
    });
    setEditor(mode);
  }

  function saveDraft() {
    const name = draft.name.trim() || "New Operation";
    if (editor === "edit" && selected) {
      setRows(rows.map((item) => item.id === selected.id ? { ...item, name, status: draft.status, startAt: draft.startAt || item.startAt, endAt: draft.endAt || item.endAt, sector: draft.sector || item.sector, summary: draft.summary, updatedAt: "03 Oct 2026 14:40" } : item));
    } else {
      const base = OPERATIONS[0];
      const id = `op-${Date.now()}`;
      const dx = 0.05;
      const dy = -0.03;
      const move = ([lng, lat]: [number, number]): [number, number] => [lng + dx, lat + dy];
      const created: Operation = {
        ...base,
        id,
        name,
        status: draft.status,
        sector: draft.sector || "Unassigned sector",
        summary: draft.summary || "New operation.",
        startAt: draft.startAt || "03 Oct 2026 08:00",
        endAt: draft.endAt || "05 Oct 2026 16:00",
        start: (draft.startAt || "03 Oct 2026").slice(0, 11),
        end: (draft.endAt || "05 Oct 2026").slice(0, 11),
        createdAt: "03 Oct 2026 14:40",
        updatedAt: "03 Oct 2026 14:40",
        center: move(base.center),
        ring: base.ring.map(move),
        route: base.route.map(move),
        pins: base.pins.map((pin) => ({ ...pin, lng: pin.lng + dx, lat: pin.lat + dy })),
        people: base.people.map(move),
        weaponPins: base.weaponPins.map(move),
        alertPins: base.alertPins.map(move),
        gatewayPin: move(base.gatewayPin),
      };
      setRows([created, ...rows]);
      setSelectedId(id);
      setPage(1);
    }
    setEditor(null);
    setTab("Overview");
  }

  return (
    <div className="ops-page">
      <header className="page-title">
        <span className="page-title-icon"><Icon name="compass" size={15} /></span>
        <div>
          <h1>Operations</h1>
          <p>Manage and monitor tactical operations</p>
        </div>
      </header>

      <div className="ops-layout">
        <aside className="panel">
          <div className="ops-tools">
            <label><Icon name="search" size={13} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search operations..." /></label>
            <button type="button" className="primary" onClick={() => openEditor("create")}><Icon name="plus" size={13} /> New Operation</button>
          </div>
          <div className="ops-tools">
            <select value={status} onChange={(event) => { setStatus(event.target.value as (typeof STATUSES)[number]); setPage(1); }}>
              {STATUSES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="ops-cards">
            {visible.map((item) => (
              <button key={item.id} type="button" className={item.id === selected?.id ? "on" : ""} onClick={() => { setSelectedId(item.id); setTab("Overview"); }}>
                <img src={item.photo} alt="" style={{ objectPosition: item.focus }} />
                <span>
                  <strong>{item.name}</strong>
                  <em className={item.status.toLowerCase()}>{item.status}</em>
                  <small>{item.sector}</small>
                  <small>{item.start} – {item.end}</small>
                  <i><Icon name="users" size={11} /> {item.groups} Groups <Icon name="user" size={11} /> {item.personnel} Personnel <Icon name="crosshair" size={11} /> {item.weapons} Weapons</i>
                </span>
              </button>
            ))}
            {!visible.length ? <p className="ops-empty">No operations match.</p> : null}
          </div>
          <footer>
            <div className="cmd-pager">
              <button type="button" aria-label="Previous" disabled={current === 1} onClick={() => setPage(current - 1)}><Icon name="chevron" size={14} /></button>
              {Array.from({ length: pages }, (_, index) => (
                <button key={index} type="button" className={current === index + 1 ? "on" : ""} onClick={() => setPage(index + 1)}>{index + 1}</button>
              ))}
              <button type="button" aria-label="Next" disabled={current === pages} onClick={() => setPage(current + 1)}><Icon name="chevron" size={14} /></button>
            </div>
            <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
              <option value={6}>6 / page</option>
              <option value={10}>10 / page</option>
            </select>
          </footer>
        </aside>

        {selected ? (
          <section className="panel">
            <header className="ops-hero">
              <img src={selected.photo} alt="" style={{ objectPosition: selected.focus }} />
              <div>
                <h2>{selected.name} <em className={selected.status.toLowerCase()}>{selected.status}</em></h2>
                <p>{selected.sector} <span>{selected.start} – {selected.end} ({selected.days})</span></p>
                <small>{selected.summary}</small>
              </div>
              <button type="button" className="primary" onClick={() => openEditor("edit")}><Icon name="pencil" size={13} /> Edit Operation</button>
              <button type="button" aria-label="More" onClick={() => openEditor("edit")}><Icon name="more" size={14} /></button>
            </header>
            <nav>
              {OP_TABS.map((item) => (
                <button key={item} type="button" className={tab === item ? "on" : ""} onClick={() => setTab(item)}>{item}</button>
              ))}
            </nav>

            {tab === "Overview" || tab === "Area & Geofence" ? (
              <>
                {tab === "Overview" ? (
                  <div className="ops-stats">
                    <article><span className="blue"><Icon name="users" size={15} /></span><div><strong>{selected.groups}</strong><small>Groups</small><em className="ok">{selected.groupsActive} active</em></div></article>
                    <article><span className="green"><Icon name="user" size={15} /></span><div><strong>{selected.personnel}</strong><small>Personnel</small><em className="ok">{selected.personnelOnline} online</em></div></article>
                    <article><span className="green"><Icon name="crosshair" size={15} /></span><div><strong>{selected.weapons}</strong><small>Weapons</small><em className="ok">{selected.weaponsOnline} online</em></div></article>
                    <article><span className="red"><Icon name="warn" size={15} /></span><div><strong>{selected.alerts}</strong><small>Active Alerts</small><em className="bad">{selected.critical} critical</em></div></article>
                    <article><span className="blue"><Icon name="calendar" size={15} /></span><div><strong>{selected.days}</strong><small>Duration</small><em>{selected.start.slice(0, 2)} - {selected.end}</em></div></article>
                  </div>
                ) : null}
                <div className="ops-map-wrap">
                  <OperationsMap operation={selected} layers={layers} />
                  <div className="ops-layers">
                    {(Object.keys(layers) as (keyof OpLayers)[]).map((key) => (
                      <label key={key}><input type="checkbox" checked={layers[key]} onChange={() => setLayers({ ...layers, [key]: !layers[key] })} /> {key[0].toUpperCase() + key.slice(1)}</label>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            {tab === "Overview" ? (
              <div className="ops-lower">
                <article>
                  <header><h3>Operation Information</h3><button type="button" onClick={() => openEditor("edit")}><Icon name="pencil" size={12} /> Edit</button></header>
                  <dl>
                    <dt>Operation Name</dt><dd>{selected.name}</dd>
                    <dt>Status</dt><dd><em className={selected.status.toLowerCase()}>{selected.status}</em></dd>
                    <dt>Start Date</dt><dd>{selected.startAt}</dd>
                    <dt>End Date</dt><dd>{selected.endAt}</dd>
                    <dt>Area</dt><dd>{selected.sector}</dd>
                    <dt>Description</dt><dd>{selected.summary}</dd>
                    <dt>Created By</dt><dd>{selected.createdBy}</dd>
                    <dt>Created At</dt><dd>{selected.createdAt}</dd>
                    <dt>Last Updated</dt><dd>{selected.updatedAt}</dd>
                  </dl>
                </article>
                <article>
                  <header><h3>Groups ({selected.groupRows.length})</h3><button type="button" onClick={() => setTab("Groups")}>View All</button></header>
                  {selected.groupRows.map((row) => (
                    <button key={row.name} type="button" className="ops-row" onClick={() => setTab("Groups")}>
                      <Icon name="users" size={13} /><strong>{row.name}</strong><small>{row.count} personnel</small><em className={row.status.toLowerCase()}>{row.status}</em><Icon name="chevron" size={12} />
                    </button>
                  ))}
                </article>
                <article>
                  <header><h3>Alerts ({selected.alertRows.length})</h3><button type="button" onClick={() => setTab("Alerts")}>View All</button></header>
                  {selected.alertRows.length ? selected.alertRows.map((row) => (
                    <div key={row.title} className="ops-alert">
                      <Icon name="warn" size={13} />
                      <strong>{row.title}</strong>
                      <small>{row.detail}</small>
                      <em className={row.level.toLowerCase()}>{row.level}</em>
                    </div>
                  )) : <p className="ops-empty">No alerts.</p>}
                </article>
                <article>
                  <header><h3>Communication</h3><button type="button" onClick={() => setTab("Communication")}>View All</button></header>
                  <div className="ops-gw"><Icon name="server" size={14} /><strong>{selected.gateway}</strong><small>{selected.gatewayPlace}</small><em className="online">Online</em></div>
                  <dl>
                    <dt>Last Uplink</dt><dd>{selected.uplink}</dd>
                    <dt>Signal Strength</dt><dd className="ops-bars">{Array.from({ length: 5 }, (_, index) => <i key={index} className={index < selected.signal ? "on" : ""} />)}</dd>
                  </dl>
                </article>
                <article>
                  <header><h3>Recent Timeline</h3><button type="button" onClick={() => setTab("Timeline")}>View All</button></header>
                  {selected.timeline.map((row) => (
                    <div key={row.time + row.text} className="ops-time"><b>{row.time}</b><span>{row.text}</span></div>
                  ))}
                </article>
              </div>
            ) : null}

            {tab === "Groups" || tab === "Personnel" ? (
              <div className="ops-plain">
                {selected.groupRows.map((row) => (
                  <article key={row.name} className="panel">
                    <strong>{row.name}</strong>
                    <small>{row.count} personnel</small>
                    <em className={row.status.toLowerCase()}>{row.status}</em>
                  </article>
                ))}
              </div>
            ) : null}
            {tab === "Communication" ? (
              <article className="ops-plain-card">
                <div className="ops-gw"><Icon name="server" size={14} /><strong>{selected.gateway}</strong><small>{selected.gatewayPlace}</small><em className="online">Online</em></div>
                <dl>
                  <dt>Last Uplink</dt><dd>{selected.uplink}</dd>
                  <dt>Signal Strength</dt><dd className="ops-bars">{Array.from({ length: 5 }, (_, index) => <i key={index} className={index < selected.signal ? "on" : ""} />)}</dd>
                </dl>
              </article>
            ) : null}
            {tab === "Alerts" ? (
              <div className="ops-plain">
                {selected.alertRows.length ? selected.alertRows.map((row) => (
                  <article key={row.title} className="panel ops-alert"><Icon name="warn" size={14} /><strong>{row.title}</strong><small>{row.detail}</small><em className={row.level.toLowerCase()}>{row.level}</em></article>
                )) : <p className="ops-empty">No alerts for this operation.</p>}
              </div>
            ) : null}
            {tab === "Timeline" ? (
              <div className="ops-plain">
                {selected.timeline.map((row) => <article key={row.time + row.text} className="panel ops-time"><b>{row.time}</b><span>{row.text}</span></article>)}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>

      {editor ? (
        <div className="ops-shade" onClick={() => setEditor(null)}>
          <form className="panel" onClick={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); saveDraft(); }}>
            <header><h2>{editor === "edit" ? "Edit Operation" : "New Operation"}</h2><button type="button" aria-label="Close" onClick={() => setEditor(null)}><Icon name="close" size={14} /></button></header>
            <label>Operation Name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
            <label>Status
              <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as OpStatus })}>
                {STATUSES.filter((item) => item !== "All Status").map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>Start Date<input value={draft.startAt} onChange={(event) => setDraft({ ...draft, startAt: event.target.value })} placeholder="03 Oct 2026 08:00" /></label>
            <label>End Date<input value={draft.endAt} onChange={(event) => setDraft({ ...draft, endAt: event.target.value })} placeholder="05 Oct 2026 16:00" /></label>
            <label>Area<input value={draft.sector} onChange={(event) => setDraft({ ...draft, sector: event.target.value })} /></label>
            <label>Description<textarea value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} rows={3} /></label>
            <footer>
              <button type="button" onClick={() => setEditor(null)}>Cancel</button>
              <button type="submit" className="primary">{editor === "edit" ? "Save" : "Create"}</button>
            </footer>
          </form>
        </div>
      ) : null}
    </div>
  );
}
