"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";

const departments = ["Security Operations", "Fleet Operations", "IT", "SOC", "Platform Administration"];
const roles = ["Security Administrator", "Fleet Admin", "Dispatcher", "Analyst", "Field Operator"];

type ProfileDraft = {
  fullName: string;
  email: string;
  department: string;
  role: string;
  phone: string;
  bio: string;
};

const initialProfile: ProfileDraft = {
  fullName: "Administrator1",
  email: "admin@traxon.id",
  department: "Security Operations",
  role: "Security Administrator",
  phone: "81234567890",
  bio: "Security administrator responsible for platform security, user management, and system operations.",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const bioCount = useMemo(() => draft.bio.length, [draft.bio]);

  function updateDraft<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function startEdit() {
    setDraft(profile);
    setEditing(true);
    setSaved(false);
  }

  function cancelEdit() {
    setDraft(profile);
    setEditing(false);
  }

  function save() {
    setProfile(draft);
    setEditing(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <div className="mp-page">
      <header className="mp-head">
        <h1>My Profile</h1>
        <p>Manage your personal information and how others see you on the platform.</p>
      </header>

      <div className="mp-layout">
        <aside className="mp-side">
          <div className="mp-avatar-wrap">
            <div className="mp-avatar" aria-hidden="true">
              <span>A1</span>
            </div>
            <button type="button" className="mp-camera" aria-label="Change profile photo" disabled={!editing}>
              <Icon name="camera" size={14} />
            </button>
          </div>

          <strong className="mp-name">{draft.fullName}</strong>
          <span className="mp-online">
            <i /> Online
          </span>
          <small className="mp-role">{draft.role}</small>

          <ul className="mp-facts">
            <li>
              <Icon name="mail" size={14} />
              <span>{draft.email}</span>
            </li>
            <li>
              <Icon name="building" size={14} />
              <span>{draft.department}</span>
            </li>
            <li>
              <Icon name="pin" size={14} />
              <span>Headquarters</span>
            </li>
            <li>
              <Icon name="clock" size={14} />
              <span>03 Oct 2026, 16:42:18 WIB</span>
            </li>
            <li>
              <Icon name="calendar" size={14} />
              <span>Member since 12 Jan 2024</span>
            </li>
          </ul>
        </aside>

        <div className="mp-main">
          <section className="mp-card">
            <div className="mp-card-head">
              <div>
                <h2>Personal Information</h2>
                <p>Update your personal details and how others see you on the platform.</p>
              </div>
              <div className="mp-card-actions">
                {saved && <span className="mp-saved">Saved</span>}
                {editing ? (
                  <>
                    <button type="button" className="mp-outline" onClick={cancelEdit}>Cancel</button>
                    <button type="button" className="mp-primary" onClick={save}>
                      <Icon name="upload" size={15} />
                      Save Changes
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

            <div className="mp-form-grid">
              <label>
                <span>Full Name</span>
                <input value={draft.fullName} disabled={!editing} onChange={(e) => updateDraft("fullName", e.target.value)} />
              </label>
              <label>
                <span>Username</span>
                <input value="admin1" disabled />
                <small>Username cannot be changed.</small>
              </label>
              <label>
                <span>Email Address</span>
                <input type="email" value={draft.email} disabled={!editing} onChange={(e) => updateDraft("email", e.target.value)} />
              </label>
              <label>
                <span>Department</span>
                <div className="mp-select">
                  <select value={draft.department} disabled={!editing} onChange={(e) => updateDraft("department", e.target.value)}>
                    {departments.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <Icon name="chevron" size={13} />
                </div>
              </label>
              <label>
                <span>Position / Role</span>
                <div className="mp-select">
                  <select value={draft.role} disabled={!editing} onChange={(e) => updateDraft("role", e.target.value)}>
                    {roles.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <Icon name="chevron" size={13} />
                </div>
              </label>
              <label>
                <span>Phone Number</span>
                <div className="mp-phone">
                  <button type="button" className="mp-ccode" disabled={!editing}>
                    🇮🇩 +62
                    <Icon name="chevron" size={12} />
                  </button>
                  <input value={draft.phone} disabled={!editing} onChange={(e) => updateDraft("phone", e.target.value.replace(/[^\d]/g, ""))} />
                </div>
              </label>
            </div>

            <label className="mp-bio">
              <span>Bio</span>
              <textarea
                value={draft.bio}
                maxLength={250}
                rows={4}
                disabled={!editing}
                onChange={(e) => updateDraft("bio", e.target.value)}
              />
              <em>{bioCount}/250</em>
            </label>
          </section>

          <div className="mp-bottom">
            <section className="mp-card">
              <div className="mp-card-head compact">
                <div>
                  <h2>Profile Picture</h2>
                  <p>Upload a new profile picture. Recommended size is 400×400 px.</p>
                </div>
              </div>
              <div className="mp-photo-row">
                <button type="button" className="mp-dropzone" disabled={!editing}>
                  <Icon name="upload" size={22} />
                  <strong>Drag and drop an image here or click to browse.</strong>
                  <small>PNG, JPG, or WEBP (max 5MB)</small>
                </button>
                <div className="mp-photo-actions">
                  <button type="button" className="mp-outline" disabled={!editing}>
                    <Icon name="image" size={15} />
                    Change Photo
                  </button>
                  <button type="button" className="mp-danger" disabled={!editing}>
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
                  <dd>
                    <span className="mp-chip green">Active</span>
                  </dd>
                </div>
                <div>
                  <dt>Verification</dt>
                  <dd>
                    <span className="mp-chip blue">Verified</span>
                  </dd>
                </div>
                <div>
                  <dt>Access Binding</dt>
                  <dd>
                    <span className="mp-chip green">Bound</span>
                  </dd>
                </div>
                <div>
                  <dt>Account Type</dt>
                  <dd>Administrator</dd>
                </div>
                <div>
                  <dt>Last Login</dt>
                  <dd>03 Oct 2026, 16:42:18 WIB</dd>
                </div>
                <div>
                  <dt>Login Method</dt>
                  <dd>Email &amp; Password</dd>
                </div>
                <div>
                  <dt>MFA Status</dt>
                  <dd>
                    <span className="mp-chip green">Enabled</span>
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
