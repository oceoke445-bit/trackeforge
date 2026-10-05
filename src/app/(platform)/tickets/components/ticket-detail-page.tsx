"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Icon, { type IconName } from "@/components/ui/icon";
import AlertMap from "@/app/(platform)/alerts/components/alert-map";
import type { Severity } from "@/app/(platform)/alerts/components/alerts-data";
import { fetchUsers, type UserItem } from "@/lib/access-api";
import {
  addCollaborator,
  addTask,
  assignTicket,
  closeTicket,
  fetchTicketDetail,
  formatStamp,
  formatTime,
  mapAlertType,
  markWaiting,
  patchTask,
  patchTicket,
  personLabel,
  personTone,
  postTicketUpdate,
  removeCollaborator,
  resolveTicket,
  startWorking,
  TicketApiError,
  toApiPriority,
  toUiPriority,
  toUiStatus,
  type TicketDetail,
} from "@/lib/tickets-api";
import type { TicketPriority, TicketStatus } from "./tickets-data";

type PersonPickerMode = "assign" | "collaborator";

function mapSeverity(value: string | undefined): Severity {
  const key = (value || "").toLowerCase();
  if (key === "warning") return "warning";
  if (key === "info" || key === "low") return "info";
  return "critical";
}

type TaskStatus = "Open" | "In Progress" | "Done";
type Priority = TicketPriority;

type Task = {
  id: string;
  apiId?: number;
  title: string;
  done: boolean;
  assignee: string;
  tone: string;
  priority: Priority;
  status: TaskStatus;
};

type Update = {
  id: string;
  name: string;
  initials: string;
  tone: string;
  time: string;
  body: string;
};

type Person = {
  id?: number;
  name: string;
  role: string;
  initials: string;
  tone: string;
};

const vitals: { label: string; value: string; tone: string; badge: string; icon: IconName }[] = [
  { label: "Heart Rate", value: "142 bpm", tone: "red", badge: "High", icon: "heart" },
  { label: "HRV", value: "28 ms", tone: "blue", badge: "Low", icon: "signal" },
  { label: "Body Temp", value: "38.6 °C", tone: "red", badge: "High", icon: "thermo" },
  { label: "Battery Level", value: "62%", tone: "amber", badge: "Medium", icon: "bolt" },
];

const seedTasks: Task[] = [
  { id: "t1", title: "Dispatch response team", done: false, assignee: "RN", tone: "blue", priority: "High", status: "Open" },
  { id: "t2", title: "Establish radio contact with S-11", done: false, assignee: "DP", tone: "green", priority: "High", status: "In Progress" },
  { id: "t3", title: "Notify medical standby unit", done: false, assignee: "FA", tone: "amber", priority: "Medium", status: "Open" },
];

const seedUpdates: Update[] = [
  {
    id: "u1",
    name: "Rina Novita",
    initials: "RN",
    tone: "blue",
    time: "11:05 WIB",
    body: "Response team has been dispatched. ETA 10 minutes.",
  },
  {
    id: "u2",
    name: "Dimas Pratama",
    initials: "DP",
    tone: "green",
    time: "11:08 WIB",
    body: "Attempting radio contact on channel 3. No response yet.",
  },
  {
    id: "u3",
    name: "Fajar Ardi",
    initials: "FA",
    tone: "amber",
    time: "11:12 WIB",
    body: "Medical standby confirmed. Standing by at rally point Bravo.",
  },
];

const seedCollaborators: Person[] = [
  { name: "Rina Novita", role: "Command Center", initials: "RN", tone: "blue" },
  { name: "Dimas Pratama", role: "Field Ops", initials: "DP", tone: "green" },
  { name: "Fajar Ardi", role: "Intel Team", initials: "FA", tone: "amber" },
];

const responsePlanSeed = `1. Confirm SOS and last known position of S-11.
2. Dispatch nearest response team from Alpha staging.
3. Open radio channel 3 and attempt contact every 60 seconds.
4. Hold medical standby at rally point Bravo.
5. Escalate to Command if no contact within 10 minutes.`;

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

function mapTaskStatus(status: string): TaskStatus {
  if (status === "DONE") return "Done";
  if (status === "IN_PROGRESS") return "In Progress";
  return "Open";
}

function fromDetail(detail: TicketDetail) {
  const alert = detail.source_alert;
  const alertType = mapAlertType(alert.type);
  const tasks: Task[] = detail.tasks.map((task) => {
    const name = personLabel(task.assignee);
    return {
      id: String(task.id),
      apiId: task.id,
      title: task.title,
      done: task.status === "DONE",
      assignee: name ? initialsOf(name) : "—",
      tone: task.assignee ? personTone(task.assignee.id) : "muted",
      priority: toUiPriority(task.priority),
      status: mapTaskStatus(task.status),
    };
  });
  const updates: Update[] = detail.updates
    .slice()
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .map((item) => {
      const name = personLabel(item.author) || "User";
      return {
        id: String(item.id),
        name,
        initials: initialsOf(name),
        tone: personTone(item.author.id),
        time: formatTime(item.created_at),
        body: item.message,
      };
    });
  const collaborators: Person[] = detail.collaborators.map((person) => {
    const name = personLabel(person) || "User";
    return {
      id: person.id,
      name,
      role: person.role || "Collaborator",
      initials: initialsOf(name),
      tone: personTone(person.id),
    };
  });
  return {
    code: detail.ticket_code,
    status: toUiStatus(detail.status),
    apiStatus: detail.status,
    priority: toUiPriority(detail.priority),
    plan: detail.response_plan || "",
    tasks,
    updates,
    collaborators,
    createdAt: formatStamp(detail.created_at),
    updatedAt: formatStamp(detail.updated_at),
    createdBy: personLabel(detail.created_by) || "—",
    assigneeName: personLabel(detail.assignee) || "",
    assigneeRole: detail.assignee?.role || "",
    alertCode: alert.alert_code,
    alertType,
    alertTitle: `${alertType} Signal Received`,
    severity: mapSeverity(alert.severity),
    soldier: alert.soldier_id == null ? "—" : `S-${alert.soldier_id}`,
    group: alert.group_id || "—",
    description: alert.type,
    positionSource: alert.position_source || "—",
    eventTime: formatStamp(alert.event_time),
    lat: alert.latitude ?? -6.2088,
    lng: alert.longitude ?? 106.8456,
  };
}

export default function TicketDetailPage({ ticketId = "TK-20261003-001" }: { ticketId?: string }) {
  const router = useRouter();
  const numericId = /^\d+$/.test(ticketId) ? Number(ticketId) : null;
  const liveMode = numericId != null;

  const [loading, setLoading] = useState(liveMode);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  const [status, setStatus] = useState<TicketStatus>("Open");
  const [apiStatus, setApiStatus] = useState("OPEN");
  const [priority, setPriority] = useState<Priority>("Critical");
  const [code, setCode] = useState(ticketId);
  const [plan, setPlan] = useState(responsePlanSeed);
  const [tasks, setTasks] = useState(seedTasks);
  const [updates, setUpdates] = useState(seedUpdates);
  const [collaborators, setCollaborators] = useState(seedCollaborators);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [createdAt, setCreatedAt] = useState("03 Oct 2026, 11:01 WIB");
  const [updatedAt, setUpdatedAt] = useState("03 Oct 2026, 11:12 WIB");
  const [createdBy, setCreatedBy] = useState("Superadmin");
  const [assigneeName, setAssigneeName] = useState("");
  const [assigneeRole, setAssigneeRole] = useState("");
  const [alertCode, setAlertCode] = useState("AL-20261003-011");
  const [alertType, setAlertType] = useState("SOS");
  const [alertTitle, setAlertTitle] = useState("SOS Signal Received");
  const [severity, setSeverity] = useState<Severity>("critical");
  const [soldier, setSoldier] = useState("S-11");
  const [group, setGroup] = useState("Alpha");
  const [description, setDescription] = useState("SOS button pressed");
  const [positionSource, setPositionSource] = useState("GNSS ±12 m");
  const [eventTime, setEventTime] = useState("03 Oct 2026 11:01 WIB");
  const [lat, setLat] = useState(-6.2088);
  const [lng, setLng] = useState(106.8456);
  const [pickerMode, setPickerMode] = useState<PersonPickerMode | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerUsers, setPickerUsers] = useState<UserItem[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState("");
  const [pickerSelected, setPickerSelected] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("Medium");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskError, setTaskError] = useState("");
  const [teamPeople, setTeamPeople] = useState<{ id: number; name: string }[]>([]);

  function applyDetail(next: TicketDetail) {
    const mapped = fromDetail(next);
    const people = new Map<number, string>();
    people.set(next.created_by.id, personLabel(next.created_by) || `User ${next.created_by.id}`);
    if (next.assignee) people.set(next.assignee.id, personLabel(next.assignee) || `User ${next.assignee.id}`);
    for (const person of next.collaborators) {
      people.set(person.id, personLabel(person) || `User ${person.id}`);
    }
    setTeamPeople([...people.entries()].map(([id, name]) => ({ id, name })));
    setCode(mapped.code);
    setStatus(mapped.status);
    setApiStatus(mapped.apiStatus);
    setPriority(mapped.priority);
    setPlan(mapped.plan);
    setTasks(mapped.tasks);
    setUpdates(mapped.updates);
    setCollaborators(mapped.collaborators);
    setCreatedAt(mapped.createdAt);
    setUpdatedAt(mapped.updatedAt);
    setCreatedBy(mapped.createdBy);
    setAssigneeName(mapped.assigneeName);
    setAssigneeRole(mapped.assigneeRole);
    setAlertCode(mapped.alertCode);
    setAlertType(mapped.alertType);
    setAlertTitle(mapped.alertTitle);
    setSeverity(mapped.severity);
    setSoldier(mapped.soldier);
    setGroup(mapped.group);
    setDescription(next.source_alert.type === "SOS" ? "SOS button pressed" : mapped.alertTitle);
    setPositionSource(mapped.positionSource);
    setEventTime(mapped.eventTime);
    setLat(mapped.lat);
    setLng(mapped.lng);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!liveMode || numericId == null) return;
    let ignore = false;
    setLoading(true);
    setError("");
    fetchTicketDetail(numericId)
      .then((next) => {
        if (!ignore) {
          applyDetail(next);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (ignore) return;
        const message = err instanceof TicketApiError && err.status === 404
          ? "Ticket not found."
          : err instanceof Error
            ? err.message
            : "Could not load ticket.";
        setError(message);
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [liveMode, numericId]);

  useEffect(() => {
    if (!pickerMode) return;
    let ignore = false;
    setPickerLoading(true);
    setPickerError("");
    setPickerSelected(null);
    setPickerQuery("");
    fetchUsers(new URLSearchParams({ page: "1", limit: "100", status: "ACTIVE" }))
      .then((page) => {
        if (ignore) return;
        const eligible = page.items.filter(
          (user) => user.status === "ACTIVE" && user.verification === "VERIFIED" && user.access_binding === "BOUND",
        );
        setPickerUsers(eligible.length ? eligible : page.items.filter((user) => user.status === "ACTIVE"));
        setPickerLoading(false);
      })
      .catch(() => {
        if (ignore) return;
        setPickerUsers([]);
        setPickerLoading(false);
        setPickerError("Could not load users.");
      });
    return () => {
      ignore = true;
    };
  }, [pickerMode]);

  const filteredPickerUsers = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return pickerUsers;
    return pickerUsers.filter((user) => {
      const hay = `${user.name} ${user.username || ""} ${user.email || ""} ${user.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [pickerQuery, pickerUsers]);

  const alertFacts = useMemo(
    () => [
      { label: "Soldier ID", value: soldier, icon: "user" as IconName },
      { label: "Group", value: group, icon: "layers" as IconName },
      { label: "Description", value: description, icon: "file" as IconName },
      { label: "Position Source", value: positionSource, icon: "pin" as IconName },
      { label: "Event Time", value: eventTime, icon: "clock" as IconName },
    ],
    [description, eventTime, group, positionSource, soldier],
  );

  const related = useMemo(
    () => [
      { label: "Soldier", value: soldier, icon: "user" as IconName },
      { label: "Group", value: group, icon: "layers" as IconName },
      { label: "Source Alert", value: alertCode, icon: "bell" as IconName },
      { label: "Created By", value: createdBy, icon: "user" as IconName },
    ],
    [alertCode, createdBy, group, soldier],
  );

  async function runAction(action: () => Promise<TicketDetail>) {
    if (!liveMode) return;
    setBusy(true);
    setActionError("");
    try {
      applyDetail(await action());
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleTask(id: string) {
    if (!liveMode || numericId == null) {
      setTasks((current) =>
        current.map((task) =>
          task.id === id
            ? { ...task, done: !task.done, status: !task.done ? "Done" : task.status === "Done" ? "Open" : task.status }
            : task,
        ),
      );
      return;
    }
    const task = tasks.find((item) => item.id === id);
    if (!task?.apiId) return;
    await runAction(async () => {
      await patchTask(numericId, task.apiId!, { status: task.done ? "TODO" : "DONE" });
      return fetchTicketDetail(numericId);
    });
  }

  async function postUpdate(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    if (!liveMode || numericId == null) {
      setUpdates((current) => [
        {
          id: `u-${Date.now()}`,
          name: "Superadmin",
          initials: "SA",
          tone: "purple",
          time: "Just now",
          body: text,
        },
        ...current,
      ]);
      setDraft("");
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      await postTicketUpdate(numericId, text);
      applyDetail(await fetchTicketDetail(numericId));
      setDraft("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not post update.");
    } finally {
      setBusy(false);
    }
  }

  async function savePlan() {
    if (!liveMode || numericId == null) return;
    await runAction(() => patchTicket(numericId, { response_plan: plan }));
  }

  async function savePriority(next: Priority) {
    setPriority(next);
    if (!liveMode || numericId == null) return;
    await runAction(() => patchTicket(numericId, { priority: toApiPriority(next) }));
  }

  async function handleStartWorking() {
    if (!liveMode || numericId == null) {
      setStatus("In Progress");
      setApiStatus("IN_PROGRESS");
      return;
    }
    await runAction(() => startWorking(numericId));
  }

  async function handleWaiting() {
    if (!liveMode || numericId == null) {
      setStatus("Waiting");
      return;
    }
    await runAction(() => markWaiting(numericId));
  }

  async function handleResolve() {
    if (!liveMode || numericId == null) {
      setStatus("Resolved");
      return;
    }
    await runAction(() => resolveTicket(numericId));
  }

  async function handleClose() {
    if (!liveMode || numericId == null) {
      setStatus("Closed");
      return;
    }
    await runAction(() => closeTicket(numericId));
  }

  function openAssignPicker() {
    setActionError("");
    setPickerMode("assign");
  }

  function openCollaboratorPicker() {
    setActionError("");
    setPickerMode("collaborator");
  }

  function closePicker() {
    if (busy) return;
    setPickerMode(null);
    setPickerSelected(null);
    setPickerQuery("");
    setPickerError("");
  }

  async function confirmPicker() {
    if (pickerSelected == null) {
      setPickerError("Select a user first.");
      return;
    }
    const user = pickerUsers.find((item) => item.id === pickerSelected);
    if (pickerMode === "assign") {
      if (!liveMode || numericId == null) {
        setAssigneeName(user?.name || `User ${pickerSelected}`);
        setAssigneeRole("Assignee");
        closePicker();
        return;
      }
      setBusy(true);
      setPickerError("");
      try {
        applyDetail(await assignTicket(numericId, pickerSelected));
        setPickerMode(null);
      } catch (err) {
        setPickerError(err instanceof Error ? err.message : "Could not assign ticket.");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!liveMode || numericId == null) {
      closePicker();
      return;
    }
    setBusy(true);
    setPickerError("");
    try {
      applyDetail(await addCollaborator(numericId, pickerSelected));
      setPickerMode(null);
    } catch (err) {
      setPickerError(err instanceof Error ? err.message : "Could not add collaborator.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveCollaborator(userId?: number) {
    if (!liveMode || numericId == null || userId == null) {
      setCollaborators((current) => current.filter((person) => person.id !== userId));
      return;
    }
    await runAction(() => removeCollaborator(numericId, userId));
  }

  function openTaskModal() {
    setActionError("");
    setTaskError("");
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("Medium");
    setTaskAssigneeId("");
    setTaskModalOpen(true);
  }

  function closeTaskModal() {
    if (busy) return;
    setTaskModalOpen(false);
    setTaskError("");
  }

  async function confirmAddTask() {
    const title = taskTitle.trim();
    if (!title) {
      setTaskError("Title is required.");
      return;
    }
    const assigneeId = taskAssigneeId ? Number(taskAssigneeId) : null;
    if (!liveMode || numericId == null) {
      const assignee = teamPeople.find((person) => person.id === assigneeId);
      setTasks((current) => [
        ...current,
        {
          id: `t-${Date.now()}`,
          title,
          done: false,
          assignee: assignee ? initialsOf(assignee.name) : "—",
          tone: assignee ? personTone(assignee.id) : "muted",
          priority: taskPriority,
          status: "Open",
        },
      ]);
      setTaskModalOpen(false);
      return;
    }
    setBusy(true);
    setTaskError("");
    try {
      await addTask(numericId, {
        title,
        description: taskDescription.trim() || null,
        assignee_id: Number.isFinite(assigneeId) ? assigneeId : null,
        priority: toApiPriority(taskPriority),
      });
      applyDetail(await fetchTicketDetail(numericId));
      setTaskModalOpen(false);
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : "Could not create task.");
    } finally {
      setBusy(false);
    }
  }

  async function copyId() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  if (loading) {
    return (
      <div className="tkt-page">
        <p className="tkt-list-error">Loading ticket…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tkt-page">
        <header className="tkt-head">
          <div className="tkt-head-main">
            <button type="button" className="tkt-icon-btn" aria-label="Back" onClick={() => router.push("/tickets")}>
              <Icon name="arrow" size={15} />
            </button>
            <div>
              <h1>Ticket unavailable</h1>
              <p>{error}</p>
            </div>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="tkt-page">
      <header className="tkt-head">
        <div className="tkt-head-main">
          <button type="button" className="tkt-icon-btn" aria-label="Back" onClick={() => router.push("/tickets")}>
            <Icon name="arrow" size={15} />
          </button>
          <div>
            <div className="tkt-title-row">
              <h1>{code}</h1>
              <span className={`tkt-chip ${priority.toLowerCase()}`}>{priority}</span>
              <span className={`tkt-chip status-${status.toLowerCase().replace(/\s+/g, "-")}`}>{status}</span>
            </div>
            <p>Created from Alert #{alertCode} · {createdAt}</p>
          </div>
        </div>
        <div className="tkt-head-actions">
          {apiStatus === "OPEN" || apiStatus === "WAITING" || (!liveMode && status !== "Resolved" && status !== "Closed") ? (
            <button type="button" className="tkt-primary" disabled={busy} onClick={handleStartWorking}>
              <Icon name="play" size={14} />
              {apiStatus === "WAITING" ? "Resume Working" : "Start Working"}
              <Icon name="chevron" size={13} />
            </button>
          ) : null}
          {apiStatus === "IN_PROGRESS" ? (
            <button type="button" className="tkt-ghost" disabled={busy} onClick={handleWaiting}>
              Waiting
            </button>
          ) : null}
        </div>
      </header>

      {actionError ? <p className="tkt-list-error">{actionError}</p> : null}

      <div className="tkt-layout">
        <div className="tkt-main">
          <section className="tkt-card">
            <h2>Alert Information</h2>
            <div className="tkt-alert-hero">
              <span className="tkt-sos" aria-hidden="true">{alertType === "SOS" ? "SOS" : alertType.slice(0, 3).toUpperCase()}</span>
              <div>
                <strong>{alertTitle}</strong>
                <small>Alert #{alertCode}</small>
              </div>
            </div>
            <ul className="tkt-facts">
              {alertFacts.map((fact) => (
                <li key={fact.label}>
                  <Icon name={fact.icon} size={14} />
                  <div>
                    <small>{fact.label}</small>
                    <strong>{fact.value}</strong>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="tkt-split">
            <section className="tkt-card tkt-map-card">
              <h2>Last Known Position</h2>
              <div className="tkt-map-live">
                <AlertMap lng={lng} lat={lat} soldier={soldier} type={alertType} severity={severity} />
                <span className="tkt-map-coord">{lat.toFixed(4)}, {lng.toFixed(4)}</span>
              </div>
            </section>

            <section className="tkt-card">
              <div className="tkt-card-head">
                <h2>Latest Vital</h2>
                <small>22:37:50</small>
              </div>
              <p className="tkt-card-note">From chest strap</p>
              <ul className="tkt-vitals">
                {vitals.map((item) => (
                  <li key={item.label}>
                    <span className={`tkt-vital-icon ${item.tone}`}>
                      <Icon name={item.icon} size={14} />
                    </span>
                    <div>
                      <small>{item.label}</small>
                      <strong>{item.value}</strong>
                    </div>
                    <span className={`tkt-chip ${item.tone}`}>{item.badge}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="tkt-card">
            <div className="tkt-card-head">
              <h2>Response Plan</h2>
              {liveMode ? (
                <button type="button" className="tkt-ghost" disabled={busy} onClick={savePlan}>
                  Save
                </button>
              ) : null}
            </div>
            <textarea className="tkt-plan" value={plan} onChange={(event) => setPlan(event.target.value)} rows={6} />
          </section>

          <section className="tkt-card">
            <div className="tkt-card-head">
              <h2>Tasks ({tasks.length})</h2>
              <button type="button" className="tkt-ghost" disabled={busy} onClick={openTaskModal}>
                <Icon name="plus" size={13} />
                Add Task
              </button>
            </div>
            <ul className="tkt-tasks">
              {tasks.map((task) => (
                <li key={task.id}>
                  <label>
                    <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} disabled={busy} />
                    <span className={task.done ? "done" : ""}>{task.title}</span>
                  </label>
                  <span className={`tkt-avatar ${task.tone}`}>{task.assignee}</span>
                  <span className={`tkt-chip ${task.priority.toLowerCase()}`}>{task.priority}</span>
                  <span className={`tkt-chip status-${task.status.toLowerCase().replace(/\s+/g, "-")}`}>{task.status}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="tkt-card">
            <h2>Collaboration Updates</h2>
            <form className="tkt-compose" onSubmit={postUpdate}>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Write an update for the team..."
                disabled={busy}
              />
              <button type="submit" className="tkt-primary" disabled={busy}>Post</button>
            </form>
            <ul className="tkt-updates">
              {updates.map((item) => (
                <li key={item.id}>
                  <span className={`tkt-avatar ${item.tone}`}>{item.initials}</span>
                  <div>
                    <div className="tkt-update-head">
                      <strong>{item.name}</strong>
                      <small>{item.time}</small>
                    </div>
                    <p>{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="tkt-side">
          <section className="tkt-card">
            <h2>Assignment</h2>
            <div className="tkt-assign">
              <span className={`tkt-avatar ${assigneeName ? "blue" : "muted"}`}>
                {assigneeName ? initialsOf(assigneeName) : <Icon name="user" size={14} />}
              </span>
              <div>
                <strong>{assigneeName || "Unassigned"}</strong>
                <small>{assigneeName ? assigneeRole || "Assignee" : "No owner yet"}</small>
              </div>
              <button type="button" className="tkt-ghost" disabled={busy || apiStatus === "RESOLVED" || apiStatus === "CLOSED"} onClick={openAssignPicker}>
                Assign
              </button>
            </div>
          </section>

          <section className="tkt-card">
            <div className="tkt-card-head">
              <h2>Collaborators ({collaborators.length})</h2>
              <button type="button" className="tkt-ghost" disabled={busy} onClick={openCollaboratorPicker}>
                <Icon name="plus" size={13} />
                Add
              </button>
            </div>
            <ul className="tkt-people">
              {collaborators.map((person) => (
                <li key={`${person.id ?? person.name}`}>
                  <span className={`tkt-avatar ${person.tone}`}>{person.initials}</span>
                  <div>
                    <strong>{person.name}</strong>
                    <small>{person.role}</small>
                  </div>
                  <button type="button" className="tkt-icon-btn" aria-label={`Remove ${person.name}`} disabled={busy} onClick={() => handleRemoveCollaborator(person.id)}>
                    <Icon name="close" size={13} />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="tkt-card">
            <h2>Related</h2>
            <ul className="tkt-related">
              {related.map((item) => (
                <li key={item.label}>
                  <Icon name={item.icon} size={14} />
                  <div>
                    <small>{item.label}</small>
                    <strong>{item.value}</strong>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="tkt-card">
            <h2>Ticket Details</h2>
            <dl className="tkt-details">
              <div>
                <dt>Ticket ID</dt>
                <dd>
                  {code}
                  <button type="button" className="tkt-icon-btn" aria-label="Copy ticket ID" onClick={copyId}>
                    <Icon name="copy" size={13} />
                  </button>
                  {copied && <em>Copied</em>}
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span className={`tkt-chip status-${status.toLowerCase().replace(/\s+/g, "-")}`}>{status}</span>
                </dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd>
                  <select
                    value={priority}
                    disabled={busy}
                    onChange={(event) => savePriority(event.target.value as Priority)}
                  >
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{createdAt}</dd>
              </div>
              <div>
                <dt>Last Updated</dt>
                <dd>{updatedAt}</dd>
              </div>
              <div>
                <dt>Created By</dt>
                <dd>{createdBy}</dd>
              </div>
            </dl>
          </section>

          {apiStatus === "RESOLVED" ? (
            <button type="button" className="tkt-resolve" disabled={busy} onClick={handleClose}>
              <Icon name="check" size={15} />
              Close Ticket
              <Icon name="chevron" size={13} />
            </button>
          ) : apiStatus !== "CLOSED" ? (
            <button type="button" className="tkt-resolve" disabled={busy || (liveMode && apiStatus === "OPEN")} onClick={handleResolve}>
              <Icon name="check" size={15} />
              Resolve Ticket
              <Icon name="chevron" size={13} />
            </button>
          ) : null}
        </aside>
      </div>

      {mounted && pickerMode
        ? createPortal(
            <div className="tkt-modal-overlay" role="presentation" onClick={closePicker}>
              <div
                className="tkt-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tkt-person-title"
                onClick={(event) => event.stopPropagation()}
              >
                <header className="tkt-modal-head">
                  <div>
                    <h2 id="tkt-person-title">{pickerMode === "assign" ? "Assign ticket" : "Add collaborator"}</h2>
                    <p>
                      {pickerMode === "assign"
                        ? "Choose an active verified user to own this ticket."
                        : "Invite another user to collaborate on this ticket."}
                    </p>
                  </div>
                  <button type="button" className="tkt-icon-btn" aria-label="Close" disabled={busy} onClick={closePicker}>
                    <Icon name="close" size={14} />
                  </button>
                </header>

                <label className="tkt-modal-search">
                  <Icon name="search" size={14} />
                  <input
                    value={pickerQuery}
                    onChange={(event) => setPickerQuery(event.target.value)}
                    placeholder="Search name, username, or id..."
                    autoFocus
                  />
                </label>

                <div className="tkt-modal-list">
                  {pickerLoading ? <p className="tkt-modal-empty">Loading users…</p> : null}
                  {!pickerLoading && filteredPickerUsers.length === 0 ? (
                    <p className="tkt-modal-empty">No matching users.</p>
                  ) : null}
                  {!pickerLoading
                    ? filteredPickerUsers.map((user) => {
                        const selected = pickerSelected === user.id;
                        return (
                          <button
                            key={user.id}
                            type="button"
                            className={`tkt-modal-user${selected ? " on" : ""}`}
                            onClick={() => setPickerSelected(user.id)}
                          >
                            <span className={`tkt-avatar ${personTone(user.id)}`}>{initialsOf(user.name)}</span>
                            <span>
                              <strong>{user.name}</strong>
                              <small>
                                {user.username || "—"} · ID {user.id}
                                {user.department ? ` · ${user.department}` : ""}
                              </small>
                            </span>
                            <i aria-hidden="true" />
                          </button>
                        );
                      })
                    : null}
                </div>

                {pickerError ? <p className="tkt-modal-error">{pickerError}</p> : null}

                <div className="tkt-modal-actions">
                  <button type="button" className="tkt-ghost" disabled={busy} onClick={closePicker}>
                    Cancel
                  </button>
                  <button type="button" className="tkt-primary" disabled={busy || pickerSelected == null} onClick={() => void confirmPicker()}>
                    {busy ? "Saving…" : pickerMode === "assign" ? "Assign" : "Add"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {mounted && taskModalOpen
        ? createPortal(
            <div className="tkt-modal-overlay" role="presentation" onClick={closeTaskModal}>
              <form
                className="tkt-modal tkt-task-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tkt-task-title"
                onClick={(event) => event.stopPropagation()}
                onSubmit={(event) => {
                  event.preventDefault();
                  void confirmAddTask();
                }}
              >
                <header className="tkt-modal-head">
                  <div>
                    <h2 id="tkt-task-title">Add task</h2>
                    <p>Create a follow-up task for this ticket response.</p>
                  </div>
                  <button type="button" className="tkt-icon-btn" aria-label="Close" disabled={busy} onClick={closeTaskModal}>
                    <Icon name="close" size={14} />
                  </button>
                </header>

                <div className="tkt-task-form">
                  <label>
                    <span>Title</span>
                    <input
                      value={taskTitle}
                      onChange={(event) => setTaskTitle(event.target.value)}
                      placeholder="Dispatch response team"
                      autoFocus
                    />
                  </label>
                  <label>
                    <span>Description</span>
                    <textarea
                      value={taskDescription}
                      onChange={(event) => setTaskDescription(event.target.value)}
                      placeholder="Optional details for the assignee..."
                      rows={3}
                    />
                  </label>
                  <div className="tkt-task-row">
                    <label>
                      <span>Priority</span>
                      <select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as Priority)}>
                        <option>Critical</option>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    </label>
                    <label>
                      <span>Assignee</span>
                      <select value={taskAssigneeId} onChange={(event) => setTaskAssigneeId(event.target.value)}>
                        <option value="">Unassigned</option>
                        {teamPeople.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {taskError ? <p className="tkt-modal-error">{taskError}</p> : null}

                <div className="tkt-modal-actions">
                  <button type="button" className="tkt-ghost" disabled={busy} onClick={closeTaskModal}>
                    Cancel
                  </button>
                  <button type="submit" className="tkt-primary" disabled={busy || !taskTitle.trim()}>
                    {busy ? "Saving…" : "Add Task"}
                  </button>
                </div>
              </form>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
