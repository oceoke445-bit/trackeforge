"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  FLOW_POINTS,
  MATRIX_IDS,
  RSSI_MATRIX,
  SOLDIER_NODES,
  batteryColor,
  rssiCell,
} from "./mesh-data";
import MeshTopology from "./mesh-topology";

const RANGES = ["Last 1 Hour", "Last 6 Hours", "Last 24 Hours"] as const;

const STATS = [
  { label: "Online Nodes", value: "7 / 7", icon: "users" as const },
  { label: "Packet Delivery Rate (PDR)", value: "96.2%", delta: "+2.1%", icon: "signal" as const },
  { label: "Average RSSI", value: "−82 dBm", icon: "chart" as const },
  { label: "Average SNR", value: "7.4 dB", icon: "bolt" as const },
  { label: "Total Packets (1h)", value: "1,284", icon: "server" as const },
  { label: "Hop Count (avg)", value: "1.6", icon: "layers" as const },
];

const MESH_STATS = [
  { label: "Packets Received", value: "1,284", delta: "+12%", width: 92, tone: "up" },
  { label: "Packets Relayed", value: "1,237", delta: "+11%", width: 86, tone: "up" },
  { label: "Packets Dropped", value: "32", delta: "+2%", width: 16, tone: "down" },
  { label: "PDR", value: "96.2%", delta: "+2.1%", width: 96, tone: "up" },
];

export default function MeshStatus() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("Last 1 Hour");
  const [showHop, setShowHop] = useState(true);
  const [live] = useState(true);
  const [nodePage, setNodePage] = useState(1);
  const nodePageSize = 4;
  const nodePageCount = Math.max(1, Math.ceil(SOLDIER_NODES.length / nodePageSize));
  const nodeCurrent = Math.min(nodePage, nodePageCount);
  const nodeStart = (nodeCurrent - 1) * nodePageSize;
  const nodeRows = SOLDIER_NODES.slice(nodeStart, nodeStart + nodePageSize);
  const nodeRangeStart = SOLDIER_NODES.length === 0 ? 0 : nodeStart + 1;
  const nodeRangeEnd = Math.min(nodeStart + nodePageSize, SOLDIER_NODES.length);
  const axisLabels = useMemo(() => FLOW_POINTS.filter((_, index) => index % 5 === 0).map((point) => point.label), []);

  return (
    <div className="mesh-status">
      <header className="mesh-head page-title">
        <span className="page-title-icon" aria-hidden="true">
          <Icon name="signal" size={15} />
        </span>
        <div>
          <h2>Mesh Status</h2>
          <p>Monitor the LoRa mesh network between soldier nodes and gateway in real-time.</p>
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
          <span className={`mesh-live${live ? " on" : ""}`}>
            <i /> Live
          </span>
          <button type="button" className="mesh-refresh" onClick={() => setRange("Last 1 Hour")}>
            <Icon name="refresh" size={13} /> Refresh
          </button>
        </div>
      </header>

      <section className="mesh-stats">
        {STATS.map((stat) => (
          <article key={stat.label}>
            <span>
              <Icon name={stat.icon} size={15} />
            </span>
            <div>
              <small>{stat.label}</small>
              <strong>
                {stat.value}
                {"delta" in stat && stat.delta ? <em>{stat.delta}</em> : null}
              </strong>
            </div>
          </article>
        ))}
      </section>

      <section className="mesh-mid">
        <article className="mesh-card mesh-topo-card">
          <header>
            <div>
              <h3>Mesh Network Topology</h3>
              <p>Real-time node connections, link quality, and hop count.</p>
            </div>
          </header>
          <MeshTopology showHop={showHop} />
          <div className="mesh-hop-toggle">
            <button
              type="button"
              className={showHop ? "on" : ""}
              role="switch"
              aria-checked={showHop}
              aria-label="Show hop count"
              onClick={() => setShowHop((value) => !value)}
            >
              <i />
            </button>
            Show Hop Count
          </div>
        </article>

        <div className="mesh-side">
          <article className="mesh-card">
            <header>
              <h3>Mesh Statistics ({range})</h3>
            </header>
            <ul className="mesh-stat-rows">
              {MESH_STATS.map((row) => (
                <li key={row.label}>
                  <span>{row.label}</span>
                  <b className={row.tone}>{row.value}</b>
                  <em className={row.tone}>{row.delta}</em>
                  <i>
                    <b className={row.tone} style={{ width: `${row.width}%` }} />
                  </i>
                </li>
              ))}
            </ul>
          </article>

          <article className="mesh-card mesh-flow-card">
            <header>
              <h3>Packet Flow</h3>
              <label className="mesh-range compact">
                <select value={range} onChange={(event) => setRange(event.target.value as (typeof RANGES)[number])}>
                  {RANGES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </header>
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
        </div>
      </section>

      <section className="mesh-bottom">
        <article className="mesh-card mesh-nodes">
          <header>
            <h3>
              <Icon name="users" size={14} /> Node List (Soldier Nodes)
            </h3>
          </header>
          <div className="mesh-table-wrap">
            <table className="mesh-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Last Seen</th>
                  <th>RSSI (to GW)</th>
                  <th>SNR</th>
                  <th>Hop Count</th>
                  <th>Battery</th>
                </tr>
              </thead>
              <tbody>
                {nodeRows.map((node) => (
                  <tr key={node.id}>
                    <td><strong>{node.id}</strong></td>
                    <td><span className="mesh-online"><i /> Online</span></td>
                    <td>{node.lastSeen}</td>
                    <td>{node.rssi} dBm</td>
                    <td>{node.snr.toFixed(1)} dB</td>
                    <td>{node.hops}</td>
                    <td>
                      <span className="mesh-batt">
                        <i>
                          <b style={{ width: `${node.battery}%`, background: batteryColor(node.battery) }} />
                        </i>
                        {node.battery}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cmd-pager">
            <span>
              {nodeRangeStart}–{nodeRangeEnd} of {SOLDIER_NODES.length}
            </span>
            <div>
              <button type="button" disabled={nodeCurrent === 1} onClick={() => setNodePage(nodeCurrent - 1)} aria-label="Previous page">
                <Icon name="chevron" size={14} />
              </button>
              {Array.from({ length: nodePageCount }, (_, index) => index + 1).map((number) => (
                <button key={number} type="button" className={number === nodeCurrent ? "on" : ""} onClick={() => setNodePage(number)}>
                  {number}
                </button>
              ))}
              <button type="button" disabled={nodeCurrent === nodePageCount} onClick={() => setNodePage(nodeCurrent + 1)} aria-label="Next page">
                <Icon name="chevron" size={14} />
              </button>
            </div>
          </div>
        </article>

        <article className="mesh-card">
          <header>
            <h3>
              <Icon name="signal" size={14} /> Link Quality Matrix (RSSI to GW)
            </h3>
            <small>RSSI (dBm)</small>
          </header>
          <div className="mesh-matrix-wrap">
            <table className="mesh-matrix">
              <thead>
                <tr>
                  <th>From / To</th>
                  {MATRIX_IDS.map((id) => (
                    <th key={id}>{id}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX_IDS.map((rowId, row) => (
                  <tr key={rowId}>
                    <th>{rowId}</th>
                    {RSSI_MATRIX[row].map((value, column) => (
                      <td key={`${rowId}-${MATRIX_IDS[column]}`} style={value == null ? undefined : rssiCell(value)}>
                        {value == null ? "—" : value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
