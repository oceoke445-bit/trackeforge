"use client";

import { Fragment, useEffect, useState, type FormEvent } from "react";
import Icon, { type IconName } from "@/components/ui/icon";
import IdentityRegistry from "@/app/(platform)/user-access/components/identity-registry";
import {
  createBinding,
  createRole,
  deleteRole,
  fetchBindings,
  fetchPermissionCatalog,
  fetchRoleDetail,
  fetchRolePermissions,
  fetchRoleSummary,
  fetchRoles,
  fetchUsers,
  saveRolePermissions,
  updateBindingStatus,
  updateRole,
  type BindingItem,
  type BindingStatus,
  type PermissionItem,
  type RoleItem,
  type RoleSummary,
  type UserItem,
} from "@/lib/access-api";
import { useAccessSession } from "@/lib/access-session";

const tabs = [
  { id: "identity", label: "Identity Registry", icon: "users" },
  { id: "roles", label: "Role Model", icon: "shield" },
  { id: "matrix", label: "Permission Matrix", icon: "grid" },
  { id: "binding", label: "Access Binding", icon: "link" },
] as const satisfies ReadonlyArray<{ id: string; label: string; icon: IconName }>;

type TabId = (typeof tabs)[number]["id"];

const tones = ["purple", "blue", "green", "red", "amber", "teal"] as const;

const domains: Record<string, { icon: IconName; tone: string; label: string }> = {
  overview: { icon: "grid", tone: "blue", label: "Overview" },
  groups: { icon: "layers", tone: "green", label: "Groups" },
  personal: { icon: "user", tone: "teal", label: "Personal" },
  weapons: { icon: "crosshair", tone: "red", label: "Weapons" },
  operations: { icon: "compass", tone: "amber", label: "Operations" },
  geofences: { icon: "shield", tone: "purple", label: "Geofences" },
  explorer: { icon: "search", tone: "blue", label: "Explorer" },
  alerts: { icon: "bell", tone: "red", label: "Alerts" },
  history: { icon: "clock", tone: "amber", label: "History" },
  reports: { icon: "chart", tone: "teal", label: "Reports" },
  lora_mesh: { icon: "signal", tone: "green", label: "LoRa Mesh" },
  gateways: { icon: "server", tone: "blue", label: "Gateways" },
  user_access: { icon: "users", tone: "purple", label: "User Access" },
  activity_log: { icon: "file", tone: "amber", label: "Activity Log" },
  settings: { icon: "settings", tone: "teal", label: "Settings" },
};

const emptyRole = { name: "", duty_category: "", description: "", privilege_narrative: "", least_privilege_baseline: "" };

export default function UserAccessPage() {
  const [tab, setTab] = useState<TabId>("identity");

  return (
    <div className="access-screen">
      <div className="access-head page-title">
        <span className="page-title-icon">
          <Icon name="users" size={18} />
        </span>
        <div>
          <h1>User Access</h1>
          <p>Identities, roles, and the permissions that open each menu.</p>
        </div>
      </div>
      <div className="access-tabs" role="tablist" aria-label="User access sections">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "active" : ""}
            onClick={() => setTab(item.id)}
          >
            <Icon name={item.icon} size={15} />
            {item.label}
          </button>
        ))}
      </div>
      {tab === "identity" && <IdentityRegistry />}
      {tab === "roles" && <RoleModel />}
      {tab === "matrix" && <PermissionMatrix />}
      {tab === "binding" && <AccessBinding />}
    </div>
  );
}

function RoleModel() {
  const [summary, setSummary] = useState<RoleSummary | null>(null);
  const [items, setItems] = useState<RoleItem[]>([]);
  const [codes, setCodes] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [dutyFilter, setDutyFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyRole);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const pageSize = 8;

  useEffect(() => {
    let ignore = false;
    Promise.all([fetchRoleSummary(), fetchRoles()])
      .then(([nextSummary, pageBody]) => {
        if (ignore) return;
        setSummary(nextSummary);
        setItems(pageBody.items);
        setError("");
        setSelectedId((current) => current ?? pageBody.items[0]?.id ?? null);
      })
      .catch((reason: unknown) => {
        if (!ignore) setError(reason instanceof Error ? reason.message : "User access is unavailable");
      });
    return () => {
      ignore = true;
    };
  }, [refresh]);

  const role = items.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (!role) return;
    let ignore = false;
    fetchRoleDetail(role.id)
      .then((detail) => {
        if (!ignore) setCodes(detail.permissions.map((item) => item.code));
      })
      .catch(() => {
        if (!ignore) setCodes([]);
      });
    return () => {
      ignore = true;
    };
  }, [role]);

  const duties = ["All", ...Array.from(new Set(items.map((item) => item.duty_category)))];
  const visible = items.filter((item) => {
    const text = `${item.display_name} ${item.name} ${item.duty_category} ${item.description}`.toLowerCase();
    const matchesQuery = text.includes(query.trim().toLowerCase());
    const matchesDuty = dutyFilter === "All" || item.duty_category === dutyFilter;
    return matchesQuery && matchesDuty;
  });
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const pageRows = visible.slice(pageStart, pageStart + pageSize);

  async function saveNew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const created = await createRole({
        name: draft.name.trim(),
        duty_category: draft.duty_category.trim(),
        description: draft.description.trim(),
        privilege_narrative: draft.privilege_narrative.trim() || undefined,
        least_privilege_baseline: draft.least_privilege_baseline.trim() || undefined,
      });
      setCreating(false);
      setDraft(emptyRole);
      setError("");
      setSelectedId(created.id);
      setOpen(true);
      setRefresh((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create this role.");
    }
  }

  async function saveEdits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!role || role.is_protected) return;
    const data = new FormData(event.currentTarget);
    try {
      await updateRole(role.id, {
        name: String(data.get("name") || role.display_name),
        duty_category: String(data.get("duty_category") || role.duty_category),
        description: String(data.get("description") || role.description),
        privilege_narrative: String(data.get("privilege_narrative") || ""),
        least_privilege_baseline: String(data.get("least_privilege_baseline") || ""),
      });
      setEditing(false);
      setError("");
      setRefresh((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update this role.");
    }
  }

  async function removeRole() {
    if (!role || role.is_protected) return;
    try {
      await deleteRole(role.id);
      setOpen(false);
      setSelectedId(null);
      setError("");
      setRefresh((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete this role.");
    }
  }

  return (
    <div className={`identity-layout ${open && role ? "" : "solo"}`}>
      <section className="identity-main">
        <header className="identity-title">
          <div className="role-heading">
            <span className="role-heading-icon"><Icon name="shield" size={16} /></span>
            <div>
              <h2>Role Model</h2>
              <p>Define what each role can do across the platform.</p>
            </div>
          </div>
          <div className="identity-title-actions">
            <button type="button" className="identity-ghost" onClick={() => setRefresh((value) => value + 1)}><Icon name="refresh" size={15} /> Refresh</button>
            <button type="button" className="identity-add" onClick={() => { setCreating(true); setEditing(false); setError(""); setDraft(emptyRole); }}>
              <Icon name="plus" size={15} /> Add Role
            </button>
          </div>
        </header>
        <div className="identity-stats role-stats">
          <Stat icon="shield" tone="blue" value={summary?.total ?? 0} label="Total Roles" />
          <Stat icon="users" tone="amber" value={summary?.system_roles ?? 0} label="System Roles" />
          <Stat icon="link" tone="teal" value={summary?.custom_roles ?? 0} label="Custom Roles" />
        </div>
        {error && !creating && !editing ? <p className="identity-empty">{error}</p> : null}
        <div className="identity-toolbar">
          <label className="identity-search">
            <Icon name="search" size={15} />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search role, duty category, or description..." />
          </label>
          <label className="identity-filter">
            <select aria-label="Duty Category" value={dutyFilter} onChange={(event) => { setDutyFilter(event.target.value); setPage(1); }}>
              {duties.map((option) => <option key={option} value={option}>{option === "All" ? "Duty Category" : option}</option>)}
            </select>
          </label>
        </div>
        <div className="identity-body">
          {pageRows.length === 0 ? <p className="identity-empty">No roles match these filters.</p> : (
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
                    <tr key={item.id} className={role && item.id === role.id ? "selected" : ""} onClick={() => { setSelectedId(item.id); setOpen(true); setEditing(false); }}>
                      <td>{pageStart + index + 1}</td>
                      <td>
                        <span className="identity-person">
                          <span className={`role-mark ${tones[item.id % tones.length]}`}><Icon name="shield" size={13} /></span>
                          <span><strong>{item.display_name}</strong><small>{item.name}</small></span>
                        </span>
                      </td>
                      <td><span className={`duty-badge ${tones[item.id % tones.length]}`}>{item.duty_category}</span></td>
                      <td><span className="role-desc">{item.description}</span></td>
                      <td>{item.assigned_users}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <Pager total={visible.length} pageStart={pageStart} count={pageRows.length} noun="roles" page={safePage} pageCount={pageCount} onPage={setPage} />
      </section>
      {open && role && (
        <aside className="identity-inspector">
          <header className="role-inspector-head">
            <strong>Role Model</strong>
            {!role.is_protected && (
              <button type="button" className={editing ? "identity-edit on" : "identity-edit"} onClick={() => { setEditing((value) => !value); setError(""); }}>
                <Icon name="pencil" size={13} /> {editing ? "Cancel" : "Edit"}
              </button>
            )}
            {!role.is_protected && (
              <button type="button" className="identity-delete" onClick={() => void removeRole()}>Delete</button>
            )}
            <button type="button" aria-label="Close inspector" onClick={() => { setOpen(false); setEditing(false); }}>×</button>
          </header>
          <div className="identity-profile">
            <span className={`role-mark ${tones[role.id % tones.length]}`}><Icon name="shield" size={14} /></span>
            <div>
              <strong>{role.display_name}</strong>
              <small>{role.name}</small>
            </div>
          </div>
          {editing && !role.is_protected ? (
            <form className="identity-form" onSubmit={(event) => void saveEdits(event)}>
              <label>Name<input name="name" defaultValue={role.display_name} /></label>
              <label>Duty Category<input name="duty_category" defaultValue={role.duty_category} /></label>
              <label>Description<input name="description" defaultValue={role.description} /></label>
              <label>Privilege Narrative<input name="privilege_narrative" defaultValue={role.privilege_narrative || ""} /></label>
              <label>Least Privilege Baseline<input name="least_privilege_baseline" defaultValue={role.least_privilege_baseline || ""} /></label>
              {error ? <p>{error}</p> : null}
              <button type="submit" className="identity-add">Save changes</button>
            </form>
          ) : (
            <dl className="identity-fields">
              <Field icon="shield" label="Duty Category" value={role.duty_category} />
              <Field icon="file" label="Description" value={role.description} />
              <Field icon="file" label="Privilege Narrative" value={role.privilege_narrative || "—"} />
              <Field icon="layers" label="Least Privilege Baseline" value={role.least_privilege_baseline || "—"} />
              <Field icon="link" label="Bindings" value={String(role.assigned_users)} />
              <div>
                <dt><Icon name="grid" size={14} />Permissions</dt>
                <dd>{codes.length === 0 ? "None" : codes.join(", ")}</dd>
              </div>
            </dl>
          )}
        </aside>
      )}
      {creating && (
        <div className="access-modal" onClick={() => setCreating(false)}>
          <form className="access-modal-card identity-form" role="dialog" aria-modal="true" aria-labelledby="new-role-title" onClick={(event) => event.stopPropagation()} onSubmit={(event) => void saveNew(event)}>
            <header>
              <strong id="new-role-title">New Role</strong>
              <button type="button" aria-label="Close" onClick={() => setCreating(false)}>×</button>
            </header>
            <label>Name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
            <label>Duty Category<input value={draft.duty_category} onChange={(event) => setDraft({ ...draft, duty_category: event.target.value })} /></label>
            <label>Description<input value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
            <label>Privilege Narrative<input value={draft.privilege_narrative} onChange={(event) => setDraft({ ...draft, privilege_narrative: event.target.value })} /></label>
            <label>Least Privilege Baseline<input value={draft.least_privilege_baseline} onChange={(event) => setDraft({ ...draft, least_privilege_baseline: event.target.value })} /></label>
            {error ? <p>{error}</p> : null}
            <div className="access-modal-actions">
              <button type="button" className="identity-ghost" onClick={() => setCreating(false)}>Cancel</button>
              <button type="submit" className="identity-add">Save role</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function PermissionMatrix() {
  const { touchAccess } = useAccessSession();
  const [catalog, setCatalog] = useState<PermissionItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [grants, setGrants] = useState<Record<number, number[]>>({});
  const [domain, setDomain] = useState("All");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    Promise.all([fetchPermissionCatalog(), fetchRoles()])
      .then(async ([catalogBody, roleBody]) => {
        const sets = await Promise.all(roleBody.items.map((role) => fetchRolePermissions(role.id)));
        if (ignore) return;
        const next: Record<number, number[]> = {};
        sets.forEach((set) => {
          next[set.role_id] = set.permissions.map((item) => item.id);
        });
        setCatalog(catalogBody.items);
        setRoles(roleBody.items);
        setGrants(next);
        setError("");
      })
      .catch((reason: unknown) => {
        if (!ignore) setError(reason instanceof Error ? reason.message : "User access is unavailable");
      });
    return () => {
      ignore = true;
    };
  }, [refresh]);

  const shownRoles = roles.filter((role) => `${role.display_name} ${role.name}`.toLowerCase().includes(query.trim().toLowerCase()));
  const built = shownRoles.filter((role) => role.is_system);
  const custom = shownRoles.filter((role) => !role.is_system);
  const filtered = catalog.filter((item) => domain === "All" || item.domain === domain);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(pageStart, pageStart + pageSize);
  const groups: { domain: string; items: PermissionItem[] }[] = [];
  pageRows.forEach((item) => {
    const last = groups[groups.length - 1];
    if (!last || last.domain !== item.domain) groups.push({ domain: item.domain, items: [item] });
    else last.items.push(item);
  });

  async function toggle(roleId: number, permission: PermissionItem) {
    if (saving) return;
    const current = grants[roleId] ?? [];
    const on = current.includes(permission.id);
    const read = catalog.find((item) => item.domain === permission.domain && item.action_type === "READ");
    const all = catalog.find((item) => item.domain === permission.domain && item.action_type === "ALL_ACTIONS");
    const ids = new Set(current);
    if (permission.action_type === "ALL_ACTIONS") {
      if (on) {
        ids.delete(permission.id);
        if (read) ids.add(read.id);
      } else {
        ids.add(permission.id);
        if (read) ids.delete(read.id);
      }
    } else if (on) {
      ids.delete(permission.id);
      if (all) ids.delete(all.id);
    } else {
      ids.add(permission.id);
    }
    setSaving(true);
    try {
      const saved = await saveRolePermissions(roleId, [...ids]);
      setGrants((value) => ({ ...value, [roleId]: saved.permissions.map((item) => item.id) }));
      setError("");
      touchAccess();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this permission.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="matrix-card">
      <header className="matrix-head">
        <div className="matrix-heading">
          <span className="matrix-heading-icon"><Icon name="shield" size={16} /></span>
          <div>
            <h2>Permission & Action Matrix</h2>
            <p>Manage permissions across roles and domains.</p>
          </div>
        </div>
        <div className="matrix-tools">
          <label className="identity-filter">
            <select aria-label="Domain" value={domain} onChange={(event) => { setDomain(event.target.value); setPage(1); }}>
              <option value="All">All Domains</option>
              {Object.entries(domains).map(([code, meta]) => <option key={code} value={code}>{meta.label}</option>)}
            </select>
          </label>
          <label className="identity-search matrix-search">
            <Icon name="search" size={15} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roles..." />
          </label>
          <button type="button" className={editing ? "matrix-edit on" : "matrix-edit"} onClick={() => setEditing((value) => !value)}>
            <Icon name="pencil" size={14} />
            {editing ? "Exit Edit Mode" : "Enable Edit Mode"}
          </button>
          <div className="matrix-legend">
            <span>Legend:</span>
            <span><MatrixMark grant="yes" small /> Granted</span>
            <span><MatrixMark grant="no" small /> Not granted</span>
          </div>
          <button type="button" className="identity-ghost matrix-refresh" onClick={() => setRefresh((value) => value + 1)}><Icon name="refresh" size={15} /> Refresh</button>
        </div>
      </header>
      {error ? <p className="identity-empty">{error}</p> : null}
      <div className="matrix-scroll">
        {shownRoles.length === 0 ? <p className="identity-empty">No roles match this search.</p> : filtered.length === 0 ? <p className="identity-empty">No permissions in this domain.</p> : (
          <table className="matrix">
            <thead>
              <tr>
                <th className="matrix-label">
                  <span><Icon name="file" size={14} /> Permissions <em>({filtered.length} permissions)</em></span>
                </th>
                {built.length > 0 && <th className="matrix-group built" colSpan={built.length}><span><Icon name="users" size={13} /> Built-in ({built.length})</span></th>}
                {custom.length > 0 && <th className="matrix-group custom" colSpan={custom.length}><span><Icon name="bolt" size={13} /> Custom ({custom.length})</span></th>}
              </tr>
              <tr>
                <th className="matrix-action">Permission | Action</th>
                {shownRoles.map((role) => (
                  <th key={role.id} className="matrix-role">
                    {role.is_system ? <span className="matrix-pill"><Icon name="users" size={12} />{role.display_name}</span> : role.display_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const meta = domains[group.domain] ?? { icon: "grid" as IconName, tone: "blue", label: group.domain };
                const total = filtered.filter((item) => item.domain === group.domain).length;
                return (
                  <Fragment key={group.domain}>
                    <tr className="matrix-section">
                      <td colSpan={1 + shownRoles.length}>
                        <span className="matrix-domain">
                          <i className={meta.tone}><Icon name={meta.icon} size={14} /></i>
                          {meta.label}
                          <small>{total} permissions</small>
                        </span>
                      </td>
                    </tr>
                    {group.items.map((item) => (
                      <tr key={item.id}>
                        <td className="matrix-perm">
                          <strong>{item.name}</strong>
                          <small>{item.code}</small>
                        </td>
                        {shownRoles.map((role) => {
                          const granted = (grants[role.id] ?? []).includes(item.id);
                          return (
                            <td key={role.id} className="matrix-grant">
                              {editing ? (
                                <button type="button" className="matrix-hit" aria-label={`${item.name} for ${role.display_name}`} disabled={saving} onClick={() => void toggle(role.id, item)}>
                                  <MatrixMark grant={granted ? "yes" : "no"} />
                                </button>
                              ) : (
                                <span className="matrix-hit"><MatrixMark grant={granted ? "yes" : "no"} /></span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <footer className="identity-footer">
        <span>Showing {filtered.length === 0 ? "0" : `${pageStart + 1}–${Math.min(pageStart + pageSize, filtered.length)}`} of {filtered.length} permissions</span>
        <div className="matrix-pager">
          <button type="button" aria-label="Previous page" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}><Icon name="chevron" size={14} /></button>
          {Array.from({ length: pageCount }, (_, index) => (
            <button key={index} type="button" className={safePage === index + 1 ? "on" : ""} onClick={() => setPage(index + 1)}>{index + 1}</button>
          ))}
          <button type="button" aria-label="Next page" disabled={safePage === pageCount} onClick={() => setPage(safePage + 1)}><Icon name="chevron" size={14} /></button>
          <label className="identity-filter">
            <select aria-label="Page size" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
            </select>
          </label>
        </div>
      </footer>
    </section>
  );
}

function AccessBinding() {
  const { touchAccess } = useAccessSession();
  const [items, setItems] = useState<BindingItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const pageSize = 8;

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({ page: "1", limit: "100" });
    Promise.all([fetchBindings(), fetchUsers(params), fetchRoles()])
      .then(([bindings, userPage, rolePage]) => {
        if (ignore) return;
        setItems(bindings.items);
        setUsers(userPage.items);
        setRoles(rolePage.items);
        setError("");
      })
      .catch((reason: unknown) => {
        if (!ignore) setError(reason instanceof Error ? reason.message : "User access is unavailable");
      });
    return () => {
      ignore = true;
    };
  }, [refresh]);

  const people = new Map(users.map((user) => [user.id, user]));
  const roleNames = new Map(roles.map((role) => [role.id, role.display_name]));
  const visible = items.filter((item) => {
    const person = people.get(item.user_id);
    const text = `${person?.name ?? ""} ${person?.email ?? ""} ${item.role ?? ""} ${item.description ?? ""}`.toLowerCase();
    const matchesQuery = text.includes(query.trim().toLowerCase());
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    return matchesQuery && matchesStatus;
  });
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const pageRows = visible.slice(pageStart, pageStart + pageSize);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const activeCount = items.filter((item) => item.status === "ACTIVE").length;
  const suspendedCount = items.filter((item) => item.status === "SUSPENDED").length;
  const revokedCount = items.filter((item) => item.status === "REVOKED").length;

  async function saveNew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const userId = Number(data.get("user_id"));
    const roleId = Number(data.get("role_id"));
    const from = String(data.get("valid_from") || "");
    const until = String(data.get("valid_until") || "");
    try {
      const created = await createBinding({
        user_id: userId,
        role_id: roleId,
        description: String(data.get("description") || "") || undefined,
        valid_from: from || undefined,
        valid_until: until || undefined,
      });
      setCreating(false);
      setError("");
      setSelectedId(created.id);
      setOpen(true);
      setRefresh((value) => value + 1);
      touchAccess();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not bind this role.");
    }
  }

  async function saveEdits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const data = new FormData(event.currentTarget);
    const nextStatus = String(data.get("status") || selected.status) as BindingStatus;
    const nextRole = Number(data.get("role_id") || selected.role_id);
    try {
      if (nextRole !== selected.role_id) {
        if (selected.status === "ACTIVE") await updateBindingStatus(selected.id, "REVOKED");
        const created = await createBinding({
          user_id: selected.user_id,
          role_id: nextRole,
          description: selected.description || undefined,
        });
        if (nextStatus !== "ACTIVE") await updateBindingStatus(created.id, nextStatus);
        setSelectedId(created.id);
      } else if (nextStatus !== selected.status) {
        await updateBindingStatus(selected.id, nextStatus);
      }
      setEditing(false);
      setError("");
      setRefresh((value) => value + 1);
      touchAccess();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update this binding.");
    }
  }

  async function revoke() {
    if (!selected) return;
    try {
      await updateBindingStatus(selected.id, "REVOKED");
      setEditing(false);
      setError("");
      setRefresh((value) => value + 1);
      touchAccess();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not revoke this binding.");
    }
  }

  return (
    <div className={`identity-layout ${open && selected ? "" : "solo"}`}>
      <section className="identity-main">
        <header className="identity-title">
          <div className="role-heading">
            <span className="role-heading-icon"><Icon name="link" size={16} /></span>
            <div>
              <h2>Access Binding</h2>
              <p>One active role for each identity. Revoke before assigning another.</p>
            </div>
          </div>
          <div className="identity-title-actions">
            <button type="button" className="identity-ghost" onClick={() => setRefresh((value) => value + 1)}><Icon name="refresh" size={15} /> Refresh</button>
            <button type="button" className="identity-add" onClick={() => { setCreating(true); setEditing(false); setError(""); }}>
              <Icon name="plus" size={15} /> Add Binding
            </button>
          </div>
        </header>
        <div className="identity-stats binding-stats">
          <Stat icon="link" tone="blue" value={items.length} label="Bindings" />
          <Stat icon="shield" tone="green" value={activeCount} label="Active" />
          <Stat icon="clock" tone="amber" value={suspendedCount} label="Suspended" />
          <Stat icon="bolt" tone="red" value={revokedCount} label="Revoked" />
        </div>
        {error && !creating && !editing ? <p className="identity-empty">{error}</p> : null}
        <div className="identity-toolbar">
          <label className="identity-search">
            <Icon name="search" size={15} />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search identity, role, or description..." />
          </label>
          <label className="identity-filter">
            <select aria-label="Status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
              <option value="All">Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REVOKED">Revoked</option>
            </select>
          </label>
        </div>
        <div className="identity-body">
          {pageRows.length === 0 ? <p className="identity-empty">No assignments match these filters.</p> : (
            <div className="identity-table-wrap">
              <table className="identity-table binding-table">
                <thead>
                  <tr>
                    <th>Identity</th>
                    <th>Role</th>
                    <th>Valid Period</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((entry) => {
                    const person = people.get(entry.user_id);
                    return (
                      <tr key={entry.id} className={selected && entry.id === selected.id ? "selected" : ""} onClick={() => { setSelectedId(entry.id); setOpen(true); setEditing(false); }}>
                        <td>
                          <span className="identity-person">
                            <span className={`id-avatar ${tones[entry.user_id % tones.length]}`}>{(person?.name || "?").slice(0, 1)}</span>
                            <span><strong>{person?.name || `User ${entry.user_id}`}</strong><small>{person?.email}</small></span>
                          </span>
                        </td>
                        <td><span className={`duty-badge ${tones[entry.role_id % tones.length]}`}>{roleNames.get(entry.role_id) || entry.role}</span></td>
                        <td><span className="binding-period">{periodLabel(entry)}</span></td>
                        <td><span className={`id-chip ${chipFor(entry.status)}`}>{titleStatus(entry.status)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <Pager total={visible.length} pageStart={pageStart} count={pageRows.length} noun="bindings" page={safePage} pageCount={pageCount} onPage={setPage} />
      </section>
      {open && selected && (
        <aside className="identity-inspector">
          <header>
            <strong>Access Binding</strong>
            <button type="button" className={editing ? "identity-edit on" : "identity-edit"} onClick={() => { setEditing((value) => !value); setError(""); }}>
              <Icon name="pencil" size={13} /> {editing ? "Cancel" : "Edit"}
            </button>
            <button type="button" className="identity-delete" onClick={() => void revoke()}>Revoke</button>
            <button type="button" aria-label="Close inspector" onClick={() => { setOpen(false); setEditing(false); }}>×</button>
          </header>
          <div className="identity-profile">
            <span className={`id-avatar lg ${tones[selected.user_id % tones.length]}`}>{(people.get(selected.user_id)?.name || "?").slice(0, 1)}</span>
            <div>
              <strong>{people.get(selected.user_id)?.name || `User ${selected.user_id}`}</strong>
              <small>{roleNames.get(selected.role_id) || selected.role}</small>
            </div>
            <span className={`id-chip ${chipFor(selected.status)}`}>{titleStatus(selected.status)}</span>
          </div>
          {editing ? (
            <form className="identity-form" onSubmit={(event) => void saveEdits(event)}>
              <label>
                Role
                <select name="role_id" defaultValue={selected.role_id}>
                  {roles.map((role) => <option key={role.id} value={role.id}>{role.display_name}</option>)}
                </select>
              </label>
              <label>
                Status
                <select name="status" defaultValue={selected.status}>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="REVOKED">Revoked</option>
                </select>
              </label>
              <p>Changing the role revokes this binding, then assigns the new role on the same record.</p>
              {error ? <p>{error}</p> : null}
              <button type="submit" className="identity-add">Save changes</button>
            </form>
          ) : (
            <dl className="identity-fields">
              <Field icon="users" label="Identity" value={people.get(selected.user_id)?.name || "—"} />
              <Field icon="shield" label="Role" value={roleNames.get(selected.role_id) || selected.role || "—"} />
              <Field icon="clock" label="Valid Period" value={periodLabel(selected)} />
              <Field icon="file" label="Description" value={selected.description || "—"} />
              <Field icon="signal" label="User Status" value={titleStatus(selected.user_status)} />
            </dl>
          )}
        </aside>
      )}
      {creating && (
        <div className="access-modal" onClick={() => setCreating(false)}>
          <form className="access-modal-card identity-form" role="dialog" aria-modal="true" aria-labelledby="new-binding-title" onClick={(event) => event.stopPropagation()} onSubmit={(event) => void saveNew(event)}>
            <header>
              <strong id="new-binding-title">New Binding</strong>
              <button type="button" aria-label="Close" onClick={() => setCreating(false)}>×</button>
            </header>
            <label>
              Identity
              <select name="user_id" defaultValue={users[0]?.id}>
                {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
            </label>
            <label>
              Role
              <select name="role_id" defaultValue={roles[0]?.id}>
                {roles.map((role) => <option key={role.id} value={role.id}>{role.display_name}</option>)}
              </select>
            </label>
            <label>Description<input name="description" /></label>
            <label>Valid from (UTC)<input name="valid_from" type="datetime-local" /></label>
            <label>Valid until (UTC)<input name="valid_until" type="datetime-local" /></label>
            {error ? <p>{error}</p> : null}
            <div className="access-modal-actions">
              <button type="button" className="identity-ghost" onClick={() => setCreating(false)}>Cancel</button>
              <button type="submit" className="identity-add">Save binding</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function MatrixMark({ grant, small }: { grant: "yes" | "no"; small?: boolean }) {
  return (
    <span className={`matrix-mark ${grant} ${small ? "small" : ""}`}>
      {grant === "no" ? (
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

function Stat({ icon, tone, value, label }: { icon: IconName; tone: string; value: number; label: string }) {
  return (
    <article className={`identity-stat ${tone}`}>
      <span><Icon name={icon} size={16} /></span>
      <div><strong>{value}</strong><small>{label}</small></div>
    </article>
  );
}

function Field({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div>
      <dt><Icon name={icon} size={14} />{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Pager({ total, pageStart, count, noun, page, pageCount, onPage }: { total: number; pageStart: number; count: number; noun: string; page: number; pageCount: number; onPage: (page: number) => void }) {
  return (
    <footer className="identity-footer">
      <span>Showing {total === 0 ? "0" : `${pageStart + 1}–${pageStart + count}`} of {total} {noun}</span>
      <div>
        <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => onPage(page - 1)}><Icon name="chevron" size={14} /></button>
        {Array.from({ length: pageCount }, (_, index) => (
          <button key={index} type="button" className={page === index + 1 ? "on" : ""} onClick={() => onPage(index + 1)}>{index + 1}</button>
        ))}
        <button type="button" aria-label="Next page" disabled={page === pageCount} onClick={() => onPage(page + 1)}><Icon name="chevron" size={14} /></button>
      </div>
    </footer>
  );
}

function titleStatus(value: string) {
  return value.slice(0, 1) + value.slice(1).toLowerCase();
}

function chipFor(status: BindingStatus) {
  if (status === "ACTIVE") return "ok";
  if (status === "REVOKED") return "bad";
  return "warn";
}

function periodLabel(item: BindingItem) {
  if (!item.valid_from && !item.valid_until) return "Open-ended";
  const from = item.valid_from ? item.valid_from.replace("T", " ").replace("Z", " UTC") : "Open";
  const until = item.valid_until ? item.valid_until.replace("T", " ").replace("Z", " UTC") : "Open";
  return `${from} – ${until}`;
}
