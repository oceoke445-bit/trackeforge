"use client";

import Icon from "@/components/ui/icon";

export default function MapCanvas({ selected, onSelect }: { selected: number; onSelect: (n: number) => void }) {
  const markers = [
    { x: 61, y: 30, label: "42", alert: true },
    { x: 45, y: 50, label: "18" },
    { x: 72, y: 61, label: "27" },
    { x: 30, y: 68, label: "33" },
    { x: 80, y: 38, label: "8", gray: true },
  ];

  return (
    <div className="map-canvas">
      <svg className="map-art" viewBox="0 0 900 560" preserveAspectRatio="none">
        <defs>
          <pattern id="minorGrid" width="42" height="42" patternUnits="userSpaceOnUse">
            <path d="M42 0H0V42" fill="none" stroke="var(--map-grid)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="900" height="560" fill="url(#minorGrid)" />
        <path className="water" d="M0 430C140 385 194 475 300 445c110-31 145-105 290-80 128 22 204 112 310 55v140H0Z" />
        <g className="blocks">
          <path d="m38 55 160-6 32 87-46 52-148-9Z" />
          <path d="m277 37 161 20-8 104-168-15Z" />
          <path d="m500 34 132 10 28 99-144 44-48-58Z" />
          <path d="m703 37 145 17-9 125-125-5-34-51Z" />
          <path d="m55 236 145-18 50 98-119 59-92-47Z" />
          <path d="m290 203 145 8 7 102-169 13Z" />
          <path d="m512 224 140-40 45 101-64 55-127-20Z" />
          <path d="m735 221 130-4-10 124-142 5Z" />
        </g>
        <g className="roads">
          <path d="M-20 205C170 170 318 220 456 194s249-82 472-33" />
          <path d="M219-30c-10 137 71 211 53 350-8 61-61 146-53 260" />
          <path d="M675-20c-38 132 26 211 7 341-12 82-57 134-36 259" />
          <path d="M-10 382c145-62 248-26 359-31 170-7 329-104 565-53" />
        </g>
        <path className="route-line" d="M271 382C330 321 364 326 411 286s82-19 128-68c37-39 58-49 91-50" />
        <path className="route-dash" d="M271 382C330 321 364 326 411 286s82-19 128-68c37-39 58-49 91-50" />
        <path className="geofence" d="m699 215 106 17 22 89-77 45-78-52Z" />
      </svg>
      <div className="map-label label-1">Kebayoran Baru</div>
      <div className="map-label label-2">Mampang</div>
      <div className="map-label label-3">Tebet</div>
      {markers.map((marker, i) => (
        <button
          key={i}
          className={`vehicle-marker ${selected === i ? "selected" : ""} ${marker.alert ? "alert" : ""} ${marker.gray ? "offline" : ""}`}
          style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
          onClick={() => onSelect(i)}
          aria-label={`Vehicle ${marker.label}`}
        >
          <Icon name="truck" size={15} />
          <span>{marker.label}</span>
        </button>
      ))}
      <div className="cluster" style={{ left: "36%", top: "29%" }}>12</div>
      <div className="map-toolbar">
        <button aria-label="Layers">
          <Icon name="layers" size={17} />
        </button>
        <span />
        <button aria-label="Zoom in">
          <Icon name="plus" size={18} />
        </button>
        <button aria-label="Zoom out" className="minus">−</button>
      </div>
      <div className="map-legend">
        <span>
          <i className="moving" /> Moving
        </span>
        <span>
          <i className="idle" /> Idle
        </span>
        <span>
          <i className="offline-dot" /> Offline
        </span>
      </div>
    </div>
  );
}
