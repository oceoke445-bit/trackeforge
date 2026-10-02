"use client";

import { useSidebar } from "@/lib/sidebar";

export default function SidebarToggle() {
  const { open, toggle } = useSidebar();

  return (
    <button
      type="button"
      className="menu-button"
      onClick={toggle}
      aria-label={open ? "Tutup sidebar" : "Buka sidebar"}
      aria-expanded={open}
      aria-controls="app-sidebar"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 3v18" stroke="currentColor" strokeWidth="1.8" />
        {open ? (
          <path d="m16 15-3-3 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="m14 9 3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}
