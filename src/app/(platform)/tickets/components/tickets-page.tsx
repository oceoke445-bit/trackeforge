"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon, { type IconName } from "@/components/ui/icon";
import { useTicketFeed } from "@/lib/ticket-feed";
import {
  fetchLiveTickets,
  fetchTicketFilterOptions,
  fetchTicketSummary,
  summaryPriorityCount,
  summaryStatusCount,
  ticketQuery,
  type TicketSummary,
  type TicketTimeRange,
} from "@/lib/tickets-api";
import {
  ALERT_TYPE_ICON,
  TICKETS,
  TICKET_ALERT_TYPES,
  TICKET_GROUPS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketAlertType,
  type TicketItem,
  type TicketPriority,
  type TicketStatus,
} from "./tickets-data";

const RANGES = [
  { id: "all", label: "All time" },
  { id: "30d", label: "30 days" },
] as const;
const PAGE_SIZE = 5;

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function statusClass(status: TicketStatus) {
  return `status-${status.toLowerCase().replace(/\s+/g, "-")}`;
}

function priorityClass(priority: TicketPriority) {
  return priority.toLowerCase();
}

function typeIcon(type: string): IconName {
  return ALERT_TYPE_ICON[type as TicketAlertType] ?? "file";
}

export default function TicketsPage() {
  const router = useRouter();
  const { mode, pending, runId, finish, fail } = useTicketFeed();
  const skipRefresh = useRef(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [statuses, setStatuses] = useState<TicketStatus[]>([...TICKET_STATUSES]);
  const [priorities, setPriorities] = useState<TicketPriority[]>([...TICKET_PRIORITIES]);
  const [alertTypes, setAlertTypes] = useState<string[]>([...TICKET_ALERT_TYPES]);
  const [groups, setGroups] = useState<string[]>([...TICKET_GROUPS]);
  const [availableAlertTypes, setAvailableAlertTypes] = useState<string[]>([...TICKET_ALERT_TYPES]);
  const [availableGroups, setAvailableGroups] = useState<string[]>([...TICKET_GROUPS]);
  const [groupQuery, setGroupQuery] = useState("");
  const [range, setRange] = useState<TicketTimeRange>("all");
  const [page, setPage] = useState(1);
  const [liveItems, setLiveItems] = useState<TicketItem[]>([]);
  const [liveTotal, setLiveTotal] = useState(0);
  const [liveSummary, setLiveSummary] = useState<TicketSummary | null>(null);
  const [liveError, setLiveError] = useState("");

  const catalog = mode === "live" ? liveItems : TICKETS;
  const filtersRef = useRef({ statuses, priorities, alertTypes, groups, range });
  filtersRef.current = { statuses, priorities, alertTypes, groups, range };

  const loadLive = useCallback(async () => {
    const filters = filtersRef.current;
    const options = await fetchTicketFilterOptions();
    const nextTypes = options.alert_types;
    const nextGroups = options.groups;
    setAvailableAlertTypes(nextTypes);
    setAvailableGroups(nextGroups);

    const resolveSelection = (current: string[], available: string[]) => {
      if (!available.length) return current.length ? [] : current;
      const kept = current.filter((item) => available.includes(item));
      const next = kept.length ? kept : [...available];
      if (next.length === current.length && next.every((value, index) => value === current[index])) return current;
      return next;
    };

    let activeTypes = filters.alertTypes;
    let activeGroups = filters.groups;
    setAlertTypes((current) => {
      const next = resolveSelection(current, nextTypes);
      activeTypes = next;
      return next;
    });
    setGroups((current) => {
      const next = resolveSelection(current, nextGroups);
      activeGroups = next;
      return next;
    });

    const params = ticketQuery({
      statuses: filters.statuses,
      priorities: filters.priorities,
      alertTypes: activeTypes,
      groups: activeGroups,
      allStatuses: TICKET_STATUSES.length,
      allPriorities: TICKET_PRIORITIES.length,
      allAlertTypes: Math.max(nextTypes.length, 1),
      allGroups: Math.max(nextGroups.length, 1),
      timeRange: filters.range,
      limit: 100,
      offset: 0,
    });
    const [pageData, summary] = await Promise.all([
      fetchLiveTickets(params),
      fetchTicketSummary(filters.range),
    ]);
    setLiveItems(pageData.items);
    setLiveTotal(pageData.total);
    setLiveSummary(summary);
    setLiveError("");
  }, []);

  useEffect(() => {
    if (!pending) return;
    const run = runId;
    if (pending === "mock") {
      const timer = window.setTimeout(() => {
        setAvailableAlertTypes([...TICKET_ALERT_TYPES]);
        setAvailableGroups([...TICKET_GROUPS]);
        setAlertTypes([...TICKET_ALERT_TYPES]);
        setGroups([...TICKET_GROUPS]);
        setLiveError("");
        finish(run);
      }, 400);
      return () => window.clearTimeout(timer);
    }
    let ignore = false;
    loadLive()
      .then(() => {
        if (ignore) return;
        skipRefresh.current = true;
        finish(run);
      })
      .catch(() => {
        if (!ignore) fail(run);
      });
    return () => {
      ignore = true;
    };
  }, [fail, finish, loadLive, pending, runId]);

  useEffect(() => {
    if (mode !== "live" || pending) return;
    if (skipRefresh.current) {
      skipRefresh.current = false;
      return;
    }
    let ignore = false;
    loadLive()
      .then(() => {
        if (!ignore) setLiveError("");
      })
      .catch(() => {
        if (!ignore) setLiveError("Live tickets are unavailable.");
      });
    return () => {
      ignore = true;
    };
  }, [alertTypes, groups, loadLive, mode, pending, priorities, range, statuses]);

  const filtered = useMemo(() => {
    if (mode === "live") return catalog;
    return catalog.filter(
      (item) =>
        statuses.includes(item.status) &&
        priorities.includes(item.priority) &&
        alertTypes.includes(item.alertType) &&
        groups.includes(item.group),
    );
  }, [alertTypes, catalog, groups, mode, priorities, statuses]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1;
  const to = Math.min(current * PAGE_SIZE, filtered.length);
  const totalCount = mode === "live" ? (liveSummary?.total ?? liveTotal) : TICKETS.length;
  const typeOptions = mode === "live" ? availableAlertTypes : TICKET_ALERT_TYPES;
  const groupOptions = mode === "live" ? availableGroups : TICKET_GROUPS;

  function countStatus(status: TicketStatus) {
    if (mode === "live") return summaryStatusCount(liveSummary, status);
    return TICKETS.filter((item) => item.status === status).length;
  }

  function countPriority(priority: TicketPriority) {
    if (mode === "live") return summaryPriorityCount(liveSummary, priority);
    return TICKETS.filter((item) => item.priority === priority).length;
  }

  function countType(type: string) {
    if (mode === "live") {
      return liveItems.filter((item) => (item.apiAlertType || item.alertType) === type).length;
    }
    return TICKETS.filter((item) => item.alertType === type).length;
  }

  function countGroup(group: string) {
    if (mode === "live") return liveItems.filter((item) => item.group === group).length;
    return TICKETS.filter((item) => item.group === group).length;
  }

  function clearFilters() {
    setStatuses([...TICKET_STATUSES]);
    setPriorities([...TICKET_PRIORITIES]);
    setAlertTypes(mode === "live" ? [...availableAlertTypes] : [...TICKET_ALERT_TYPES]);
    setGroups(mode === "live" ? [...availableGroups] : [...TICKET_GROUPS]);
    setGroupQuery("");
    setRange("all");
    setPage(1);
  }

  function openTicket(item: TicketItem) {
    const target = item.apiId != null ? String(item.apiId) : item.id;
    router.push(`/tickets/${encodeURIComponent(target)}`);
  }

  return (
    <div className={`tkt-list${filtersOpen ? "" : " filters-closed"}`}>
      <header className="page-title">
        <span className="page-title-icon">
          <Icon name="file" size={15} />
        </span>
        <div>
          <h1>Tickets</h1>
          <p>Operational tickets created from alerts</p>
        </div>
        <section className="tkt-list-stats" aria-label="Ticket totals">
          <article>
            <span>
              <Icon name="file" size={13} />
            </span>
            <div>
              <small>Total Ticket</small>
              <strong>{totalCount}</strong>
            </div>
          </article>
        </section>
      </header>

      {liveError ? <p className="tkt-list-error">{liveError}</p> : null}

      <div className="tkt-list-body">
        {filtersOpen ? (
          <aside className="tkt-list-filters">
            <header>
              <h2>
                <Icon name="filter" size={14} />
                Filters
              </h2>
              <button type="button" className="tkt-list-collapse" aria-label="Hide filters" onClick={() => setFiltersOpen(false)}>
                <Icon name="chevron" size={14} />
              </button>
            </header>

            <div className="tkt-list-filter-scroll">
              <section>
                <h3>Status</h3>
                {TICKET_STATUSES.map((item) => (
                  <label key={item}>
                    <input type="checkbox" checked={statuses.includes(item)} onChange={() => { setStatuses((current) => toggle(current, item)); setPage(1); }} />
                    <i className={statusClass(item)} />
                    <span>{item}</span>
                    <b>{countStatus(item)}</b>
                  </label>
                ))}
              </section>

              <section>
                <h3>Priority</h3>
                {TICKET_PRIORITIES.map((item) => (
                  <label key={item}>
                    <input type="checkbox" checked={priorities.includes(item)} onChange={() => { setPriorities((current) => toggle(current, item)); setPage(1); }} />
                    <i className={priorityClass(item)} />
                    <span>{item}</span>
                    <b>{countPriority(item)}</b>
                  </label>
                ))}
              </section>

              <section>
                <h3>Alert Type</h3>
                {typeOptions.length === 0 ? (
                  <p className="tkt-list-filter-empty">No alert types yet</p>
                ) : (
                  typeOptions.map((item) => (
                    <label key={item}>
                      <input type="checkbox" checked={alertTypes.includes(item)} onChange={() => { setAlertTypes((current) => toggle(current, item)); setPage(1); }} />
                      <Icon name={typeIcon(item)} size={13} />
                      <span>{item}</span>
                      <b>{countType(item)}</b>
                    </label>
                  ))
                )}
              </section>

              <section>
                <h3>Group</h3>
                <label className="tkt-list-search">
                  <Icon name="search" size={13} />
                  <input value={groupQuery} onChange={(event) => setGroupQuery(event.target.value)} placeholder="Search group..." />
                </label>
                {groupOptions.length === 0 ? (
                  <p className="tkt-list-filter-empty">No groups yet</p>
                ) : (
                  groupOptions
                    .filter((item) => item.toLowerCase().includes(groupQuery.trim().toLowerCase()))
                    .map((item) => (
                      <label key={item}>
                        <input type="checkbox" checked={groups.includes(item)} onChange={() => { setGroups((current) => toggle(current, item)); setPage(1); }} />
                        <span>{item}</span>
                        <b>{countGroup(item)}</b>
                      </label>
                    ))
                )}
              </section>

              <section>
                <h3>Date Range</h3>
                <label className="tkt-list-range">
                  <Icon name="calendar" size={13} />
                  <select
                    value={range}
                    onChange={(event) => {
                      setRange(event.target.value as TicketTimeRange);
                      setPage(1);
                    }}
                  >
                    {RANGES.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                </label>
              </section>
            </div>

            <div className="tkt-list-clear">
              <button type="button" onClick={clearFilters}>Clear Filters</button>
            </div>
          </aside>
        ) : (
          <button type="button" className="tkt-list-reopen" aria-label="Open filters" onClick={() => setFiltersOpen(true)}>
            <Icon name="filter" size={14} />
          </button>
        )}

        <section className="tkt-list-table-card">
          {rows.length === 0 ? (
            <div className="tkt-list-empty">
              <Icon name="file" size={34} />
              <h2>No tickets found</h2>
              <p>You don&apos;t have any tickets assigned to you or added as collaborator.</p>
              <small>
                Tickets will appear here when an alert is converted to a ticket and you are assigned or added as collaborator, or if you are a commander/superadmin.
              </small>
            </div>
          ) : (
            <>
              <div className="tkt-list-table-wrap">
                <table className="tkt-list-table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Alert Type</th>
                      <th>Title / Description</th>
                      <th>Soldier / Asset</th>
                      <th>Group</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Created At</th>
                      <th>Assignee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item) => (
                      <tr key={item.apiId ?? item.id} onClick={() => openTicket(item)}>
                        <td className="id">{item.id}</td>
                        <td>
                          <span className={`tkt-list-kind ${priorityClass(item.priority)}`}>
                            <Icon name={typeIcon(item.alertType)} size={13} />
                            {item.alertType}
                          </span>
                        </td>
                        <td>
                          <strong>{item.title}</strong>
                          <small>{item.description}</small>
                        </td>
                        <td>{item.soldier}</td>
                        <td>{item.group}</td>
                        <td><span className={`tkt-chip ${priorityClass(item.priority)}`}>{item.priority}</span></td>
                        <td><span className={`tkt-chip ${statusClass(item.status)}`}>{item.status}</span></td>
                        <td>{item.createdAt}</td>
                        <td>
                          {item.assignee ? (
                            <span className="tkt-list-assignee">
                              <span className={`tkt-avatar ${item.assignee.tone}`}>{item.assignee.initials}</span>
                              {item.assignee.name}
                            </span>
                          ) : (
                            <span className="tkt-list-unassigned">Unassigned</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="tkt-list-pager">
                <span>
                  Showing {from}–{to} of {mode === "live" ? liveTotal : filtered.length} tickets
                </span>
                <div>
                  <button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)} aria-label="Previous page">
                    <Icon name="chevron" size={14} />
                  </button>
                  <button type="button" className="on">{current}</button>
                  <button type="button" disabled={current >= pageCount} onClick={() => setPage(current + 1)} aria-label="Next page">
                    <Icon name="chevron" size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
