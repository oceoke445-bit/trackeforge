"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseIso(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function toIso(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function pretty(iso: string) {
  if (!iso) return "";
  const date = parseIso(iso);
  return `${String(date.getDate()).padStart(2, "0")} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export default function CalendarRange({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  const today = toIso(new Date());
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(from || today);
  const [anchor, setAnchor] = useState("");
  const [hover, setHover] = useState("");
  const [place, setPlace] = useState({ top: 0, left: 0 });
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
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
  }, [open]);

  const shown = parseIso(cursor || today);
  const year = shown.getFullYear();
  const month = shown.getMonth();
  const lead = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const cells: { iso: string; day: number; outside: boolean }[] = [];
  for (let index = 0; index < lead; index += 1) {
    const date = new Date(year, month, index - lead + 1);
    cells.push({ iso: toIso(date), day: date.getDate(), outside: true });
  }
  for (let day = 1; day <= count; day += 1) cells.push({ iso: toIso(new Date(year, month, day)), day, outside: false });
  const tail = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= tail; day += 1) cells.push({ iso: toIso(new Date(year, month + 1, day)), day, outside: true });

  const draftEnd = anchor ? hover || anchor : "";
  const rangeStart = anchor ? (anchor < draftEnd ? anchor : draftEnd) : from < to ? from : to;
  const rangeEnd = anchor ? (anchor < draftEnd ? draftEnd : anchor) : from < to ? to : from;

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = trigger.current?.getBoundingClientRect();
    if (rect) {
      const width = 292;
      const height = 348;
      const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
      const below = rect.bottom + 6;
      const top = below + height > window.innerHeight ? Math.max(8, rect.top - height - 6) : below;
      setPlace({ top, left });
    }
    setCursor(from || to || today);
    setAnchor("");
    setHover("");
    setOpen(true);
  }

  function pick(iso: string) {
    if (!anchor) {
      setAnchor(iso);
      setHover(iso);
      return;
    }
    const nextFrom = anchor < iso ? anchor : iso;
    const nextTo = anchor < iso ? iso : anchor;
    onChange(nextFrom, nextTo);
    setAnchor("");
    setHover("");
    setOpen(false);
  }

  return (
    <div className="cal-range" ref={root}>
      <button ref={trigger} type="button" className={open ? "on" : ""} onClick={toggle}>
        <Icon name="calendar" size={13} />
        <span>{from && to ? `${pretty(from)} - ${pretty(to)}` : "Select dates"}</span>
      </button>
      {open ? (
        <div className="cal-pop" style={{ top: place.top, left: place.left }}>
          <header>
            <strong>{MONTHS[month]} {year}</strong>
            <button type="button" aria-label="Previous month" onClick={() => setCursor(toIso(new Date(year, month - 1, 1)))}><Icon name="chevron" size={14} /></button>
            <button type="button" aria-label="Next month" onClick={() => setCursor(toIso(new Date(year, month + 1, 1)))}><Icon name="chevron" size={14} /></button>
          </header>
          <div className="cal-week">
            {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="cal-grid">
            {cells.map((cell) => {
              const inRange = Boolean(rangeStart && rangeEnd && cell.iso >= rangeStart && cell.iso <= rangeEnd);
              const edge = cell.iso === rangeStart || cell.iso === rangeEnd;
              return (
                <button
                  key={cell.iso}
                  type="button"
                  className={`${cell.outside ? "out" : ""}${inRange ? " in" : ""}${edge ? " edge" : ""}${cell.iso === today ? " today" : ""}`}
                  onMouseEnter={() => anchor && setHover(cell.iso)}
                  onClick={() => pick(cell.iso)}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
          <footer>
            <button type="button" onClick={() => { onChange("", ""); setAnchor(""); }}>Clear</button>
            <button type="button" onClick={() => { onChange(today, today); setCursor(today); setAnchor(""); setOpen(false); }}>Today</button>
          </footer>
        </div>
      ) : null}
    </div>
  );
}
