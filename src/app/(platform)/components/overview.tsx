"use client";

import { useState } from "react";
import Icon from "@/components/ui/icon";
import MapCanvas from "@/components/shared/map-canvas";
import { activities, stats, vehicles } from "@/components/data/fleet";

export default function Overview() {
  const [selected, setSelected] = useState(0);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">FLEET COMMAND CENTER</p>
          <h1>Good afternoon, Rizky</h1>
          <p>{"Here's what's happening across your fleet right now."}</p>
        </div>
        <div className="heading-actions">
          <span className="last-updated">
            <i /> Updated 12 sec ago
          </span>
          <button className="secondary">
            <Icon name="file" size={16} /> Export
          </button>
          <button className="primary">
            <Icon name="plus" size={17} /> Add device
          </button>
        </div>
      </div>
      <section className="stat-grid">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div className={`stat-icon ${stat.tone}`}>
              <Icon name={stat.icon} />
            </div>
            <div>
              <p>{stat.label}</p>
              <strong>
                {stat.value}
                {stat.suffix && <small> {stat.suffix}</small>}
              </strong>
              <span className={stat.tone === "red" || stat.tone === "orange" ? "down" : ""}>{stat.meta}</span>
            </div>
            <button aria-label="More">
              <Icon name="more" size={17} />
            </button>
          </article>
        ))}
      </section>
      <section className="overview-main">
        <div className="map-panel panel">
          <div className="panel-header">
            <div>
              <h2>Live fleet map</h2>
              <p>Real-time locations and movement</p>
            </div>
            <div className="map-stats">
              <span>
                <i className="moving" />
                843 Moving
              </span>
              <span>
                <i className="idle" />
                281 Idle
              </span>
              <span>
                <i className="offline-dot" />
                62 Offline
              </span>
              <button>
                All vehicles <Icon name="chevron" size={13} />
              </button>
            </div>
          </div>
          <MapCanvas selected={selected} onSelect={setSelected} />
          <div className="selected-popover">
            <div className="popover-title">
              <span className="vehicle-thumb">
                <Icon name="truck" />
              </span>
              <div>
                <strong>{vehicles[selected]?.name || "Truck 042"}</strong>
                <small>
                  {vehicles[selected]?.plate || "B 1942 UZY"} · <i /> Online
                </small>
              </div>
              <button>
                <Icon name="more" size={18} />
              </button>
            </div>
            <div className="popover-data">
              <span>
                <small>SPEED</small>
                <strong>{vehicles[selected]?.speed || "72 km/h"}</strong>
              </span>
              <span>
                <small>DRIVER</small>
                <strong>{vehicles[selected]?.driver.split(" ")[0] || "Rizky"}</strong>
              </span>
              <span>
                <small>UPDATED</small>
                <strong>{vehicles[selected]?.update || "Now"}</strong>
              </span>
            </div>
            <button className="view-details">
              View vehicle details <Icon name="arrow" size={15} />
            </button>
          </div>
        </div>
        <div className="activity-panel panel">
          <div className="panel-header">
            <div>
              <h2>Live activity</h2>
              <p>Latest fleet events</p>
            </div>
            <button className="more-button">
              <Icon name="more" />
            </button>
          </div>
          <div className="activity-list">
            {activities.map((activity, i) => (
              <div className="activity" key={i}>
                <div className={`activity-icon ${activity.type}`}>
                  <Icon name={activity.icon} size={16} />
                </div>
                <div>
                  <strong>{activity.title}</strong>
                  <span>{activity.subject}</span>
                  <small>
                    <Icon name="clock" size={12} />
                    {activity.time}
                  </small>
                </div>
                {activity.type === "critical" && <i className="unread" />}
              </div>
            ))}
          </div>
          <button className="all-activity">
            View all activity <Icon name="arrow" size={15} />
          </button>
        </div>
      </section>
      <section className="bottom-grid">
        <div className="panel fleet-table">
          <div className="panel-header">
            <div>
              <h2>Fleet status</h2>
              <p>Vehicles requiring your attention</p>
            </div>
            <button>
              View all vehicles <Icon name="arrow" size={15} />
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>VEHICLE</th>
                <th>DRIVER</th>
                <th>STATUS</th>
                <th>SPEED</th>
                <th>LAST UPDATE</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {vehicles.slice(0, 4).map((v, i) => (
                <tr key={i}>
                  <td>
                    <span className="table-vehicle">
                      <Icon name="truck" size={17} />
                    </span>
                    <strong>{v.name}</strong>
                    <small>{v.plate}</small>
                  </td>
                  <td>{v.driver}</td>
                  <td>
                    <span className={`status ${v.status.toLowerCase()}`}>
                      <i />
                      {v.status}
                    </span>
                  </td>
                  <td>{v.speed}</td>
                  <td>{v.update}</td>
                  <td>
                    <Icon name="more" size={17} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel health-panel">
          <div className="panel-header">
            <div>
              <h2>Device health</h2>
              <p>Network overview</p>
            </div>
            <button>
              <Icon name="more" />
            </button>
          </div>
          <div className="donut-wrap">
            <div className="donut">
              <div>
                <strong>95%</strong>
                <span>Healthy</span>
              </div>
            </div>
            <div className="health-legend">
              <span>
                <i className="healthy" />
                Healthy <b>1,186</b>
              </span>
              <span>
                <i className="warning-dot" />
                Warning <b>42</b>
              </span>
              <span>
                <i className="critical-dot" />
                Critical <b>20</b>
              </span>
            </div>
          </div>
          <div className="health-footer">
            <span>
              Average uptime <strong>99.7%</strong>
            </span>
            <span>
              Avg. signal <strong>−68 dBm</strong>
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
