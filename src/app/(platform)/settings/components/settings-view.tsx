"use client";

import { useState } from "react";
import Icon, { type IconName } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";

const sections: { id: string; label: string; hint: string; icon: IconName; ready?: boolean }[] = [
  { id: "general", label: "General", hint: "Basic information and preferences", icon: "settings", ready: true },
  { id: "map", label: "Map & Location", hint: "Map, GNSS and tracking settings", icon: "map" },
  { id: "communication", label: "Communication", hint: "LoRa Mesh and Satellite", icon: "signal" },
  { id: "devices", label: "Devices", hint: "Soldier devices and sensors", icon: "cpu" },
  { id: "health", label: "Health Monitoring", hint: "EKG and vital sign settings", icon: "heart" },
  { id: "offline", label: "Offline & Storage", hint: "Offline mode and data retention", icon: "box" },
  { id: "security", label: "Security", hint: "Encryption and device security", icon: "shield" },
  { id: "emcon", label: "EMCON", hint: "Emission control profiles", icon: "bolt" },
  { id: "alerts", label: "Alerts", hint: "Notification and alert rules", icon: "bell" },
  { id: "diagnostics", label: "System Diagnostics", hint: "Service health and diagnostics", icon: "chart" },
  { id: "about", label: "About", hint: "Version and license information", icon: "file" },
];

const statuses: { label: string; hint: string; icon: IconName }[] = [
  { label: "LoRa Mesh", hint: "Mesh network connectivity", icon: "signal" },
  { label: "Satellite (Iridium)", hint: "SBD communication", icon: "bolt" },
  { label: "GNSS", hint: "Position and timing", icon: "pin" },
  { label: "EKG Sensor", hint: "Health monitoring", icon: "heart" },
  { label: "Local Database", hint: "Offline data storage", icon: "layers" },
];

export default function SettingsView() {
  const { theme, setTheme } = useTheme();
  const [section, setSection] = useState("general");
  const [appearance, setAppearance] = useState<"light" | "dark" | "system">(theme === "gray" ? "light" : "dark");
  const [sound, setSound] = useState(true);
  const [welcome, setWelcome] = useState(false);
  const [saved, setSaved] = useState(false);
  const current = sections.find((item) => item.id === section) ?? sections[0];

  function chooseAppearance(next: "light" | "dark" | "system") {
    setAppearance(next);
    if (next === "system") {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(dark ? "blue" : "gray");
      return;
    }
    setTheme(next === "light" ? "gray" : "blue");
  }

  function save() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <div className="settings-page">
      <header className="settings-head">
        <span className="settings-head-icon">
          <Icon name="settings" size={16} />
        </span>
        <div>
          <h1>Settings</h1>
          <p>Configure system preferences, connectivity, devices and operational parameters.</p>
        </div>
      </header>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {sections.map((item) => {
            const body = (
              <>
                <Icon name={item.icon} size={16} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </span>
              </>
            );
            if (!item.ready) {
              return (
                <div key={item.id} className="settings-nav-item is-off" aria-disabled="true">
                  {body}
                </div>
              );
            }
            return (
              <button key={item.id} type="button" className={`settings-nav-item${section === item.id ? " on" : ""}`} onClick={() => setSection(item.id)}>
                {body}
              </button>
            );
          })}
        </nav>
        <section className="settings-main">
          <header>
            <span className="settings-head-icon">
              <Icon name={current.icon} size={16} />
            </span>
            <div>
              <h2>{current.label}</h2>
              <p>Basic system configuration and user preferences.</p>
            </div>
            <button type="button" className="settings-save" onClick={save}>
              <Icon name="check" size={14} />
              {saved ? "Saved" : "Save Changes"}
            </button>
          </header>
            <div className="settings-body">
              <article>
                <h3>
                  <Icon name="shield" size={14} /> Organization
                </h3>
                <p>Unit and operator information</p>
                <div className="settings-grid-3">
                  <label>
                    Organization / Unit
                    <select defaultValue="Nusantara Tactical Unit">
                      <option>Nusantara Tactical Unit</option>
                      <option>Fleet Command</option>
                    </select>
                  </label>
                  <label>
                    Operator Name
                    <select defaultValue="Administrator1">
                      <option>Administrator1</option>
                      <option>Superadmin</option>
                    </select>
                  </label>
                  <label>
                    Operator Role
                    <select defaultValue="Security Administrator">
                      <option>Security Administrator</option>
                      <option>Fleet Admin</option>
                    </select>
                  </label>
                </div>
              </article>
              <article>
                <h3>
                  <Icon name="sun" size={14} /> Appearance
                </h3>
                <div className="settings-appearance">
                  <div className="settings-themes" role="group" aria-label="Theme">
                    <button type="button" className={appearance === "light" ? "on" : ""} onClick={() => chooseAppearance("light")}>
                      <Icon name="sun" size={16} /> Light
                    </button>
                    <button type="button" className={appearance === "dark" ? "on" : ""} onClick={() => chooseAppearance("dark")}>
                      <Icon name="moon" size={16} /> Dark
                    </button>
                    <button type="button" className={appearance === "system" ? "on" : ""} onClick={() => chooseAppearance("system")}>
                      <Icon name="monitor" size={16} /> System
                    </button>
                  </div>
                  <label>
                    Accent Color
                    <span className="settings-accent">
                      <i />
                      <select defaultValue="Blue (Default)">
                        <option>Blue (Default)</option>
                        <option>Slate</option>
                      </select>
                    </span>
                  </label>
                </div>
              </article>
              <article>
                <h3>
                  <Icon name="pin" size={14} /> Region & Language
                </h3>
                <div className="settings-grid-3">
                  <label>
                    Language
                    <select defaultValue="English">
                      <option>English</option>
                      <option>Bahasa Indonesia</option>
                    </select>
                  </label>
                  <label>
                    Time Zone
                    <select defaultValue="Asia/Jakarta (GMT+7)">
                      <option>Asia/Jakarta (GMT+7)</option>
                      <option>UTC</option>
                    </select>
                  </label>
                  <label>
                    Date Format
                    <select defaultValue="02 Oct 2026">
                      <option>02 Oct 2026</option>
                      <option>2026-10-02</option>
                    </select>
                  </label>
                  <label>
                    Time Format
                    <select defaultValue="24-hour (16:13)">
                      <option>24-hour (16:13)</option>
                      <option>12-hour (4:13 PM)</option>
                    </select>
                  </label>
                  <label>
                    Units
                    <select defaultValue="Metric (km, m, °C)">
                      <option>Metric (km, m, °C)</option>
                      <option>Imperial (mi, ft, °F)</option>
                    </select>
                  </label>
                  <label>
                    Coordinate Format
                    <select defaultValue={"DD° MM' SS.S\" (Default)"}>
                      <option>{"DD° MM' SS.S\" (Default)"}</option>
                      <option>Decimal degrees</option>
                    </select>
                  </label>
                </div>
              </article>
              <article>
                <h3>
                  <Icon name="settings" size={14} /> Application
                </h3>
                <div className="settings-grid-3">
                  <label>
                    Default Landing Page
                    <select defaultValue="Live Tracking">
                      <option>Dashboard</option>
                      <option>Live Tracking</option>
                      <option>User Access</option>
                      <option>Settings</option>
                    </select>
                  </label>
                  <label>
                    Auto Refresh Interval
                    <select defaultValue="30 seconds">
                      <option>15 seconds</option>
                      <option>30 seconds</option>
                      <option>60 seconds</option>
                    </select>
                  </label>
                  <label>
                    Session Timeout
                    <select defaultValue="30 minutes">
                      <option>15 minutes</option>
                      <option>30 minutes</option>
                      <option>60 minutes</option>
                    </select>
                  </label>
                </div>
                <button type="button" className={`settings-toggle ${sound ? "on" : ""}`} onClick={() => setSound((value) => !value)}>
                  <i />
                  <span>
                    <strong>Enable Sound Notifications</strong>
                    <small>Play sound for important alerts</small>
                  </span>
                </button>
                <button type="button" className={`settings-toggle ${welcome ? "on" : ""}`} onClick={() => setWelcome((value) => !value)}>
                  <i />
                  <span>
                    <strong>Show Welcome Message</strong>
                    <small>Show welcome message after login</small>
                  </span>
                </button>
              </article>
            </div>
        </section>
        <aside className="settings-side">
          <article>
            <header>
              <h3><Icon name="settings" size={14} /> System Status</h3>
              <p className="settings-ok"><i /> All systems operational</p>
            </header>
            <ul>
              {statuses.map((item) => (
                <li key={item.label}>
                  <span className="settings-status-icon"><Icon name={item.icon} size={14} /></span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                  </span>
                  <em><i /> Operational</em>
                </li>
              ))}
            </ul>
          </article>
          <article className="settings-devices">
            <header>
              <h3><Icon name="cpu" size={14} /> Device Overview</h3>
              <Icon name="chevron" size={14} />
            </header>
            <div>
              <span><b>15</b><small>Total Devices</small></span>
              <span className="online"><b>13</b><small>Online</small></span>
              <span className="offline"><b>2</b><small>Offline</small></span>
            </div>
          </article>
          <article>
            <header>
              <h3><Icon name="box" size={14} /> Storage Usage</h3>
              <p>1.8 GB / 8 GB <b>22%</b></p>
            </header>
            <div className="settings-bar"><i /></div>
          </article>
          <article className="settings-emcon">
            <header>
              <h3><Icon name="signal" size={14} /> Current EMCON Profile</h3>
              <Icon name="chevron" size={14} />
            </header>
            <p><span><Icon name="check" size={12} /> NORMAL</span> All communications operational</p>
          </article>
          <article>
            <header>
              <h3><Icon name="bolt" size={14} /> Last Satellite Transmission</h3>
              <Icon name="chevron" size={14} />
            </header>
            <p className="settings-time"><b>14:32:18</b> <small>Next: 14:47:18 (in 15 minutes)</small> <em>Success</em></p>
          </article>
          <article>
            <header>
              <h3><Icon name="clock" size={14} /> System Information</h3>
              <Icon name="chevron" size={14} />
            </header>
            <dl>
              <div><dt>Version</dt><dd>v0.8.4</dd></div>
              <div><dt>Last Updated</dt><dd>02 Oct 2026 14:28</dd></div>
              <div><dt>Uptime</dt><dd>4d 12h 8m</dd></div>
            </dl>
          </article>
        </aside>
      </div>
    </div>
  );
}
