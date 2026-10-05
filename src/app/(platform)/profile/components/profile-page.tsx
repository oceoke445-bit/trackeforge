"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { fetchMyAuditLogs, type AuditListItem } from "@/lib/audit-api";
import {
  fetchMyProfile,
  fetchProfileImage,
  rememberProfile,
  removeProfileImage,
  updateMyProfile,
  type ProfileUser,
} from "@/lib/profile-api";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACTIVITY_LIMIT = 20;

type Draft = { fullName: string; email: string };
type Tab = "profile" | "activity";

function profileMessage(detail: string) {
  if (detail === "email already exists") return "This email is already used by another account.";
  if (detail === "no profile changes") return "No profile changes.";
  if (detail === "fullname is required") return "Full name is required.";
  if (detail === "email is invalid") return "Invalid email.";
  if (detail === "profile image must be PNG, JPEG, or WEBP") return "Use a PNG, JPEG, or WEBP image.";
  if (detail === "profile image must be at most 5 MB") return "Profile image must be at most 5 MB.";
  if (detail === "profile image is empty") return "Profile image is empty.";
  if (detail === "authentication required") return "Sign in again to open your profile.";
  if (detail === "profile image not found") return "No profile photo to remove.";
  return detail || "Profile is unavailable.";
}

function titleCase(value: string | null | undefined) {
  if (!value) return "—";
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatStamp(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(date);
  return `${formatted} WIB`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

function statusTone(status: ProfileUser["status"]) {
  if (status === "ACTIVE") return "green";
  if (status === "SUSPENDED") return "amber";
  if (status === "DISABLED") return "red";
  return "muted";
}

function outcomeTone(outcome: string) {
  if (outcome === "Success") return "green";
  if (outcome === "Failed" || outcome === "Denied") return "red";
  return "muted";
}

function imageProblem(file: File) {
  const type = file.type || "";
  const name = file.name.toLowerCase();
  const allowedName = name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".webp");
  if ((type && !IMAGE_TYPES.includes(type)) || (!type && !allowedName)) return "Use a PNG, JPEG, or WEBP image.";
  if (file.size > MAX_IMAGE_BYTES) return "Profile image must be at most 5 MB.";
  if (file.size === 0) return "Profile image is empty.";
  return "";
}

export default function ProfilePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("profile");
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [draft, setDraft] = useState<Draft>({ fullName: "", email: "" });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [activity, setActivity] = useState<AuditListItem[]>([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityPage, setActivityPage] = useState(1);
  const [activityError, setActivityError] = useState("");
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityStamp, setActivityStamp] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await fetchMyProfile();
        if (cancelled) return;
        setUser(next);
        setDraft({ fullName: next.fullName, email: next.email ?? "" });
        rememberProfile(next);
        if (next.profileImageUrl) {
          const url = await fetchProfileImage();
          if (cancelled) {
            if (url) URL.revokeObjectURL(url);
            return;
          }
          if (url) setPhotoUrl(url);
        }
      } catch (loadError) {
        if (!cancelled) setError(profileMessage(loadError instanceof Error ? loadError.message : ""));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  useEffect(() => {
    return () => {
      if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    };
  }, [pendingUrl]);

  useEffect(() => {
    if (tab !== "activity") return;
    let cancelled = false;
    setActivityLoading(true);
    setActivityError("");
    fetchMyAuditLogs(activityPage, ACTIVITY_LIMIT)
      .then((page) => {
        if (cancelled) return;
        setActivity(page.items);
        setActivityTotal(page.total);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setActivity([]);
        setActivityError(profileMessage(loadError instanceof Error ? loadError.message : "Activity log is unavailable"));
      })
      .finally(() => {
        if (!cancelled) setActivityLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, activityPage, activityStamp]);

  function applyUser(next: ProfileUser) {
    setUser(next);
    setDraft({ fullName: next.fullName, email: next.email ?? "" });
    rememberProfile(next);
    setActivityStamp((value) => value + 1);
  }

  function choosePhoto() {
    if (!editing) return;
    fileRef.current?.click();
  }

  function takeFile(file: File | undefined) {
    if (!file || !editing) return;
    const problem = imageProblem(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setPendingFile(file);
    setPendingUrl(URL.createObjectURL(file));
  }

  function startEdit() {
    if (!user) return;
    setDraft({ fullName: user.fullName, email: user.email ?? "" });
    setPendingFile(null);
    setPendingUrl(null);
    setEditing(true);
    setSaved(false);
    setError("");
  }

  function cancelEdit() {
    if (!user) return;
    setDraft({ fullName: user.fullName, email: user.email ?? "" });
    setPendingFile(null);
    setPendingUrl(null);
    setEditing(false);
    setError("");
  }

  async function save() {
    if (!user || pending) return;
    const fullname = draft.fullName.trim();
    const email = draft.email.trim();
    if (!fullname) {
      setError("Full name is required.");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email.");
      return;
    }
    const fields: { fullname?: string; email?: string; profileImage?: File } = {};
    if (fullname !== user.fullName) fields.fullname = fullname;
    if (email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
      if (!email) {
        setError("Invalid email.");
        return;
      }
      fields.email = email;
    }
    if (pendingFile) fields.profileImage = pendingFile;
    if (!fields.fullname && !fields.email && !fields.profileImage) {
      setError("No profile changes.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const next = await updateMyProfile(fields);
      applyUser(next);
      setPendingFile(null);
      setPendingUrl(null);
      setEditing(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
      if (next.profileImageUrl) {
        const url = await fetchProfileImage();
        setPhotoUrl(url);
      } else {
        setPhotoUrl(null);
      }
    } catch (saveError) {
      setError(profileMessage(saveError instanceof Error ? saveError.message : ""));
    } finally {
      setPending(false);
    }
  }

  async function removePhoto() {
    if (!editing || pending) return;
    setError("");
    if (pendingFile) {
      setPendingFile(null);
      setPendingUrl(null);
      if (!user?.profileImageUrl) return;
    }
    if (!user?.profileImageUrl) return;
    setPending(true);
    try {
      await removeProfileImage();
      const next = await fetchMyProfile();
      applyUser(next);
      setPhotoUrl(null);
    } catch (removeError) {
      setError(profileMessage(removeError instanceof Error ? removeError.message : ""));
    } finally {
      setPending(false);
    }
  }

  const shownPhoto = pendingUrl || photoUrl;
  const activityPages = Math.max(1, Math.ceil(activityTotal / ACTIVITY_LIMIT));

  return (
    <div className="mp-page">
      <header className="mp-head">
        <h1>My Profile</h1>
        <p>Manage your personal information and how others see you on the platform.</p>
      </header>

      <nav className="mp-tabs" aria-label="Profile sections">
        <button type="button" className={tab === "profile" ? "on" : ""} onClick={() => setTab("profile")}>
          <Icon name="user" size={14} />
          Profile
        </button>
        <button type="button" className={tab === "activity" ? "on" : ""} onClick={() => setTab("activity")}>
          <Icon name="clock" size={14} />
          Activity
        </button>
      </nav>

      {tab === "activity" ? (
        <section className="mp-card">
          <div className="mp-card-head compact">
            <div>
              <h2>Activity</h2>
              <p>Recent actions for this account, newest first.</p>
            </div>
          </div>
          {activityError && <p className="mp-error">{activityError}</p>}
          {activityLoading && !activity.length ? (
            <div className="mp-placeholder">
              <h2>Loading activity</h2>
            </div>
          ) : activity.length === 0 && !activityError ? (
            <div className="mp-placeholder">
              <h2>No activity yet</h2>
              <p>Sign-in, profile updates, and photo removals show up here.</p>
            </div>
          ) : (
            <table className="mp-activity">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Action</th>
                  <th>Outcome</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((item) => (
                  <tr key={item.eventId}>
                    <td>{formatStamp(item.timestamp)}</td>
                    <td>
                      {item.event}
                      <span className="mp-sub">{item.eventId}</span>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.action}</td>
                    <td>
                      <span className={`mp-chip ${outcomeTone(item.outcome)}`}>{item.outcome}</span>
                    </td>
                    <td>{item.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {activityTotal > ACTIVITY_LIMIT && (
            <div className="mp-pager">
              <span>
                Page {activityPage} of {activityPages}
              </span>
              <button type="button" className="mp-outline" disabled={activityPage <= 1 || activityLoading} onClick={() => setActivityPage((page) => page - 1)}>
                Previous
              </button>
              <button type="button" className="mp-outline" disabled={activityPage >= activityPages || activityLoading} onClick={() => setActivityPage((page) => page + 1)}>
                Next
              </button>
            </div>
          )}
        </section>
      ) : loading ? (
        <div className="mp-placeholder">
          <h2>Loading profile</h2>
        </div>
      ) : !user ? (
        <div className="mp-placeholder">
          <h2>Profile unavailable</h2>
          <p>{error || "Sign in again to open your profile."}</p>
        </div>
      ) : (
        <div className="mp-layout">
          <aside className="mp-side">
            <div className="mp-avatar-wrap">
              <div className="mp-avatar" aria-hidden="true">
                {shownPhoto ? <img src={shownPhoto} alt="" /> : <span>{initials(draft.fullName || user.fullName)}</span>}
              </div>
              <button type="button" className="mp-camera" aria-label="Change profile photo" disabled={!editing || pending} onClick={choosePhoto}>
                <Icon name="camera" size={14} />
              </button>
            </div>

            <strong className="mp-name">{draft.fullName || user.fullName}</strong>
            <span className={`mp-chip ${statusTone(user.status)}`}>{titleCase(user.status)}</span>
            <small className="mp-role">{titleCase(user.role?.name)}</small>

            <ul className="mp-facts">
              <li>
                <Icon name="mail" size={14} />
                <span>{draft.email || "—"}</span>
              </li>
              <li>
                <Icon name="building" size={14} />
                <span>{user.department || "—"}</span>
              </li>
              <li>
                <Icon name="clock" size={14} />
                <span>{formatStamp(user.lastLoginAt)}</span>
              </li>
              <li>
                <Icon name="calendar" size={14} />
                <span>Member since {formatStamp(user.memberSince)}</span>
              </li>
            </ul>
          </aside>

          <div className="mp-main">
            <section className="mp-card">
              <div className="mp-card-head">
                <div>
                  <h2>Personal Information</h2>
                  <p>Update your name, email, and profile photo.</p>
                </div>
                <div className="mp-card-actions">
                  {saved && <span className="mp-saved">Saved</span>}
                  {editing ? (
                    <>
                      <button type="button" className="mp-outline" onClick={cancelEdit} disabled={pending}>Cancel</button>
                      <button type="button" className="mp-primary" onClick={save} disabled={pending}>
                        <Icon name="upload" size={15} />
                        {pending ? "Saving..." : "Save Changes"}
                      </button>
                    </>
                  ) : (
                    <button type="button" className="mp-outline" onClick={startEdit}>
                      <Icon name="pencil" size={14} />
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {error && <p className="mp-error">{error}</p>}

              <div className="mp-form-grid">
                <label>
                  <span>Full Name</span>
                  <input value={draft.fullName} disabled={!editing || pending} onChange={(event) => setDraft((current) => ({ ...current, fullName: event.target.value }))} />
                </label>
                <label>
                  <span>Username</span>
                  <input value={user.username ?? ""} disabled />
                  <small>Username cannot be changed.</small>
                </label>
                <label>
                  <span>Email Address</span>
                  <input type="email" value={draft.email} disabled={!editing || pending} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} />
                </label>
                <label>
                  <span>Department</span>
                  <input value={user.department ?? ""} disabled placeholder="—" />
                  <small>Department cannot be changed.</small>
                </label>
                <label>
                  <span>Position / Role</span>
                  <input value={user.role ? titleCase(user.role.name) : ""} disabled placeholder="—" />
                  <small>Role cannot be changed.</small>
                </label>
              </div>
            </section>

            <div className="mp-bottom">
              <section className="mp-card">
                <div className="mp-card-head compact">
                  <div>
                    <h2>Profile Picture</h2>
                    <p>Upload a new profile picture. Recommended size is 400×400 px.</p>
                  </div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(event) => {
                    takeFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                <div className="mp-photo-row">
                  <button
                    type="button"
                    className="mp-dropzone"
                    disabled={!editing || pending}
                    onClick={choosePhoto}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      takeFile(event.dataTransfer.files?.[0]);
                    }}
                  >
                    <Icon name="upload" size={22} />
                    <strong>{pendingFile ? pendingFile.name : "Drag and drop an image here or click to browse."}</strong>
                    <small>PNG, JPG, or WEBP (max 5MB)</small>
                  </button>
                  <div className="mp-photo-actions">
                    <button type="button" className="mp-outline" disabled={!editing || pending} onClick={choosePhoto}>
                      <Icon name="image" size={15} />
                      Change Photo
                    </button>
                    <button type="button" className="mp-danger" disabled={!editing || pending || (!user.profileImageUrl && !pendingFile)} onClick={removePhoto}>
                      <Icon name="trash" size={15} />
                      Remove Photo
                    </button>
                  </div>
                </div>
              </section>

              <section className="mp-card">
                <div className="mp-card-head compact">
                  <div>
                    <h2>Account Information</h2>
                    <p>View your account details and status.</p>
                  </div>
                </div>
                <dl className="mp-account">
                  <div>
                    <dt>Account Status</dt>
                    <dd><span className={`mp-chip ${statusTone(user.status)}`}>{titleCase(user.status)}</span></dd>
                  </div>
                  <div>
                    <dt>Verification</dt>
                    <dd><span className={`mp-chip ${user.verification === "VERIFIED" ? "blue" : "amber"}`}>{titleCase(user.verification)}</span></dd>
                  </div>
                  <div>
                    <dt>Access Binding</dt>
                    <dd><span className={`mp-chip ${user.accessBinding === "BOUND" ? "green" : "muted"}`}>{user.accessBinding === "BOUND" ? "Bound" : "No Binding"}</span></dd>
                  </div>
                  <div>
                    <dt>Account Type</dt>
                    <dd>{user.accountType}</dd>
                  </div>
                  <div>
                    <dt>Last Login</dt>
                    <dd>{formatStamp(user.lastLoginAt)}</dd>
                  </div>
                  <div>
                    <dt>Login Method</dt>
                    <dd>{user.loginMethod}</dd>
                  </div>
                  <div>
                    <dt>Member Since</dt>
                    <dd>{formatStamp(user.memberSince)}</dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
