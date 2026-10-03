"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/icon";
import {
  NOTICES,
  getNoticeStatus,
  loadReadIds,
  loadStatusMap,
  saveReadIds,
  saveStatusMap,
  type Notice,
  type NoticeStatus,
} from "@/lib/notifications";

export default function HeaderNotifications() {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [statusMap, setStatusMap] = useState<Record<string, NoticeStatus>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReadIds(loadReadIds());
    setStatusMap(loadStatusMap());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setReadIds(loadReadIds());
    setStatusMap(loadStatusMap());
    const onPointer = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unreadCount = useMemo(
    () => NOTICES.filter((item) => getNoticeStatus(item.id, readIds, statusMap) !== "read").length,
    [readIds, statusMap],
  );

  const preview = useMemo(() => NOTICES.slice(0, 6), []);
  const badge = !ready ? null : unreadCount > 9 ? "9+" : unreadCount > 0 ? String(unreadCount) : null;

  const markRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
    setStatusMap((prev) => {
      const next = { ...prev, [id]: "read" as const };
      saveStatusMap(next);
      return next;
    });
  };

  const markAllRead = () => {
    const next = new Set(NOTICES.map((item) => item.id));
    setReadIds(next);
    saveReadIds(next);
    const statusNext = Object.fromEntries(NOTICES.map((n) => [n.id, "read" as const]));
    setStatusMap(statusNext);
    saveStatusMap(statusNext);
  };

  const openNotice = (notice: Notice) => {
    markRead(notice.id);
    setOpen(false);
    if (notice.href) router.push(notice.href);
  };

  return (
    <div className={`notify-menu${open ? " open" : ""}`} ref={wrapRef}>
      <button
        className="notify-button"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15 17H6.2a1 1 0 0 1-.8-1.6C6.2 14.4 7 13 7 10a5 5 0 0 1 10 0c0 3 .8 4.4 1.6 5.4a1 1 0 0 1-.8 1.6H15Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M10 17a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {badge && <b>{badge}</b>}
      </button>

      {open && (
        <div className="notify-panel" role="dialog" aria-label="Notifications">
          <div className="notify-panel-head">
            <div>
              <strong>Notifications</strong>
              <small>{unreadCount} unread</small>
            </div>
            <button type="button" className="notify-mark-all" onClick={markAllRead} disabled={unreadCount === 0}>
              Mark all read
            </button>
          </div>

          <div className="notify-list">
            {preview.map((notice) => {
              const unread = getNoticeStatus(notice.id, readIds, statusMap) !== "read";
              return (
                <button
                  key={notice.id}
                  type="button"
                  className={`notify-item ${notice.level === "warning" ? "high" : notice.level}${unread ? " unread" : ""}`}
                  onClick={() => openNotice(notice)}
                >
                  <span className="notify-item-icon">
                    <Icon name={notice.icon} size={15} />
                  </span>
                  <span className="notify-item-body">
                    <strong>
                      {notice.title}
                      {unread && <i aria-hidden="true" />}
                    </strong>
                    <span>{notice.detail}</span>
                    <small>
                      <Icon name="clock" size={11} />
                      {notice.relative}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="notify-panel-foot">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/notifications");
              }}
            >
              View all
              <Icon name="arrow" size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
