"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { FLOW_POINTS } from "./mesh-data";

const RANGES = ["Last 1 Hour", "Last 6 Hours", "Last 24 Hours"] as const;

const QUEUE = [
  { id: 1, node: "S-01", type: "Telemetry", size: 21, at: "22:38:12", alert: false },
  { id: 2, node: "S-03", type: "Telemetry", size: 21, at: "22:38:14", alert: false },
  { id: 3, node: "S-07", type: "Alert (SOS)", size: 28, at: "22:38:15", alert: true },
  { id: 4, node: "S-02", type: "Telemetry", size: 21, at: "22:38:17", alert: false },
  { id: 5, node: "S-04", type: "Telemetry", size: 21, at: "22:38:18", alert: false },
  { id: 6, node: "S-06", type: "Telemetry", size: 21, at: "22:38:19", alert: false },
  { id: 7, node: "S-08", type: "Telemetry", size: 21, at: "22:38:21", alert: false },
];

const HISTORY = [
  { time: "22:38:14", bytes: 312, packets: 15, duration: "18.4 s", latency: "~42 s", message: "27391" },
  { time: "22:18:02", bytes: 196, packets: 10, duration: "12.7 s", latency: "~38 s", message: "27390" },
  { time: "22:05:41", bytes: 284, packets: 14, duration: "17.9 s", latency: "~41 s", message: "27389" },
  { time: "21:52:33", bytes: 326, packets: 16, duration: "19.1 s", latency: "~44 s", message: "27388" },
];

const SPARK = [42, 58, 46, 72, 64, 80, 70, 88];

function Gauge({ value, label, hint }: { value: number; label: string; hint?: string }) {
  const radius = 28;
  const length = 2 * Math.PI * radius;
  const filled = (value / 100) * length;
  return (
    <div className="gw-gauge">
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <circle cx="36" cy="36" r={radius} />
        <circle
          cx="36"
          cy="36"
          r={radius}
          strokeDasharray={`${filled} ${length - filled}`}
          transform="rotate(-90 36 36)"
        />
        <text x="36" y="40">{value}%</text>
      </svg>
      <small>{label}</small>
      {hint ? <em>{hint}</em> : null}
    </div>
  );
}

export default function GatewayStatus() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("Last 1 Hour");
  const [rawLog, setRawLog] = useState(false);
  const [testNote, setTestNote] = useState("");
  const axisLabels = useMemo(
    () => FLOW_POINTS.filter((_, index) => index % 5 === 0).map((point) => point.label),
    [],
  );
  const queue = QUEUE.slice(0, 5);

  return (
    <div className="mesh-status gw-status">
      <header className="mesh-head">
        <span className="mesh-head-icon" aria-hidden="true">
          <Icon name="server" size={18} />
        </span>
        <div>
          <h2>
            Gateway GW-01 <em className="mesh-online"><i /> Online</em>
          </h2>
          <p>Danru Gateway Unit (T-Beam #4 + RockBLOCK 9704) — receives mesh packets and sends data via Iridium satellite.</p>
        </div>
        <div className="mesh-head-tools">
          <label className="mesh-range">
            <Icon name="clock" size={13} />
            <select value={range} onChange={(event) => setRange(event.target.value as (typeof RANGES)[number])}>
              {RANGES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <span className="mesh-live on"><i /> Live</span>
          <button type="button" className="mesh-refresh" onClick={() => setRange("Last 1 Hour")}>
            <Icon name="refresh" size={13} /> Refresh
          </button>
        </div>
      </header>

      <section className="gw-kpis">
        <article>
          <span><Icon name="server" size={15} /></span>
          <div>
            <small>Gateway Status</small>
            <strong className="mesh-online"><i /> Online</strong>
            <em>Operational</em>
          </div>
        </article>
        <article>
          <span><Icon name="bolt" size={15} /></span>
          <div>
            <small>Battery Level</small>
            <strong>78%</strong>
            <b className="gw-battery"><i style={{ width: "78%" }} /></b>
            <em>3.9 V</em>
          </div>
        </article>
        <article>
          <span><Icon name="signal" size={15} /></span>
          <div>
            <small>Mesh Reception</small>
            <strong>148 pkts</strong>
            <em>Last 5 minutes</em>
          </div>
          <div className="gw-spark" aria-hidden="true">
            {SPARK.map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        </article>
        <article>
          <span><Icon name="link" size={15} /></span>
          <div>
            <small>Satellite / Iridium</small>
            <strong className="mesh-online"><i /> Registered</strong>
            <em>Signal Available</em>
          </div>
        </article>
        <article>
          <span><Icon name="arrow" size={15} /></span>
          <div>
            <small>Last Uplink</small>
            <strong className="mesh-online"><i /> 22:38:14</strong>
            <em>Success · 312 bytes</em>
          </div>
        </article>
      </section>

      <div className="gw-fit">
      <section className="gw-grid gw-mid">
        <article className="mesh-card">
          <header><h3>Gateway Hardware</h3></header>
          <div className="gw-hardware">
            <div>
              <strong>T-Beam #4</strong>
              <ul>
                <li>nRF52840</li>
                <li>SX1262 (LoRa)</li>
                <li>MAX-M10S (GNSS)</li>
                <li>Li-Po Battery</li>
              </ul>
            </div>
            <div className="gw-boards" aria-hidden="true">
              <div className="gw-board beam">
                <i />
                <b>T-Beam</b>
              </div>
              <div className="gw-board rock">
                <i />
                <b>9704</b>
              </div>
            </div>
            <div>
              <strong>RockBLOCK 9704</strong>
              <ul>
                <li>Iridium Modem</li>
                <li>UART Interface</li>
                <li>P_EN / I_EN</li>
                <li>Registered</li>
              </ul>
            </div>
          </div>
        </article>

        <article className="mesh-card">
          <header>
            <h3><Icon name="bolt" size={14} /> Satellite Link (Iridium)</h3>
            <span className="mesh-online"><i /> Connected</span>
          </header>
          <div className="gw-sat-top">
            <div>
              <small>Registration Status</small>
              <strong>Registered</strong>
              <em>Ready for uplink</em>
            </div>
            <div>
              <small>Signal Status</small>
              <strong>Signal Available</strong>
              <em>Last checked 10s ago</em>
            </div>
          </div>
          <dl className="gw-facts">
            <div><dt>Network</dt><dd>Iridium SBD</dd></div>
            <div><dt>Signal Quality</dt><dd>Good</dd></div>
            <div><dt>Session Status</dt><dd>Idle</dd></div>
            <div><dt>IMEI</dt><dd>300434068819870</dd></div>
            <div><dt>Antenna</dt><dd>OK</dd></div>
            <div><dt>Last Check</dt><dd>22:41:08</dd></div>
          </dl>
          <div className="gw-actions">
            <button type="button" onClick={() => setTestNote("Test message queued for the next uplink.")}>
              Send Test Message
            </button>
            {testNote ? <small>{testNote}</small> : null}
          </div>
        </article>

        <article className="mesh-card">
          <header>
            <h3><Icon name="arrow" size={14} /> Last Uplink Details</h3>
            <a href="#gw-history">View History</a>
          </header>
          <dl className="gw-detail">
            <div><dt>Time</dt><dd>22:38:14</dd></div>
            <div><dt>Status</dt><dd className="mesh-online"><i /> Success</dd></div>
            <div><dt>Transferred</dt><dd>312 bytes</dd></div>
            <div><dt>Packets</dt><dd>15 packets</dd></div>
            <div><dt>Duration</dt><dd>18.4 seconds</dd></div>
            <div><dt>Latency (est.)</dt><dd>~42 seconds</dd></div>
            <div><dt>Message ID</dt><dd>27391</dd></div>
          </dl>
          <div className="gw-actions end">
            <button type="button" className="primary" onClick={() => setRawLog((open) => !open)}>
              View Raw Log
            </button>
          </div>
          {rawLog ? (
            <pre className="gw-log">{`22:38:14 SBD session 27391\nMO 312 bytes · 15 packets\nstatus OK · latency ~42s`}</pre>
          ) : null}
        </article>
      </section>

      <section className="gw-grid gw-lower">
        <article className="mesh-card mesh-flow-card">
          <header>
            <h3><Icon name="chart" size={14} /> Mesh Traffic (From Soldier Nodes)</h3>
            <label className="mesh-range compact">
              <select value={range} onChange={(event) => setRange(event.target.value as (typeof RANGES)[number])}>
                {RANGES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </header>
          <div className="gw-traffic-nums">
            <div>
              <strong>1,284</strong>
              <small>Packets Received</small>
              <em>+12%</em>
            </div>
            <div>
              <strong>8</strong>
              <small>Active Nodes</small>
              <em>8 / 8 online</em>
            </div>
            <div>
              <strong>96.2%</strong>
              <small>Packet Delivery Rate</small>
              <em>+2.1%</em>
            </div>
          </div>
          <div className="mesh-flow-legend">
            <span><i className="recv" /> Received</span>
            <span><i className="rel" /> Relayed</span>
            <span><i className="drop" /> Dropped</span>
          </div>
          <div className="mesh-flow">
            <div className="mesh-flow-y">
              <span>100</span>
              <span>50</span>
              <span>0</span>
            </div>
            <div className="mesh-flow-plot">
              {FLOW_POINTS.map((point) => (
                <div key={point.label} className="mesh-flow-col" title={point.label}>
                  <i className="recv" style={{ height: `${point.received}%` }} />
                  <i className="rel" style={{ height: `${point.relayed}%` }} />
                  <i className="drop" style={{ height: `${point.dropped}%` }} />
                </div>
              ))}
            </div>
          </div>
          <div className="mesh-flow-x">
            {axisLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </article>

        <article className="mesh-card">
          <header>
            <h3><Icon name="layers" size={14} /> Packet Queue (To Satellite)</h3>
            <b className="gw-badge">15 in queue</b>
          </header>
          <div className="gw-queue-sum">
            <div><small>Total Queued</small><strong>15 packets</strong></div>
            <div><small>Total Size</small><strong>3.2 KB</strong></div>
            <div><small>Status</small><strong className="gw-wait"><i /> Waiting</strong></div>
          </div>
          <div className="mesh-table-wrap">
            <table className="mesh-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Node ID</th>
                  <th>Type</th>
                  <th>Size (B)</th>
                  <th>Enqueued At</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td><strong>{row.node}</strong></td>
                    <td className={row.alert ? "is-alert" : ""}>{row.type}</td>
                    <td>{row.size}</td>
                    <td>{row.at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="gw-link">
            View All Packets
          </button>
        </article>

        <article className="mesh-card">
          <header><h3><Icon name="cpu" size={14} /> Gateway Resource Usage</h3></header>
          <div className="gw-gauges">
            <Gauge value={32} label="CPU (nRF52840)" />
            <Gauge value={48} label="Memory" />
            <Gauge value={12} label="Storage (W25Q32)" hint="3.8 / 32 MB" />
          </div>
          <header className="gw-subhead"><h3><Icon name="clock" size={14} /> Uptime & Environment</h3></header>
          <dl className="gw-detail">
            <div><dt>Uptime</dt><dd>6h 12m 34s</dd></div>
            <div><dt>Device Time</dt><dd>2026-10-03 22:41:16 (UTC+7)</dd></div>
            <div><dt>Temperature</dt><dd>38.2 °C</dd></div>
            <div><dt>Input Voltage</dt><dd>3.9 V</dd></div>
          </dl>
        </article>
      </section>

      <article className="mesh-card gw-history" id="gw-history">
        <header>
          <h3><Icon name="clock" size={14} /> Uplink History</h3>
          <a href="#gw-history">View All</a>
        </header>
        <div className="mesh-table-wrap">
          <table className="mesh-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Status</th>
                <th>Transferred</th>
                <th>Packets</th>
                <th>Duration</th>
                <th>Latency (est.)</th>
                <th>Message ID</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((row) => (
                <tr key={row.message}>
                  <td>{row.time}</td>
                  <td><span className="mesh-online"><i /> Success</span></td>
                  <td>{row.bytes} bytes</td>
                  <td>{row.packets}</td>
                  <td>{row.duration}</td>
                  <td>{row.latency}</td>
                  <td>{row.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
      </div>
    </div>
  );
}
