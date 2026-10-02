"use client";

import { Fragment, useState } from "react";
import Icon, { type IconName } from "@/components/ui/icon";
import IdentityRegistry from "@/app/(platform)/user-access/components/identity-registry";

const tabs = [
  { id: "identity", label: "Identity Registry", icon: "users" },
  { id: "roles", label: "Role Model", icon: "shield" },
  { id: "matrix", label: "Permission Matrix", icon: "grid" },
  { id: "binding", label: "Access Binding", icon: "link" },
] as const satisfies ReadonlyArray<{ id: string; label: string; icon: IconName }>;

type TabId = (typeof tabs)[number]["id"];

type DutyTone = "purple" | "blue" | "green" | "red" | "amber" | "teal";

type Role = {
  name: string;
  people: number;
  summary: string;
  duty: string;
  tone: DutyTone;
  icon: IconName;
  baseline: string;
  limit: string;
  scopes: string[];
  permissions: string[];
};

const roles: Role[] = [
  { name: "Superadmin", people: 1, summary: "Full platform authority including emergency access.", duty: "Protected", tone: "amber", icon: "bolt", baseline: "Unrestricted platform control", limit: "Full authority, including emergency access and platform settings.", scopes: ["Platform - platform.manage", "Users - users.manage", "Fleet - fleet.manage"], permissions: ["View live map", "Manage devices", "Edit geofences", "Acknowledge alerts", "Export reports", "Manage users"] },
  { name: "Fleet Admin", people: 2, summary: "Full administrative control of fleets, users, settings, and platform administration.", duty: "Protected", tone: "purple", icon: "shield", baseline: "Full administrative control", limit: "Full administrative access, including user administration, role management, and platform settings.", scopes: ["Fleet - fleet.manage", "Users - users.manage", "Devices - devices.manage", "Alerts - alerts.ack", "Reports - reports.export"], permissions: ["View live map", "Manage devices", "Edit geofences", "Acknowledge alerts", "Export reports", "Manage users"] },
];

const bindings = [
  { person: "Amina Putri", role: "Fleet Admin", scope: "All fleets", assets: "1,248" },
  { person: "Reza Mahendra", role: "Dispatcher", scope: "Jakarta Selatan", assets: "186" },
  { person: "Sari Wibowo", role: "Analyst", scope: "National reports", assets: "1,248" },
  { person: "Lina Kusuma", role: "Field Operator", scope: "Unit B 1234 TF", assets: "1" },
];

export default function UserAccessPage() {
  const [tab, setTab] = useState<TabId>("identity");

  return (
    <div className="access-screen">
      <div className="access-head">
        <span className="access-head-icon">
          <Icon name="users" size={15} />
        </span>
        <h1>User & Access</h1>
        <span className="access-plane">Identity & Access Control Plane</span>
      </div>
      <div className="access-tabs" role="tablist" aria-label="User access sections">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`access-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`access-panel-${item.id}`}
            className={tab === item.id ? "active" : ""}
            onClick={() => setTab(item.id)}
          >
            <Icon name={item.icon} size={14} />
            {item.label}
          </button>
        ))}
      </div>
      {tab === "identity" && (
        <div role="tabpanel" id="access-panel-identity" aria-labelledby="access-tab-identity">
          <IdentityRegistry />
        </div>
      )}
      {tab === "roles" && (
        <div role="tabpanel" id="access-panel-roles" aria-labelledby="access-tab-roles">
          <RoleModel />
        </div>
      )}
      {tab === "binding" && (
        <div role="tabpanel" id="access-panel-binding" aria-labelledby="access-tab-binding">
          <AccessBinding />
        </div>
      )}
      {tab === "matrix" && (
        <div role="tabpanel" id="access-panel-matrix" aria-labelledby="access-tab-matrix">
          <PermissionMatrix />
        </div>
      )}
    </div>
  );
}

function RoleModel() {
  const [items, setItems] = useState(roles);
  const [selectedName, setSelectedName] = useState(roles[0].name);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [draftName, setDraftName] = useState("");
  const [draftDuty, setDraftDuty] = useState("");
  const [draftSummary, setDraftSummary] = useState("");
  const [draftScopes, setDraftScopes] = useState("");
  const [formError, setFormError] = useState("");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [dutyFilter, setDutyFilter] = useState("All");
  const role = items.find((item) => item.name === selectedName) ?? items[0];
  const dutyOptions = ["All", ...Array.from(new Set(items.map((item) => item.duty)))];
  const visible = items.filter((item) => {
    if (dutyFilter !== "All" && item.duty !== dutyFilter) return false;
    const haystack = `${item.name} ${item.duty} ${item.summary}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });
  const pageSize = 7;
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const pageRows = visible.slice(pageStart, pageStart + pageSize);

  function refresh() {
    setItems(roles);
    setSelectedName(roles[0].name);
    setCreating(false);
    setEditing(false);
    setInspectorOpen(true);
    setPage(1);
    setQuery("");
    setDutyFilter("All");
    setDraftName("");
    setDraftDuty("");
    setDraftSummary("");
    setDraftScopes("");
    setFormError("");
  }

  function removeRole() {
    if (!role) return;
    const next = items.filter((item) => item.name !== role.name);
    setItems(next);
    setSelectedName(next[0]?.name ?? "");
    setEditing(false);
    setInspectorOpen(next.length > 0);
  }

  function saveRole() {
    const name = draftName.trim();
    if (name.length < 2) {
      setFormError("Role name is required.");
      return;
    }
    if (items.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
      setFormError("That role already exists.");
      return;
    }
    const scopes = draftScopes
      .split(",")
      .map((scope) => scope.trim())
      .filter(Boolean);
    const next: Role = {
      name,
      people: 0,
      summary: draftSummary.trim(),
      duty: draftDuty.trim(),
      tone: "blue",
      icon: "shield",
      baseline: "",
      limit: "",
      scopes,
      permissions: [],
    };
    setItems((current) => [next, ...current]);
    setSelectedName(name);
    setPage(1);
    setCreating(false);
    setDraftName("");
    setDraftDuty("");
    setDraftSummary("");
    setDraftScopes("");
    setFormError("");
  }

  return (
    <div className={`identity-layout ${inspectorOpen && role ? "" : "solo"}`}>
      <section className="identity-main">
        <header className="identity-title">
          <div className="role-heading">
            <span className="role-heading-icon">
              <Icon name="shield" size={16} />
            </span>
            <div>
              <h2>Role Model</h2>
              <p>Define what each role can do across the platform.</p>
            </div>
          </div>
          <div className="identity-title-actions">
            <button type="button" className="identity-ghost" onClick={refresh}>
              <Icon name="refresh" size={15} /> Refresh
            </button>
            <button
              type="button"
              className="identity-add"
              onClick={() => {
                setCreating(true);
                setEditing(false);
                setFormError("");
              }}
            >
              <Icon name="plus" size={15} /> Add Role
            </button>
          </div>
        </header>
        <div className="identity-stats">
          <article className="identity-stat blue">
            <span>
              <Icon name="users" size={14} />
            </span>
            <div>
              <strong>{items.length}</strong>
              <small>Total Roles</small>
            </div>
          </article>
          <article className="identity-stat amber">
            <span>
              <Icon name="link" size={14} />
            </span>
            <div>
              <strong>{bindings.length}</strong>
              <small>Total Bindings</small>
            </div>
          </article>
        </div>
        <div className="identity-toolbar">
          <label className="identity-search">
            <Icon name="search" size={15} />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search role, duty category, or description..."
            />
          </label>
          <label className="identity-filter">
            <select
              aria-label="Duty Category"
              value={dutyFilter}
              onChange={(event) => {
                setDutyFilter(event.target.value);
                setPage(1);
              }}
            >
              {dutyOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "All" ? "Duty Category" : option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="identity-body">
          {visible.length === 0 ? (
            <p className="identity-empty">No roles match these filters.</p>
          ) : (
          <div className="identity-table-wrap">
            <table className="identity-table role-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Role Name</th>
                  <th>Duty Category</th>
                  <th>Description</th>
                  <th>Bindings</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((item, index) => (
                  <tr
                    key={item.name}
                    className={role && item.name === role.name ? "selected" : ""}
                    onClick={() => {
                      setCreating(false);
                      setEditing(false);
                      setInspectorOpen(true);
                      setSelectedName(item.name);
                    }}
                  >
                    <td>{pageStart + index + 1}</td>
                    <td>
                      <span className="identity-person">
                        <span className={`role-mark ${item.tone}`}>
                          <Icon name={item.icon} size={13} />
                        </span>
                        <strong>{item.name}</strong>
                      </span>
                    </td>
                    <td>
                      {item.duty && <span className={`duty-badge ${item.tone}`}>{item.duty}</span>}
                    </td>
                    <td>
                      <span className="role-desc">{item.summary}</span>
                    </td>
                    <td>{item.people}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
        <footer className="identity-footer">
          <span>
            Showing {visible.length === 0 ? "0" : `${pageStart + 1}–${pageStart + pageRows.length}`} of {visible.length} roles
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

      {inspectorOpen && role && (
      <aside className="identity-inspector">
        <header className="role-inspector-head">
          <strong>Role Model</strong>
          <button type="button" className={editing ? "identity-edit on" : "identity-edit"} onClick={() => setEditing((value) => !value)}>
            <Icon name="pencil" size={13} />
            {editing ? "Cancel" : "Edit"}
          </button>
          <button type="button" className="identity-delete" onClick={removeRole}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M9 7V5h6v2M8 7l1 13h6l1-13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Delete
            </button>
          <button
            type="button"
            aria-label="Close inspector"
            onClick={() => {
              setInspectorOpen(false);
              setEditing(false);
            }}
          >
            ×
          </button>
        </header>
          <>
            <div className="identity-profile">
              <span className={`role-mark ${role.tone}`}>
                <Icon name={role.icon} size={14} />
              </span>
              <div>
                <strong>{role.name}</strong>
                <small>
                  {role.people} {role.people === 1 ? "binding" : "bindings"}
                </small>
              </div>
            </div>
            {editing ? (
          <form
            className="identity-form"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const duty = String(data.get("duty") || role.duty);
              const summary = String(data.get("description") || role.summary);
              setItems((current) => current.map((item) => (item.name === role.name ? { ...item, duty, summary } : item)));
              setEditing(false);
            }}
          >
            <label>
              Duty Category
              <input name="duty" defaultValue={role.duty} />
            </label>
            <label>
              Description
              <input name="description" defaultValue={role.summary} />
            </label>
            <button type="submit" className="identity-add">
              Save changes
            </button>
          </form>
            ) : (
          <dl className="identity-fields">
            <div>
              <dt>
                <Icon name="shield" size={14} />
                Duty Category
              </dt>
              <dd>{role.duty}</dd>
            </div>
            <div>
              <dt>
                <Icon name="file" size={14} />
                Description
              </dt>
              <dd>{role.summary}</dd>
            </div>
            <div>
              <dt>
                <Icon name="layers" size={14} />
                Eligible Scopes
              </dt>
              <dd>
                {role.scopes.map((scope) => (
                  <span key={scope}>{scope}</span>
                ))}
              </dd>
            </div>
            <div>
              <dt>
                <Icon name="link" size={14} />
                Bindings
              </dt>
              <dd>
                {role.people} {role.people === 1 ? "identity" : "identities"}
              </dd>
            </div>
          </dl>
            )}
          </>
      </aside>
      )}
      {creating && (
        <div className="access-modal" onClick={() => setCreating(false)}>
          <form
            className="access-modal-card identity-form"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-role-title"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              saveRole();
            }}
          >
            <header>
              <strong id="new-role-title">New Role</strong>
              <button type="button" aria-label="Close" onClick={() => setCreating(false)}>
                ×
              </button>
            </header>
            <label>
              Role Name
              <input value={draftName} onChange={(event) => setDraftName(event.target.value)} />
            </label>
            <label>
              Duty Category
              <input value={draftDuty} onChange={(event) => setDraftDuty(event.target.value)} />
            </label>
            <label>
              Description
              <input value={draftSummary} onChange={(event) => setDraftSummary(event.target.value)} />
            </label>
            <label>
              Eligible Scopes
              <input value={draftScopes} onChange={(event) => setDraftScopes(event.target.value)} placeholder="Fleet - fleet.manage, Users - users.manage" />
            </label>
            {formError && <p>{formError}</p>}
            <div className="access-modal-actions">
              <button type="button" className="identity-ghost" onClick={() => setCreating(false)}>
                Cancel
              </button>
              <button type="submit" className="identity-add">
                Save role
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

type Grant = "yes" | "no" | "partial";

type MatrixRole = { id: string; label: string; group: "built-in" | "custom" };

const matrixRoles: MatrixRole[] = [
  { id: "admin", label: "ADMIN", group: "built-in" },
  { id: "guest", label: "GUEST", group: "built-in" },
  { id: "operator", label: "operator", group: "custom" },
  { id: "analyst", label: "security analyst", group: "custom" },
  { id: "soc", label: "soc", group: "custom" },
];

const matrixDomains: { name: string; icon: IconName; tone: string }[] = [
  { name: "ALARMS", icon: "bell", tone: "rose" },
  { name: "ASSETS", icon: "box", tone: "blue" },
  { name: "AUDIT", icon: "file", tone: "violet" },
  { name: "COMPLIANCE", icon: "shield", tone: "teal" },
  { name: "DEVICES", icon: "cpu", tone: "blue" },
  { name: "FLEETS", icon: "truck", tone: "amber" },
  { name: "GEOFENCES", icon: "pin", tone: "teal" },
  { name: "IDENTITY", icon: "users", tone: "violet" },
  { name: "MAP", icon: "map", tone: "blue" },
  { name: "REPORTS", icon: "chart", tone: "amber" },
  { name: "ALERTS", icon: "bell", tone: "rose" },
  { name: "SESSIONS", icon: "clock", tone: "teal" },
  { name: "SETTINGS", icon: "settings", tone: "violet" },
  { name: "BINDINGS", icon: "link", tone: "blue" },
  { name: "TELEMETRY", icon: "signal", tone: "teal" },
  { name: "COMMANDS", icon: "bolt", tone: "amber" },
  { name: "NOTIFICATIONS", icon: "bell", tone: "rose" },
  { name: "EXPORTS", icon: "file", tone: "violet" },
  { name: "MAINTENANCE", icon: "settings", tone: "amber" },
  { name: "ROUTES", icon: "route", tone: "blue" },
  { name: "LOGS", icon: "file", tone: "teal" },
  { name: "USERS", icon: "users", tone: "violet" },
  { name: "ROLES", icon: "shield", tone: "blue" },
];

const scriptedGrants: Record<string, Grant>[] = [
  { admin: "yes", guest: "no", operator: "yes", analyst: "yes", soc: "yes" },
  { admin: "yes", guest: "yes", operator: "yes", analyst: "yes", soc: "yes" },
  { admin: "yes", guest: "no", operator: "no", analyst: "no", soc: "yes" },
  { admin: "yes", guest: "yes", operator: "yes", analyst: "yes", soc: "yes" },
  { admin: "yes", guest: "no", operator: "no", analyst: "no", soc: "yes" },
  { admin: "yes", guest: "no", operator: "yes", analyst: "yes", soc: "yes" },
  { admin: "yes", guest: "no", operator: "no", analyst: "no", soc: "yes" },
  { admin: "yes", guest: "yes", operator: "yes", analyst: "yes", soc: "yes" },
];

function grantsFor(index: number): Record<string, Grant> {
  if (scriptedGrants[index]) return scriptedGrants[index];
  const read = index % 2 === 1;
  const domainIndex = Math.floor(index / 2);
  const guest: Grant = read && domainIndex % 3 !== 2 ? "yes" : "no";
  const operator: Grant = read ? "yes" : domainIndex % 4 === 1 ? "partial" : "no";
  const analyst: Grant = read ? (domainIndex % 5 === 0 ? "partial" : "yes") : "no";
  const soc: Grant = !read && domainIndex % 6 === 0 ? "partial" : "yes";
  return { admin: "yes", guest, operator, analyst, soc };
}

type MatrixPermission = {
  id: string;
  domain: string;
  icon: IconName;
  tone: string;
  name: string;
  code: string;
  grants: Record<string, Grant>;
};

const matrixSeed: MatrixPermission[] = matrixDomains.flatMap((domain, domainIndex) => {
  const title = domain.name[0] + domain.name.slice(1).toLowerCase();
  const code = domain.name.toLowerCase();
  return [
    { id: `${code}-modify`, domain: domain.name, icon: domain.icon, tone: domain.tone, name: `Modify ${title}`, code, grants: grantsFor(domainIndex * 2) },
    { id: `${code}-read`, domain: domain.name, icon: domain.icon, tone: domain.tone, name: `Read ${title}`, code: `${code}.read`, grants: grantsFor(domainIndex * 2 + 1) },
  ];
});

function cloneMatrix() {
  return matrixSeed.map((item) => ({ ...item, grants: { ...item.grants } }));
}

function MatrixMark({ grant, small }: { grant: Grant; small?: boolean }) {
  return (
    <span className={`matrix-mark ${grant} ${small ? "small" : ""}`}>
      {grant === "partial" ? (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 12h12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : grant === "no" ? (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m5 12 5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function PermissionMatrix() {
  const [items, setItems] = useState(cloneMatrix);
  const [domain, setDomain] = useState("All");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const roles = matrixRoles.filter((role) => role.label.toLowerCase().includes(query.trim().toLowerCase()));
  const built = roles.filter((role) => role.group === "built-in");
  const custom = roles.filter((role) => role.group === "custom");
  const filtered = items.filter((item) => domain === "All" || item.domain === domain);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(pageStart, pageStart + pageSize);
  const groups: { domain: string; icon: IconName; tone: string; total: number; items: MatrixPermission[] }[] = [];
  pageRows.forEach((item) => {
    const last = groups[groups.length - 1];
    if (!last || last.domain !== item.domain) {
      groups.push({
        domain: item.domain,
        icon: item.icon,
        tone: item.tone,
        total: filtered.filter((entry) => entry.domain === item.domain).length,
        items: [item],
      });
    } else {
      last.items.push(item);
    }
  });

  function cycle(id: string, roleId: string) {
    const order: Grant[] = ["yes", "no", "partial"];
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const next = order[(order.indexOf(item.grants[roleId] as Grant) + 1) % order.length];
        return { ...item, grants: { ...item.grants, [roleId]: next } };
      }),
    );
  }

  function refresh() {
    setItems(cloneMatrix());
    setDomain("All");
    setQuery("");
    setEditing(false);
    setPage(1);
    setPageSize(10);
  }

  return (
    <section className="matrix-card">
      <header className="matrix-head">
        <div className="matrix-heading">
          <span className="matrix-heading-icon">
            <Icon name="shield" size={16} />
          </span>
          <div>
            <h2>Permission & Action Matrix</h2>
            <p>Manage permissions across roles and domains.</p>
          </div>
        </div>
        <div className="matrix-tools">
        <label className="identity-filter">
          <select
            aria-label="Domain"
            value={domain}
            onChange={(event) => {
              setDomain(event.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Domains</option>
            {matrixDomains.map((item) => (
              <option key={item.name}>{item.name}</option>
            ))}
          </select>
        </label>
        <label className="identity-search matrix-search">
          <Icon name="search" size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search roles..."
          />
        </label>
        <button type="button" className={editing ? "matrix-edit on" : "matrix-edit"} onClick={() => setEditing((value) => !value)}>
          <Icon name="pencil" size={14} />
          {editing ? "Exit Edit Mode" : "Enable Edit Mode"}
        </button>
        <div className="matrix-legend">
          <span>Legend:</span>
          <span><MatrixMark grant="yes" small /> Granted</span>
          <span><MatrixMark grant="no" small /> Not granted</span>
          <span><MatrixMark grant="partial" small /> Partial</span>
        </div>
        <button type="button" className="identity-ghost matrix-refresh" onClick={refresh}>
          <Icon name="refresh" size={15} /> Refresh
        </button>
        </div>
      </header>
      <div className="matrix-scroll">
        {roles.length === 0 ? (
          <p className="identity-empty">No roles match this search.</p>
        ) : filtered.length === 0 ? (
          <p className="identity-empty">No permissions in this domain.</p>
        ) : (
          <table className="matrix">
            <thead>
              <tr>
                <th className="matrix-label">
                  <span>
                    <Icon name="file" size={14} />
                    Permissions
                    <em>({filtered.length} permissions)</em>
                  </span>
                </th>
                {built.length > 0 && (
                  <th className="matrix-group built" colSpan={built.length}>
                    <span>
                      <Icon name="users" size={13} /> Built-in ({built.length})
                    </span>
                  </th>
                )}
                {custom.length > 0 && (
                  <th className="matrix-group custom" colSpan={custom.length}>
                    <span>
                      <Icon name="bolt" size={13} /> Custom ({custom.length})
                    </span>
                  </th>
                )}
              </tr>
              <tr>
                <th className="matrix-action">Permission | Action</th>
                {roles.map((role) => (
                  <th key={role.id} className={`matrix-role ${role.id}`}>
                    {role.group === "built-in" ? (
                      <span className={`matrix-pill ${role.id}`}>
                        {role.id === "admin" ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M3 7l4 3 5-6 5 6 4-3-2 11H5L3 7z" />
                          </svg>
                        ) : (
                          <Icon name="users" size={12} />
                        )}
                        {role.label}
                      </span>
                    ) : (
                      role.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group.domain}>
                  <tr className="matrix-section">
                    <td colSpan={1 + roles.length}>
                      <span className="matrix-domain">
                        <i className={group.tone}>
                          <Icon name={group.icon} size={14} />
                        </i>
                        {group.domain}
                        <small>{group.total} permissions</small>
                      </span>
                    </td>
                  </tr>
                  {group.items.map((item) => (
                    <tr key={item.id}>
                      <td className="matrix-perm">
                        <strong>{item.name}</strong>
                        <small>{item.code}</small>
                      </td>
                      {roles.map((role) => (
                        <td key={role.id} className={`matrix-grant ${role.id}`}>
                          {editing ? (
                            <button type="button" className="matrix-hit" aria-label={`${item.name} for ${role.label}`} onClick={() => cycle(item.id, role.id)}>
                              <MatrixMark grant={item.grants[role.id] as Grant} />
                            </button>
                          ) : (
                            <span className="matrix-hit">
                              <MatrixMark grant={item.grants[role.id] as Grant} />
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <footer className="identity-footer">
        <span>
          Showing {filtered.length === 0 ? "0" : `${pageStart + 1}–${Math.min(pageStart + pageSize, filtered.length)}`} of {filtered.length} permissions
        </span>
        <div className="matrix-pager">
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
          <label className="identity-filter">
            <select
              aria-label="Page size"
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
      </footer>
    </section>
  );
}

type AssignmentStatus = "Active" | "Expiring" | "Suspended" | "Revoked";

type Assignment = {
  id: string;
  initial: string;
  avatar: "blue" | "violet" | "green" | "amber" | "cyan" | "slate";
  subject: string;
  handle: string;
  email: string;
  role: string;
  roleTone: DutyTone;
  valid: string;
  status: AssignmentStatus;
  kind: string;
  duty: string;
  scope: string;
  baseline: string;
  assignment: string;
  createdBy: string;
  order: number;
};

const assignmentSeed: Assignment[] = [
  { id: "b1", initial: "S", avatar: "blue", subject: "Superadmin", handle: "superadmin@local", email: "superadmin@local", role: "Superadmin", roleTone: "amber", valid: "Open-ended", status: "Active", kind: "Human Identity", duty: "Executive Oversight", scope: "Global", baseline: "Human-only session; MFA enforced; session-bound elevated tokens; full audit trail.", assignment: "Bootstrap superadmin assignment", createdBy: "Superadmin", order: 6 },
  { id: "b2", initial: "A", avatar: "violet", subject: "Administrator1", handle: "admin@neurogs.tech", email: "admin@neurogs.tech", role: "Admin", roleTone: "purple", valid: "21/9/2026 – 21/9/2027", status: "Active", kind: "Human Identity", duty: "Platform Administration", scope: "Global", baseline: "Administrative session with audited changes.", assignment: "Bootstrap admin assignment", createdBy: "Superadmin", order: 5 },
  { id: "b3", initial: "B", avatar: "green", subject: "bssn", handle: "bssn@nogtus.id", email: "bssn@nogtus.id", role: "Admin", roleTone: "purple", valid: "Open-ended", status: "Active", kind: "Human Identity", duty: "Platform Administration", scope: "Global", baseline: "Administrative session with audited changes.", assignment: "Assign Admin to bssn", createdBy: "Superadmin", order: 4 },
  { id: "b4", initial: "G", avatar: "amber", subject: "Guest User", handle: "guest@neurogs.tech", email: "guest@neurogs.tech", role: "Guest", roleTone: "red", valid: "Open-ended", status: "Active", kind: "Human Identity", duty: "Limited Access", scope: "Global", baseline: "Read-only session. No administrative actions.", assignment: "Bootstrap guest assignment", createdBy: "Superadmin", order: 3 },
  { id: "b5", initial: "T", avatar: "cyan", subject: "test1212", handle: "test@nogtus.tech", email: "test@nogtus.tech", role: "Security Analyst", roleTone: "teal", valid: "29/9/2026 – 29/9/2027", status: "Active", kind: "Human Identity", duty: "Security Review", scope: "Global", baseline: "Review and acknowledge only.", assignment: "Assign Admin to test", createdBy: "Superadmin", order: 2 },
  { id: "b6", initial: "S", avatar: "slate", subject: "SECURITY OPERATIONS", handle: "soc@nogtus.go.id", email: "soc@nogtus.go.id", role: "SOC", roleTone: "blue", valid: "Open-ended", status: "Active", kind: "Human Identity", duty: "Security Operations", scope: "Global", baseline: "Monitor alerts and acknowledge incidents.", assignment: "Assign Admin to SECURITY OPERATIONS", createdBy: "Superadmin", order: 1 },
];

function AccessBinding() {
  const [items, setItems] = useState(assignmentSeed);
  const [selectedId, setSelectedId] = useState(assignmentSeed[0].id);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState("");
  const item = items.find((entry) => entry.id === selectedId) ?? items[0];
  const visible = items
    .filter((entry) => {
      if (statusFilter !== "All" && entry.status !== statusFilter) return false;
      const haystack = `${entry.subject} ${entry.handle} ${entry.email} ${entry.role}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    });
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const pageRows = visible.slice(pageStart, pageStart + pageSize);
  const counts = {
    active: items.filter((entry) => entry.status === "Active").length,
    expiring: items.filter((entry) => entry.status === "Expiring").length,
    suspended: items.filter((entry) => entry.status === "Suspended").length,
    revoked: items.filter((entry) => entry.status === "Revoked").length,
  };

  function refresh() {
    setItems(assignmentSeed);
    setSelectedId(assignmentSeed[0].id);
    setCreating(false);
    setEditing(false);
    setInspectorOpen(true);
    setQuery("");
    setStatusFilter("All");
    setPage(1);
    setFormError("");
  }

  function revoke() {
    if (!item) return;
    setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: "Revoked" } : entry)));
    setEditing(false);
  }

  return (
    <div className={`identity-layout ${inspectorOpen && item ? "" : "solo"}`}>
      <section className="identity-main">
        <header className="identity-title">
          <div className="role-heading">
            <span className="role-heading-icon">
              <Icon name="link" size={16} />
            </span>
            <div>
              <h2>Access Binding & Assignment</h2>
              <p>Manage identity bindings and platform access assignments across roles and users.</p>
            </div>
          </div>
          <div className="identity-title-actions">
            <button type="button" className="identity-ghost" onClick={refresh}>
              <Icon name="refresh" size={15} /> Refresh
            </button>
            <button
              type="button"
              className="identity-add"
              onClick={() => {
                setCreating(true);
                setEditing(false);
                setFormError("");
              }}
            >
              <Icon name="plus" size={15} /> Bind Authority Role
            </button>
          </div>
        </header>
        <div className="identity-stats binding-stats">
          <article className="identity-stat blue">
            <span><Icon name="users" size={14} /></span>
            <div><strong>{items.length}</strong><small>Total Assignments</small></div>
          </article>
          <article className="identity-stat green">
            <span><Icon name="shield" size={14} /></span>
            <div><strong>{counts.active}</strong><small>Active</small></div>
          </article>
          <article className="identity-stat amber">
            <span><Icon name="clock" size={14} /></span>
            <div><strong>{counts.expiring}</strong><small>Expiring (&lt;30d)</small></div>
          </article>
          <article className="identity-stat red">
            <span><Icon name="bell" size={14} /></span>
            <div><strong>{counts.suspended}</strong><small>Suspended</small></div>
          </article>
          <article className="identity-stat rose">
            <span><Icon name="bolt" size={14} /></span>
            <div><strong>{counts.revoked}</strong><small>Revoked</small></div>
          </article>
        </div>
        <div className="identity-toolbar">
          <label className="identity-search">
            <Icon name="search" size={15} />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search subject, role, or email..."
            />
          </label>
          <label className="identity-filter">
            <select
              aria-label="Status"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="All">Status</option>
              <option>Active</option>
              <option>Expiring</option>
              <option>Suspended</option>
              <option>Revoked</option>
            </select>
          </label>
        </div>
        <div className="identity-body">
          {visible.length === 0 ? (
            <p className="identity-empty">No assignments match these filters.</p>
          ) : (
            <div className="identity-table-wrap">
              <table className="identity-table binding-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Subject</th>
                    <th>Role</th>
                    <th>Email / Target</th>
                    <th>Valid Period</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className={item && entry.id === item.id ? "selected" : ""}
                      onClick={() => {
                        setCreating(false);
                        setEditing(false);
                        setInspectorOpen(true);
                        setSelectedId(entry.id);
                      }}
                    >
                      <td>{pageStart + index + 1}</td>
                      <td>
                        <span className="identity-person">
                          <span className={`id-avatar ${entry.avatar}`}>{entry.initial}</span>
                          <span>
                            <strong>{entry.subject}</strong>
                            <small>{entry.handle}</small>
                          </span>
                        </span>
                      </td>
                      <td>
                        <span className={`duty-badge ${entry.roleTone}`}>{entry.role}</span>
                      </td>
                      <td>{entry.email}</td>
                      <td>
                        <span className="binding-period">
                          <Icon name="clock" size={13} />
                          {entry.valid}
                        </span>
                      </td>
                      <td>
                        <span className={`id-chip ${entry.status === "Active" ? "ok" : entry.status === "Revoked" ? "bad" : "warn"}`}>
                          <i />
                          {entry.status}
                        </span>
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
            Showing {visible.length === 0 ? "0" : `${pageStart + 1}–${pageStart + pageRows.length}`} of {visible.length} assignments
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
      {inspectorOpen && item && (
        <aside className="identity-inspector">
          <header>
            <strong>Binding Detail</strong>
            <button type="button" className={editing ? "identity-edit on" : "identity-edit"} onClick={() => setEditing((value) => !value)}>
              <Icon name="pencil" size={13} />
              {editing ? "Cancel" : "Edit"}
            </button>
            <button type="button" className="identity-delete" onClick={revoke}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M7 7l10 10" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                Revoke
              </button>
            <button
              type="button"
              aria-label="Close inspector"
              onClick={() => {
                setInspectorOpen(false);
                setEditing(false);
              }}
            >
              ×
            </button>
          </header>
          {item && (
            <>
              <div className="identity-profile">
                <span className={`id-avatar lg ${item.avatar}`}>{item.initial}</span>
                <div>
                  <strong>{item.subject}</strong>
                  <small>{item.handle}</small>
                </div>
                <span className={`id-chip ${item.status === "Active" ? "ok" : item.status === "Revoked" ? "bad" : "warn"}`}>
                  <i />
                  {item.status}
                </span>
              </div>
              {editing ? (
                <form
                  className="identity-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    const subject = String(data.get("subject") || item.subject).trim();
                    const email = String(data.get("email") || item.email).trim();
                    const role = String(data.get("role") || item.role);
                    const valid = String(data.get("valid") || item.valid);
                    const status = String(data.get("status") || item.status) as AssignmentStatus;
                    setItems((current) =>
                      current.map((entry) =>
                        entry.id === item.id
                          ? { ...entry, subject, handle: email, email, role, valid, status, initial: subject.slice(0, 1).toUpperCase() }
                          : entry,
                      ),
                    );
                    setEditing(false);
                  }}
                >
                  <label>
                    Subject
                    <input name="subject" defaultValue={item.subject} />
                  </label>
                  <label>
                    Email / Target
                    <input name="email" type="email" defaultValue={item.email} />
                  </label>
                  <label>
                    Role
                    <select name="role" defaultValue={item.role}>
                      <option>Superadmin</option>
                      <option>Admin</option>
                      <option>Guest</option>
                      <option>Security Analyst</option>
                      <option>SOC</option>
                    </select>
                  </label>
                  <label>
                    Valid Period
                    <input name="valid" defaultValue={item.valid} />
                  </label>
                  <label>
                    Status
                    <select name="status" defaultValue={item.status}>
                      <option>Active</option>
                      <option>Expiring</option>
                      <option>Suspended</option>
                      <option>Revoked</option>
                    </select>
                  </label>
                  <button type="submit" className="identity-add">Save changes</button>
                </form>
              ) : (
                <dl className="identity-fields">
                  <div>
                    <dt><Icon name="shield" size={14} /> Role</dt>
                    <dd>{item.role}</dd>
                  </div>
                  <div>
                    <dt><Icon name="mail" size={14} /> Email / Target</dt>
                    <dd>{item.email}</dd>
                  </div>
                  <div>
                    <dt><Icon name="clock" size={14} /> Valid Period</dt>
                    <dd>{item.valid}</dd>
                  </div>
                  <div>
                    <dt><Icon name="signal" size={14} /> Status</dt>
                    <dd>{item.status}</dd>
                  </div>
                </dl>
              )}
            </>
          )}
        </aside>
      )}
      {creating && (
        <div className="access-modal" onClick={() => setCreating(false)}>
          <form
            className="access-modal-card identity-form"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-binding-title"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const subject = String(data.get("subject") || "").trim();
              const email = String(data.get("email") || "").trim();
              if (subject.length < 2 || !email.includes("@")) {
                setFormError("Subject and a valid email are required.");
                return;
              }
              const roleName = String(data.get("role") || "Admin");
              const status = String(data.get("status") || "Active") as AssignmentStatus;
              const next: Assignment = {
                id: `b${Date.now()}`,
                initial: subject.slice(0, 1).toUpperCase(),
                avatar: "blue",
                subject,
                handle: email,
                email,
                role: roleName,
                roleTone: "blue",
                valid: String(data.get("valid") || "Open-ended"),
                status,
                kind: "Human Identity",
                duty: "General",
                scope: "Global",
                baseline: "Least privilege until scopes are assigned.",
                assignment: `Assign ${roleName} to ${subject}`,
                createdBy: "Superadmin",
                order: Math.max(...items.map((entry) => entry.order)) + 1,
              };
              setItems((current) => [next, ...current]);
              setSelectedId(next.id);
              setCreating(false);
              setPage(1);
              setFormError("");
            }}
          >
            <header>
              <strong id="new-binding-title">New Binding</strong>
              <button type="button" aria-label="Close" onClick={() => setCreating(false)}>
                ×
              </button>
            </header>
            <label>
              Subject
              <input name="subject" />
            </label>
            <label>
              Role
              <select name="role" defaultValue="Admin">
                <option>Superadmin</option>
                <option>Admin</option>
                <option>Guest</option>
                <option>Security Analyst</option>
                <option>SOC</option>
              </select>
            </label>
            <label>
              Email / Target
              <input name="email" type="email" />
            </label>
            <label>
              Valid Period
              <input name="valid" defaultValue="Open-ended" />
            </label>
            <label>
              Status
              <select name="status" defaultValue="Active">
                <option>Active</option>
                <option>Expiring</option>
                <option>Suspended</option>
                <option>Revoked</option>
              </select>
            </label>
            {formError && <p>{formError}</p>}
            <div className="access-modal-actions">
              <button type="button" className="identity-ghost" onClick={() => setCreating(false)}>
                Cancel
              </button>
              <button type="submit" className="identity-add">
                Save binding
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
