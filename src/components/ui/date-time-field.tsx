"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/ui/icon";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toLocalValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseLocalValue(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
    );
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function pretty(value: string) {
  const date = parseLocalValue(value);
  if (!date) return "";
  return `${pad(date.getDate())} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()} · ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function snapMinute(minute: number) {
  return Math.min(55, Math.round(minute / 5) * 5);
}

function monthCells(year: number, month: number) {
  const lead = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const cells: { key: string; day: number; date: Date; outside: boolean }[] = [];
  for (let index = 0; index < lead; index += 1) {
    const date = new Date(year, month, index - lead + 1);
    cells.push({ key: `o-${toLocalValue(date)}`, day: date.getDate(), date, outside: true });
  }
  for (let day = 1; day <= count; day += 1) {
    const date = new Date(year, month, day);
    cells.push({ key: toLocalValue(date), day, date, outside: false });
  }
  const tail = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= tail; day += 1) {
    const date = new Date(year, month + 1, day);
    cells.push({ key: `t-${toLocalValue(date)}`, day: date.getDate(), date, outside: true });
  }
  return cells;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function DateTimeField({
  value,
  onChange,
  placeholder = "Select date & time",
  required = false,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  ariaLabel?: string;
}) {
  const labelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [place, setPlace] = useState({ top: 0, left: 0 });
  const [draft, setDraft] = useState(() => parseLocalValue(value) || new Date());
  const [cursor, setCursor] = useState(() => {
    const base = parseLocalValue(value) || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) return;
    const parsed = parseLocalValue(value);
    if (parsed) setDraft(parsed);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (root.current?.contains(target)) return;
      const pop = document.getElementById(labelId);
      if (pop?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [labelId, open]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => monthCells(year, month), [month, year]);
  const today = useMemo(() => new Date(), [open]);
  const hour = pad(draft.getHours());
  const minute = pad(snapMinute(draft.getMinutes()));

  function openPicker() {
    const parsed = parseLocalValue(value) || new Date();
    const next = new Date(parsed);
    next.setMinutes(snapMinute(next.getMinutes()), 0, 0);
    setDraft(next);
    setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
    const rect = trigger.current?.getBoundingClientRect();
    if (rect) {
      const width = 320;
      const height = 420;
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
      const below = rect.bottom + 8;
      const top = below + height > window.innerHeight - 8
        ? Math.max(8, rect.top - height - 8)
        : below;
      setPlace({ top, left });
    }
    setOpen(true);
  }

  function commit(next: Date) {
    const normalized = new Date(next);
    normalized.setMinutes(snapMinute(normalized.getMinutes()), 0, 0);
    setDraft(normalized);
    onChange(toLocalValue(normalized));
  }

  function pickDay(date: Date) {
    const next = new Date(draft);
    next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    commit(next);
    setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  function setHour(nextHour: string) {
    const next = new Date(draft);
    next.setHours(Number(nextHour));
    commit(next);
  }

  function setMinute(nextMinute: string) {
    const next = new Date(draft);
    next.setMinutes(Number(nextMinute));
    commit(next);
  }

  const popover = open && mounted
    ? createPortal(
        <div
          id={labelId}
          className="dtf-pop"
          style={{ top: place.top, left: place.left }}
          role="dialog"
          aria-label={ariaLabel || "Choose date and time"}
        >
          <header className="dtf-pop-head">
            <div>
              <strong>{MONTHS[month]} {year}</strong>
              <small>{pretty(toLocalValue(draft)) || "Pick a day and time"}</small>
            </div>
            <div className="dtf-nav">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setCursor(new Date(year, month - 1, 1))}
              >
                <Icon name="chevron" size={14} />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setCursor(new Date(year, month + 1, 1))}
              >
                <Icon name="chevron" size={14} />
              </button>
            </div>
          </header>

          <div className="dtf-week">
            {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
          </div>

          <div className="dtf-grid">
            {cells.map((cell) => {
              const selected = sameDay(cell.date, draft);
              const isToday = sameDay(cell.date, today);
              return (
                <button
                  key={cell.key}
                  type="button"
                  className={`${cell.outside ? "out" : ""}${selected ? " on" : ""}${isToday ? " today" : ""}`}
                  onClick={() => pickDay(cell.date)}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <section className="dtf-time">
            <div>
              <span>Hour</span>
              <div className="dtf-chips">
                {HOURS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={hour === item ? "on" : ""}
                    onClick={() => setHour(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span>Minute</span>
              <div className="dtf-chips">
                {MINUTES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={minute === item ? "on" : ""}
                    onClick={() => setMinute(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <footer className="dtf-foot">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </button>
            <div>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  now.setMinutes(snapMinute(now.getMinutes()), 0, 0);
                  commit(now);
                  setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
                }}
              >
                Now
              </button>
              <button type="button" className="primary" onClick={() => setOpen(false)}>
                Done
              </button>
            </div>
          </footer>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className={`dtf${open ? " open" : ""}`} ref={root}>
      <button
        ref={trigger}
        type="button"
        className="dtf-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openPicker())}
      >
        <Icon name="calendar" size={14} />
        <span className={value ? "" : "muted"}>{value ? pretty(value) : placeholder}</span>
      </button>
      {required ? (
        <input
          tabIndex={-1}
          aria-hidden="true"
          className="dtf-required"
          value={value}
          onChange={() => undefined}
          required
        />
      ) : null}
      {popover}
    </div>
  );
}
