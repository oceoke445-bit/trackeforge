"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import MapCanvas from "@/components/shared/map-canvas";
import { vehicles } from "@/components/data/fleet";

export default function TrackingPage() {
  const [selected, setSelected] = useState(0);
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => vehicles.filter((v) => `${v.name} ${v.plate} ${v.driver}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );
  const current = vehicles[selected] || vehicles[0];

  return (
    <>
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">REAL-TIME OPERATIONS</p>
          <h1>Live Tracking</h1>
          <p>Monitor every moving asset from one command center.</p>
        </div>
        <div className="heading-actions">
          <span className="last-updated">
            <i /> Tracking 1,186 devices
          </span>
          <button className="secondary">
            <Icon name="layers" size={16} /> Map layers
          </button>
        </div>
      </div>
      <div className="tracking-shell panel">
        <aside className="vehicle-list">
          <div className="list-title">
            <h2>Vehicles</h2>
            <span>843 active</span>
          </div>
          <div className="list-search">
            <Icon name="search" size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search vehicles..." />
            <button>
              <Icon name="filter" size={15} />
            </button>
          </div>
          <div className="list-tabs">
            <button className="active">All</button>
            <button>Moving</button>
            <button>Idle</button>
            <button>Offline</button>
          </div>
          <div className="vehicle-scroll">
            {filtered.map((v) => (
              <button
                className={`vehicle-row ${vehicles.indexOf(v) === selected ? "active" : ""}`}
                onClick={() => setSelected(vehicles.indexOf(v))}
                key={v.plate}
              >
                <div className="row-top">
                  <span className="truck-icon">
                    <Icon name="truck" size={17} />
                    <i />
                  </span>
                  <div>
                    <strong>{v.name}</strong>
                    <small>{v.plate}</small>
                  </div>
                  <span className="speed">{v.speed}</span>
                </div>
                <div className="row-meta">
                  <span>{v.driver}</span>
                  <span>
                    <Icon name="clock" size={11} />
                    {v.update}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>
        <div className="tracking-map">
          <MapCanvas selected={selected} onSelect={setSelected} />
        </div>
        <aside className="vehicle-detail">
          <div className="detail-head">
            <span className="vehicle-thumb large">
              <Icon name="truck" size={23} />
            </span>
            <div>
              <span className="online-badge">
                <i /> ONLINE
              </span>
              <h2>{current.name}</h2>
              <p>{current.plate}</p>
            </div>
            <button>
              <Icon name="more" />
            </button>
          </div>
          <div className="location-block">
            <small>CURRENT LOCATION</small>
            <strong>Jl. Gatot Subroto, Jakarta Selatan</strong>
            <span>
              <Icon name="clock" size={12} /> Updated {current.update.toLowerCase()}
            </span>
          </div>
          <div className="detail-metrics">
            <div>
              <Icon name="route" />
              <span>
                <small>SPEED</small>
                <strong>{current.speed}</strong>
              </span>
            </div>
            <div>
              <Icon name="bolt" />
              <span>
                <small>BATTERY</small>
                <strong>{current.battery}</strong>
              </span>
            </div>
            <div>
              <Icon name="signal" />
              <span>
                <small>GPS ACCURACY</small>
                <strong>± 3.2 m</strong>
              </span>
            </div>
            <div>
              <Icon name="clock" />
              <span>
                <small>TRIP DURATION</small>
                <strong>1h 42m</strong>
              </span>
            </div>
          </div>
          <div className="info-list">
            <span>
              <small>Driver</small>
              <strong>{current.driver}</strong>
            </span>
            <span>
              <small>Ignition</small>
              <strong className="positive">On</strong>
            </span>
            <span>
              <small>Heading</small>
              <strong>NE · 42°</strong>
            </span>
            <span>
              <small>Device ID</small>
              <strong>DEV-08274</strong>
            </span>
          </div>
          <div className="detail-actions">
            <button className="primary">
              <Icon name="pin" size={15} /> Follow vehicle
            </button>
            <button>
              <Icon name="route" size={15} /> View route
            </button>
            <button>
              <Icon name="clock" size={15} /> Trip history
            </button>
            <button>
              <Icon name="bell" size={15} /> Create alert
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
