"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useGeofenceFeed, type GeofenceFeedMode, type GeofenceFeedStatus } from "@/lib/geofence-feed";

const OPTIONS: { id: GeofenceFeedMode; label: string }[] = [
  { id: "mock", label: "Mock" },
  { id: "live", label: "Live data" },
];

export default function GeofenceFeedToggle() {
  const pathname = usePathname();
  const { mode, status, pending, reload, cancel } = useGeofenceFeed();

  useEffect(() => {
    if (pathname !== "/groups/geofence") cancel();
  }, [pathname, cancel]);

  if (pathname !== "/groups/geofence") return null;

  return (
    <>
      <div className="feed-toggle" role="group" aria-label="Geofence data source">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={mode === option.id ? `on ${option.id}` : option.id}
            aria-pressed={mode === option.id}
            disabled={status !== "idle"}
            onClick={() => {
              if (option.id === mode || status !== "idle") return;
              reload(option.id);
            }}
          >
            <i />
            {option.label}
          </button>
        ))}
      </div>
      {pending ? <FeedReloadDialog pending={pending} status={status} onCancel={cancel} /> : null}
    </>
  );
}

function FeedReloadDialog({
  pending,
  status,
  onCancel,
}: {
  pending: GeofenceFeedMode;
  status: GeofenceFeedStatus;
  onCancel: () => void;
}) {
  const name = pending === "live" ? "live data" : "mock data";
  const stalled = status === "stalled";

  return (
    <div className="feed-overlay" role="alertdialog" aria-modal="true" aria-labelledby="gfn-feed-title">
      <div className="feed-dialog">
        <span className={`feed-spinner${stalled ? " stalled" : ""}`} aria-hidden="true" />
        <h2 id="gfn-feed-title">{stalled ? "Still loading" : `Reloading ${name}`}</h2>
        <p>
          {stalled
            ? `Switching to ${name} is taking longer than usual. The feed may be stuck.`
            : `Fetching ${name}. This stays open if the request is slow.`}
        </p>
        {stalled ? (
          <div className="feed-dialog-actions">
            <button type="button" onClick={onCancel}>Cancel</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
