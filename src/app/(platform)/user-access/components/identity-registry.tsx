"use client";

import { useEffect, useState, type FormEvent } from "react";
import Icon from "@/components/ui/icon";
import {
  createHuman,
  fetchUserPermissions,
  fetchUserSummary,
  fetchUsers,
  updateHuman,
  type UserDetail,
  type UserStatus,
  type UserSummary,
  type Verification,
} from "@/lib/access-api";
import { useAccessSession } from "@/lib/access-session";
import { readSessionUser } from "@/lib/session";

const pageSize = 20;
const avatarTones = ["blue", "violet", "green", "cyan", "amber", "pink", "slate"];

const emptyDraft = { name: "", username: "", email: "", password: "", department: "", title: "" };

function labelStatus(value: string) {
  return value.slice(0, 1) + value.slice(1).toLowerCase();
}

function labelBinding(value: string) {
  return value === "BOUND" ? "Bound" : "No binding";
}

export default function IdentityRegistry() {
  const { setAccessUser, clearAccessUser, revision } = useAccessSession();
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [people, setPeople] = useState<UserDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [verificationFilter, setVerificationFilter] = useState("All");
  const [bindingFilter, setBindingFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    if (query.trim()) params.set("q", query.trim());
    if (statusFilter !== "All") params.set("status", statusFilter);
    if (verificationFilter !== "All") params.set("verification", verificationFilter);
    if (bindingFilter !== "All") params.set("access_binding", bindingFilter);
    if (typeFilter !== "All") params.set("identity_type", typeFilter);
    let ignore = false;
    Promise.all([fetchUserSummary(), fetchUsers(params)])
      .then(([nextSummary, pageBody]) => {
        if (ignore) return;
        setSummary(nextSummary);
        setPeople(pageBody.items);
        setTotal(pageBody.total);
        setLoadError("");
      })
      .catch((error: unknown) => {
        if (!ignore) setLoadError(error instanceof Error ? error.message : "User access is unavailable");
      });
    return () => {
      ignore = true;
    };
  }, [bindingFilter, page, query, refresh, statusFilter, typeFilter, verificationFilter]);

  useEffect(() => {
    if (selectedId == null) {
      const signedIn = readSessionUser();
      if (signedIn) setAccessUser(signedIn.id, signedIn.permissions);
      else clearAccessUser();
      return;
    }
    let ignore = false;
    fetchUserPermissions(selectedId)
      .then((access) => {
        if (!ignore) setAccessUser(access.user_id, access.permissions);
      })
      .catch(() => {
        if (!ignore) setAccessUser(selectedId, []);
      });
    return () => {
      ignore = true;
    };
  }, [clearAccessUser, revision, selectedId, setAccessUser]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const selected = people.find((person) => person.id === selectedId) ?? null;

  function reload() {
    setRefresh((value) => value + 1);
  }

  async function saveIdentity() {
    if (draft.name.trim().length < 2 || draft.username.trim().length < 2 || !draft.email.includes("@")) {
      setFormError("Name, username, and a valid email are required.");
      return;
    }
    if (draft.password.trim().length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    try {
      const created = await createHuman({
        name: draft.name.trim(),
        username: draft.username.trim(),
        email: draft.email.trim(),
        password: draft.password,
        department: draft.department.trim() || undefined,
        title: draft.title.trim() || undefined,
      });
      setCreating(false);
      setDraft(emptyDraft);
      setFormError("");
      setPage(1);
      setSelectedId(created.id);
      const [nextSummary, pageBody] = await Promise.all([
        fetchUserSummary(),
        fetchUsers(new URLSearchParams({ page: "1", limit: String(pageSize) })),
      ]);
      setSummary(nextSummary);
      setPeople(pageBody.items);
      setTotal(pageBody.total);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not create this identity.");
    }
  }

  async function saveEdits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const data = new FormData(event.currentTarget);
    try {
      const updated = await updateHuman(selected.id, {
        name: String(data.get("name") || selected.name),
        username: String(data.get("username") || selected.username || ""),
        email: String(data.get("email") || selected.email || ""),
        department: String(data.get("department") || ""),
        title: String(data.get("title") || ""),
        sponsor: String(data.get("sponsor") || ""),
        verification: String(data.get("verification") || selected.verification) as Verification,
      });
      setPeople((current) => current.map((person) => (person.id === updated.id ? { ...person, ...updated } : person)));
      setEditing(false);
      setFormError("");
      const nextSummary = await fetchUserSummary();
      setSummary(nextSummary);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not update this identity.");
    }
  }

  return (
    <div className={`identity-layout ${selected ? "" : "solo"}`}>
      <section className="identity-main">
        <header className="identity-title">
          <div className="role-heading">
            <span className="role-heading-icon"><Icon name="users" size={16} /></span>
            <div>
              <h2>Identity Registry</h2>
              <p>Manage all human and service identities across the platform.</p>
            </div>
          </div>
          <div className="identity-title-actions">
            <button type="button" className="identity-ghost" onClick={reload}><Icon name="refresh" size={15} /> Refresh</button>
            <button type="button" className="identity-add" onClick={() => { setCreating(true); setEditing(false); setFormError(""); setDraft(emptyDraft); }}>
              <Icon name="plus" size={15} /> Add Identity
            </button>
          </div>
        </header>
        <div className="identity-stats">
          <Stat icon="users" tone="blue" value={summary?.active_humans ?? 0} label="Active Humans" />
          <Stat icon="users" tone="slate" value={summary?.inactive_humans ?? 0} label="Inactive Humans" />
          <Stat icon="clock" tone="amber" value={summary?.pending_verification ?? 0} label="Pending Verification" />
          <Stat icon="cpu" tone="teal" value={summary?.total_services ?? 0} label="Services" />
        </div>
        {loadError ? <p className="identity-empty">{loadError}</p> : null}
        <div className="identity-toolbar">
          <label className="identity-search">
            <Icon name="search" size={15} />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search identity, username, email, department..." />
          </label>
          <Filter label="Type" value={typeFilter} options={[["All", "All"], ["HUMAN", "Human"], ["SERVICE", "Service"]]} onChange={(value) => { setTypeFilter(value); setPage(1); }} />
          <Filter label="Status" value={statusFilter} options={[["All", "All"], ["ACTIVE", "Active"], ["INACTIVE", "Inactive"], ["SUSPENDED", "Suspended"], ["DISABLED", "Disabled"]]} onChange={(value) => { setStatusFilter(value); setPage(1); }} />
          <Filter label="Verification" value={verificationFilter} options={[["All", "All"], ["VERIFIED", "Verified"], ["PENDING", "Pending"]]} onChange={(value) => { setVerificationFilter(value); setPage(1); }} />
          <Filter label="Access Binding" value={bindingFilter} options={[["All", "All"], ["BOUND", "Bound"], ["NO_BINDING", "No binding"]]} onChange={(value) => { setBindingFilter(value); setPage(1); }} />
          <div className="identity-view">
            <button type="button" className={layout === "list" ? "on" : ""} aria-label="List view" onClick={() => setLayout("list")}><Icon name="menu" size={15} /></button>
            <button type="button" className={layout === "grid" ? "on" : ""} aria-label="Grid view" onClick={() => setLayout("grid")}><Icon name="grid" size={15} /></button>
          </div>
        </div>
        <div className="identity-body">
          {people.length === 0 ? <p className="identity-empty">No identities match these filters.</p> : layout === "grid" ? (
            <div className="identity-cards">
              {people.map((person) => (
                <button key={person.id} type="button" className={selectedId === person.id ? "selected" : ""} onClick={() => { setEditing(false); setSelectedId(person.id); }}>
                  <span className={`id-avatar ${toneFor(person.id)}`}>{person.name.slice(0, 1)}</span>
                  <strong>{person.name}</strong>
                  <small>{person.username}</small>
                  <small className="identity-card-email">{person.email}</small>
                  <span className="identity-card-meta">
                    <Chip kind={person.access_binding === "BOUND" ? "ok" : "muted"}>{labelBinding(person.access_binding)}</Chip>
                    <Chip kind={person.verification === "VERIFIED" ? "info" : "muted"}>{labelStatus(person.verification)}</Chip>
                    <Chip kind={statusKind(person.status)}>{labelStatus(person.status)}</Chip>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="identity-table-wrap">
              <table className="identity-table">
                <thead>
                  <tr>
                    <th>Identity</th>
                    <th>Department</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Verification</th>
                    <th>Access Binding</th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((person) => (
                    <tr key={person.id} className={selectedId === person.id ? "selected" : ""} onClick={() => { setEditing(false); setSelectedId(person.id); }}>
                      <td>
                        <span className="identity-person">
                          <span className={`id-avatar ${toneFor(person.id)}`}>{person.name.slice(0, 1)}</span>
                          <span><strong>{person.name}</strong><small>{person.username}</small></span>
                        </span>
                      </td>
                      <td>{person.department || "—"}</td>
                      <td>{person.email}</td>
                      <td><Chip kind={statusKind(person.status)} dot>{labelStatus(person.status)}</Chip></td>
                      <td><Chip kind={person.verification === "VERIFIED" ? "info" : "muted"}>{labelStatus(person.verification)}</Chip></td>
                      <td><Chip kind={person.access_binding === "BOUND" ? "ok" : "muted"}>{labelBinding(person.access_binding)}</Chip></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <footer className="identity-footer">
          <span>Showing {total === 0 ? "0" : `${pageStart + 1}–${pageStart + people.length}`} of {total} identities</span>
          <div>
            <button type="button" aria-label="Previous page" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}><Icon name="chevron" size={14} /></button>
            {Array.from({ length: pageCount }, (_, index) => (
              <button key={index} type="button" className={safePage === index + 1 ? "on" : ""} onClick={() => setPage(index + 1)}>{index + 1}</button>
            ))}
            <button type="button" aria-label="Next page" disabled={safePage === pageCount} onClick={() => setPage(safePage + 1)}><Icon name="chevron" size={14} /></button>
          </div>
        </footer>
      </section>
      {selected && (
        <aside className="identity-inspector">
          <header>
            <strong>Identity</strong>
            <button type="button" className={editing ? "identity-edit on" : "identity-edit"} onClick={() => { setEditing((value) => !value); setFormError(""); }}>
              <Icon name="pencil" size={13} /> {editing ? "Cancel" : "Edit"}
            </button>
            <button type="button" aria-label="Close inspector" onClick={() => { setSelectedId(null); setEditing(false); }}>×</button>
          </header>
          <div className="identity-profile">
            <span className={`id-avatar lg ${toneFor(selected.id)}`}>{selected.name.slice(0, 1)}</span>
            <div>
              <strong>{selected.name}</strong>
              <small>{labelStatus(selected.identity_type)} identity</small>
            </div>
            <Chip kind={statusKind(selected.status)} dot>{labelStatus(selected.status)}</Chip>
          </div>
          {!editing ? (
            <dl className="identity-fields">
              <Field icon="users" label="Name" value={selected.name} />
              <Field icon="menu" label="Username" value={selected.username || "—"} />
              <Field icon="mail" label="Email" value={selected.email || "—"} />
              <Field icon="layers" label="Department" value={selected.department || "—"} />
              <Field icon="shield" label="Title" value={selected.title || "—"} />
              <Field icon="shield" label="Verification" value={labelStatus(selected.verification)} />
              <Field icon="signal" label="Status" value={labelStatus(selected.status)} />
              <Field icon="link" label="Access Binding" value={labelBinding(selected.access_binding)} />
            </dl>
          ) : (
            <form className="identity-form compact" onSubmit={saveEdits}>
              <label>Name<input name="name" defaultValue={selected.name} /></label>
              <label>Username<input name="username" defaultValue={selected.username || ""} /></label>
              <label>Email<input name="email" defaultValue={selected.email || ""} /></label>
              <label>Department<input name="department" defaultValue={selected.department || ""} /></label>
              <label>Title<input name="title" defaultValue={selected.title || ""} /></label>
              <label>Sponsor<input name="sponsor" defaultValue={selected.sponsor || ""} /></label>
              <label>
                Verification
                <select name="verification" defaultValue={selected.verification}>
                  <option value="VERIFIED">Verified</option>
                  <option value="PENDING">Pending</option>
                </select>
              </label>
              {formError ? <p>{formError}</p> : null}
              <button type="submit" className="identity-add">Save changes</button>
            </form>
          )}
        </aside>
      )}
      {creating && (
        <div className="access-modal" onClick={() => setCreating(false)}>
          <form className="access-modal-card identity-form" role="dialog" aria-modal="true" aria-labelledby="new-identity-title" onClick={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); void saveIdentity(); }}>
            <header>
              <strong id="new-identity-title">New Identity</strong>
              <button type="button" aria-label="Close" onClick={() => setCreating(false)}>×</button>
            </header>
            <label>Name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
            <label>Username<input value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} /></label>
            <label>Email<input value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></label>
            <label>Password<input type="password" value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} /></label>
            <label>Department<input value={draft.department} onChange={(event) => setDraft({ ...draft, department: event.target.value })} /></label>
            <label>Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
            <p>A new human is verified and inactive until a role is bound.</p>
            {formError ? <p>{formError}</p> : null}
            <div className="access-modal-actions">
              <button type="button" className="identity-ghost" onClick={() => setCreating(false)}>Cancel</button>
              <button type="submit" className="identity-add">Save identity</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function toneFor(id: number) {
  return avatarTones[id % avatarTones.length];
}

function statusKind(status: UserStatus) {
  if (status === "ACTIVE") return "ok" as const;
  if (status === "SUSPENDED" || status === "DISABLED") return "service" as const;
  return "muted" as const;
}

function Stat({ icon, tone, value, label }: { icon: "users" | "cpu" | "clock" | "shield"; tone: string; value: number; label: string }) {
  return (
    <article className={`identity-stat ${tone}`}>
      <span><Icon name={icon} size={16} /></span>
      <div><strong>{value}</strong><small>{label}</small></div>
    </article>
  );
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return (
    <label className="identity-filter">
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([option, text]) => <option key={option} value={option}>{option === "All" ? label : text}</option>)}
      </select>
    </label>
  );
}

function Chip({ kind, dot, children }: { kind: "ok" | "info" | "service" | "muted"; dot?: boolean; children: string }) {
  return <span className={`id-chip ${kind}`}>{dot && <i />}{children}</span>;
}

function Field({ icon, label, value }: { icon: "users" | "menu" | "mail" | "layers" | "shield" | "signal" | "link"; label: string; value: string }) {
  return (
    <div>
      <dt><Icon name={icon} size={14} />{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
