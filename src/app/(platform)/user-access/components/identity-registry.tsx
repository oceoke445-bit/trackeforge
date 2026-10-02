"use client";

import { useEffect, useMemo, useState } from "react";
import Icon from "@/components/ui/icon";

type IdentityType = "Human" | "Service";
type IdentityStatus = "Active" | "Pending" | "Suspended";
type Verification = "Verified" | "Pending" | "Not Required";
type Binding = "Bound" | "No binding";

type Identity = {
  id: string;
  name: string;
  title: string;
  username: string;
  email: string;
  type: IdentityType;
  department: string;
  status: IdentityStatus;
  verification: Verification;
  binding: Binding;
  created: string;
  updated: string;
  sponsor: string;
  risk: boolean;
  riskNote: string;
};

const seed: Identity[] = [
  {
    id: "superadmin",
    name: "Superadmin",
    title: "Superadministrator",
    username: "superadmin",
    email: "superadmin@trackforge.id",
    type: "Human",
    department: "Platform Administration",
    status: "Active",
    verification: "Verified",
    binding: "Bound",
    created: "12 Jan 2024",
    updated: "12 Jan 2024",
    sponsor: "superadmin@trackforge.id",
    risk: false,
    riskNote: "",
  },
  {
    id: "admin",
    name: "Administrator",
    title: "Security Administrator",
    username: "admin",
    email: "admin@trackforge.id",
    type: "Human",
    department: "Security Operations",
    status: "Active",
    verification: "Verified",
    binding: "Bound",
    created: "12 Jan 2024",
    updated: "12 Jan 2024",
    sponsor: "superadmin@trackforge.id",
    risk: false,
    riskNote: "",
  },
  {
    id: "guest",
    name: "Guest User",
    title: "Read-only Guest",
    username: "guest",
    email: "guest@trackforge.id",
    type: "Human",
    department: "General",
    status: "Active",
    verification: "Verified",
    binding: "Bound",
    created: "10 Jan 2024",
    updated: "10 Jan 2024",
    sponsor: "admin@trackforge.id",
    risk: false,
    riskNote: "",
  },
  {
    id: "soc",
    name: "Security Operations",
    title: "soc.operations",
    username: "soc",
    email: "soc@trackforge.id",
    type: "Human",
    department: "Security Operations",
    status: "Active",
    verification: "Verified",
    binding: "Bound",
    created: "09 Jan 2024",
    updated: "09 Jan 2024",
    sponsor: "admin@trackforge.id",
    risk: true,
    riskNote: "Signed in from a new network outside the usual fleet region.",
  },
  {
    id: "analyst",
    name: "Analyst",
    title: "analyst",
    username: "analyst",
    email: "analyst@trackforge.id",
    type: "Human",
    department: "SOC",
    status: "Active",
    verification: "Verified",
    binding: "Bound",
    created: "08 Jan 2024",
    updated: "08 Jan 2024",
    sponsor: "soc@trackforge.id",
    risk: false,
    riskNote: "",
  },
  {
    id: "it",
    name: "Nadia Putri",
    title: "Fleet IT",
    username: "nadia",
    email: "nadia@trackforge.id",
    type: "Human",
    department: "IT",
    status: "Active",
    verification: "Verified",
    binding: "Bound",
    created: "03 Jan 2024",
    updated: "03 Jan 2024",
    sponsor: "admin@trackforge.id",
    risk: false,
    riskNote: "",
  },
];

const pageSize = 6;
const avatarTones = ["blue", "violet", "green", "cyan", "amber", "pink", "slate"];

const emptyDraft = {
  name: "",
  username: "",
  email: "",
  department: "",
  status: "Active" as IdentityStatus,
  verification: "Verified" as Verification,
  binding: "Bound" as Binding,
};

export default function IdentityRegistry() {
  const [people, setPeople] = useState(seed);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [verificationFilter, setVerificationFilter] = useState("All");
  const [bindingFilter, setBindingFilter] = useState("All");
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(seed[0].id);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [formError, setFormError] = useState("");

  const humans = people.filter((person) => person.type === "Human" && person.status === "Active").length;
  const pending = people.filter((person) => person.status === "Pending" || person.verification === "Pending").length;

  const visible = useMemo(() => {
    return people.filter((person) => {
      if (statusFilter !== "All" && person.status !== statusFilter) return false;
      if (verificationFilter !== "All" && person.verification !== verificationFilter) return false;
      if (bindingFilter !== "All" && person.binding !== bindingFilter) return false;
      const haystack = `${person.name} ${person.username} ${person.email} ${person.department}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    });
  }, [people, statusFilter, verificationFilter, bindingFilter, query]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const pageRows = visible.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, verificationFilter, bindingFilter]);

  const selected = people.find((person) => person.id === selectedId) ?? null;

  function resetFilters() {
    setQuery("");
    setStatusFilter("All");
    setVerificationFilter("All");
    setBindingFilter("All");
  }

  function openPerson(id: string) {
    setCreating(false);
    setEditing(false);
    setFormError("");
    setSelectedId(id);
  }

  function saveIdentity() {
    if (draft.name.trim().length < 2 || draft.username.trim().length < 2 || !draft.email.includes("@")) {
      setFormError("Name, username, and a valid email are required.");
      return;
    }
    const id = `id-${Date.now()}`;
    const today = "02 Oct 2026";
    const next: Identity = {
      id,
      name: draft.name.trim(),
      title: "",
      username: draft.username.trim(),
      email: draft.email.trim(),
      type: "Human",
      department: draft.department.trim() || "—",
      status: draft.status,
      verification: draft.verification,
      binding: draft.binding,
      created: today,
      updated: today,
      sponsor: "superadmin@trackforge.id",
      risk: false,
      riskNote: "",
    };
    setPeople((current) => [next, ...current]);
    setPage(1);
    setDraft(emptyDraft);
    setCreating(false);
    setFormError("");
    setSelectedId(id);
  }

  function saveEdits(next: Identity) {
    setPeople((current) => current.map((person) => (person.id === next.id ? next : person)));
    setEditing(false);
  }

  function removeSelected() {
    if (!selected) return;
    const next = people.filter((person) => person.id !== selected.id);
    setPeople(next);
    setSelectedId(next[0]?.id ?? null);
    setEditing(false);
  }

  return (
    <div className={`identity-layout ${selected ? "" : "solo"}`}>
      <section className="identity-main">
        <header className="identity-title">
          <div className="role-heading">
            <span className="role-heading-icon">
              <Icon name="users" size={16} />
            </span>
            <div>
              <h2>Identity Registry</h2>
              <p>Manage all human and service identities across the platform.</p>
            </div>
          </div>
          <div className="identity-title-actions">
            <button type="button" className="identity-ghost" onClick={resetFilters}>
              <Icon name="refresh" size={15} /> Refresh
            </button>
            <button
              type="button"
              className="identity-add"
              onClick={() => {
                setCreating(true);
                setEditing(false);
                setFormError("");
                setDraft(emptyDraft);
              }}
            >
              <Icon name="plus" size={15} /> Add Identity
            </button>
          </div>
        </header>

        <div className="identity-stats">
            <Stat icon="users" tone="blue" value={humans} label="Active Humans" />
            <Stat icon="clock" tone="amber" value={pending} label="Pending" />
          </div>

          <div className="identity-toolbar">
            <label className="identity-search">
              <Icon name="search" size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search identity, username, email, department..."
              />
            </label>
            <Filter label="Status" value={statusFilter} options={["All", "Active", "Pending", "Suspended"]} onChange={setStatusFilter} />
            <Filter label="Verification" value={verificationFilter} options={["All", "Verified", "Pending", "Not Required"]} onChange={setVerificationFilter} />
            <Filter label="Access Binding" value={bindingFilter} options={["All", "Bound", "No binding"]} onChange={setBindingFilter} />
            <div className="identity-view">
              <button type="button" className={layout === "list" ? "on" : ""} aria-label="List view" onClick={() => setLayout("list")}>
                <Icon name="menu" size={15} />
              </button>
              <button type="button" className={layout === "grid" ? "on" : ""} aria-label="Grid view" onClick={() => setLayout("grid")}>
                <Icon name="grid" size={15} />
              </button>
            </div>
          </div>

        <div className="identity-body">
        {visible.length === 0 ? (
          <p className="identity-empty">No identities match these filters.</p>
        ) : layout === "grid" ? (
          <div className="identity-cards">
            {pageRows.map((person) => (
              <button key={person.id} type="button" className={selectedId === person.id ? "selected" : ""} onClick={() => openPerson(person.id)}>
                <span className={`id-avatar ${toneFor(person.id)}`}>{person.name.slice(0, 1)}</span>
                <strong>{person.name}</strong>
                <small>{person.username}</small>
                <small className="identity-card-email">{person.email}</small>
                <span className="identity-card-meta">
                  <Chip kind={person.binding === "Bound" ? "ok" : "muted"}>{person.binding}</Chip>
                  <Chip kind={person.verification === "Verified" ? "info" : "muted"}>{person.verification}</Chip>
                  <Chip kind={person.status === "Active" ? "ok" : "muted"}>{person.status}</Chip>
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
                {pageRows.map((person) => (
                  <tr key={person.id} className={selectedId === person.id ? "selected" : ""} onClick={() => openPerson(person.id)}>
                    <td>
                      <span className="identity-person">
                        <span className={`id-avatar ${toneFor(person.id)}`}>{person.name.slice(0, 1)}</span>
                        <span>
                          <strong>{person.name}</strong>
                          <small>{person.title}</small>
                        </span>
                      </span>
                    </td>
                    <td>{person.department}</td>
                    <td>{person.email}</td>
                    <td>
                      <Chip kind={person.status === "Active" ? "ok" : "muted"} dot>
                        {person.status}
                      </Chip>
                    </td>
                    <td>
                      <Chip kind={person.verification === "Verified" ? "info" : "muted"}>{person.verification}</Chip>
                    </td>
                    <td>
                      <Chip kind={person.binding === "Bound" ? "ok" : "muted"}>{person.binding}</Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>

        <footer className="identity-footer">
            <span>
              Showing {visible.length === 0 ? "0" : `${pageStart + 1}–${pageStart + pageRows.length}`} of {visible.length} identities
            </span>
            <div>
              <button type="button" aria-label="Previous page" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>
                <Icon name="chevron" size={14} />
              </button>
              {Array.from({ length: pageCount }, (_, index) => (
                <button key={index} type="button" className={safePage === index + 1 ? "on" : ""} onClick={() => setPage(index + 1)}>
                  {index + 1}
                </button>
              ))}
              <button type="button" aria-label="Next page" disabled={safePage === pageCount} onClick={() => setPage(safePage + 1)}>
                <Icon name="chevron" size={14} />
              </button>
            </div>
          </footer>
      </section>

      {selected && (
        <aside className="identity-inspector">
          <header>
            <strong>Identity</strong>
            <button type="button" className={editing ? "identity-edit on" : "identity-edit"} onClick={() => setEditing((value) => !value)}>
              <Icon name="pencil" size={13} />
              {editing ? "Cancel" : "Edit"}
            </button>
            <button type="button" className="identity-delete" onClick={removeSelected}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 7h16M9 7V5h6v2M8 7l1 13h6l1-13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Delete
              </button>
            <button
              type="button"
              aria-label="Close inspector"
              onClick={() => {
                setSelectedId(null);
                setEditing(false);
              }}
            >
              ×
            </button>
          </header>

          <>
                <div className="identity-profile">
                  <span className={`id-avatar lg ${toneFor(selected.id)}`}>{selected.name.slice(0, 1)}</span>
                  <div>
                    <strong>{selected.name}</strong>
                    <small>{selected.type} identity</small>
                  </div>
                  <Chip kind={selected.status === "Active" ? "ok" : "muted"} dot>
                    {selected.status}
                  </Chip>
                </div>
                {!editing && (
                  <dl className="identity-fields">
                    <Field icon="users" label="Name" value={selected.name} />
                    <Field icon="menu" label="Username" value={selected.username} />
                    <Field icon="mail" label="Email" value={selected.email} />
                    <Field icon="layers" label="Department" value={selected.department} />
                    <Field icon="shield" label="Verification" value={selected.verification} />
                    <Field icon="signal" label="Status" value={selected.status} />
                    <Field icon="link" label="Access Binding" value={selected.binding} />
                  </dl>
                )}
                {editing && (
                  <form
                    className="identity-form compact"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const data = new FormData(event.currentTarget);
                      saveEdits({
                        ...selected,
                        title: String(data.get("title") || selected.title),
                        department: String(data.get("department") || selected.department),
                        email: String(data.get("email") || selected.email),
                      });
                    }}
                  >
                    <label>
                      Title
                      <input name="title" defaultValue={selected.title} />
                    </label>
                    <label>
                      Department
                      <input name="department" defaultValue={selected.department} />
                    </label>
                    <label>
                      Email
                      <input name="email" defaultValue={selected.email} />
                    </label>
                    <button type="submit" className="identity-add">
                      Save changes
                    </button>
                  </form>
                )}
                <footer>
                  <small>
                    Created {selected.created}
                    <br />
                    Updated {selected.updated}
                  </small>
                </footer>
          </>
        </aside>
      )}
      {creating && (
        <div className="access-modal" onClick={() => setCreating(false)}>
          <form
            className="access-modal-card identity-form"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-identity-title"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              saveIdentity();
            }}
          >
            <header>
              <strong id="new-identity-title">New Identity</strong>
              <button type="button" aria-label="Close" onClick={() => setCreating(false)}>
                ×
              </button>
            </header>
            <label>
              Name
              <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </label>
            <label>
              Username
              <input value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} />
            </label>
            <label>
              Email
              <input value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
            </label>
            <label>
              Department
              <input value={draft.department} onChange={(event) => setDraft({ ...draft, department: event.target.value })} />
            </label>
            <label>
              Status
              <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as IdentityStatus })}>
                <option>Active</option>
                <option>Pending</option>
                <option>Suspended</option>
              </select>
            </label>
            <label>
              Verification
              <select value={draft.verification} onChange={(event) => setDraft({ ...draft, verification: event.target.value as Verification })}>
                <option>Verified</option>
                <option>Pending</option>
                <option>Not Required</option>
              </select>
            </label>
            <label>
              Access Binding
              <select value={draft.binding} onChange={(event) => setDraft({ ...draft, binding: event.target.value as Binding })}>
                <option>Bound</option>
                <option>No binding</option>
              </select>
            </label>
            {formError && <p>{formError}</p>}
            <div className="access-modal-actions">
              <button type="button" className="identity-ghost" onClick={() => setCreating(false)}>
                Cancel
              </button>
              <button type="submit" className="identity-add">
                Save identity
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function toneFor(id: string) {
  const index = Math.abs(id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0));
  return avatarTones[index % avatarTones.length];
}

function Stat({
  icon,
  tone,
  value,
  label,
}: {
  icon: "users" | "cpu" | "clock" | "shield";
  tone: string;
  value: number;
  label: string;
}) {
  return (
    <article className={`identity-stat ${tone}`}>
      <span>
        <Icon name={icon} size={14} />
      </span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </article>
  );
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="identity-filter">
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "All" ? label : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Chip({ kind, dot, children }: { kind: "ok" | "info" | "service" | "muted"; dot?: boolean; children: string }) {
  return (
    <span className={`id-chip ${kind}`}>
      {dot && <i />}
      {children}
    </span>
  );
}

function Field({ icon, label, value }: { icon: "users" | "menu" | "mail" | "layers" | "shield" | "signal" | "link"; label: string; value: string }) {
  return (
    <div>
      <dt>
        <Icon name={icon} size={14} />
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}
