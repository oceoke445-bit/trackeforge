"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

export default function Dropdown({
  value,
  onChange,
  options,
  block,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  block?: boolean;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState({ top: 0, left: 0, width: 160 });
  const root = useRef<HTMLDivElement>(null);

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

  function toggle() {
    const rect = root.current?.getBoundingClientRect();
    if (!rect) return;
    const height = Math.min(options.length * 34 + 8, 240);
    const below = rect.bottom + 4;
    const top = below + height > window.innerHeight ? Math.max(8, rect.top - height - 4) : below;
    const width = Math.max(rect.width, 168);
    const left = Math.min(rect.left, window.innerWidth - width - 8);
    setBox({ top, left: Math.max(8, left), width });
    setOpen((current) => !current);
  }

  return (
    <div className={`ui-drop${block ? " block" : ""}${open ? " open" : ""}`} ref={root}>
      <button type="button" aria-label={ariaLabel} aria-expanded={open} onClick={toggle}>
        <span>{value}</span>
        <Icon name="chevron" size={14} />
      </button>
      {open ? (
        <ul role="listbox" style={{ top: box.top, left: box.left, width: box.width }}>
          {options.map((item) => (
            <li key={item}>
              <button type="button" role="option" aria-selected={item === value} className={item === value ? "on" : ""} onClick={() => { onChange(item); setOpen(false); }}>
                {item}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
