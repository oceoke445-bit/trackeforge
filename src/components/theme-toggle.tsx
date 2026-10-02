"use client";

import { useTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-switch" role="group" aria-label="Pilih tema warna">
      <button
        type="button"
        className={theme === "blue" ? "on" : ""}
        onClick={() => setTheme("blue")}
        aria-label="Tema gelap"
        aria-pressed={theme === "blue"}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 15.5A8.2 8.2 0 0 1 9.2 4 7 7 0 1 0 20 15.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        className={theme === "gray" ? "on" : ""}
        onClick={() => setTheme("gray")}
        aria-label="Tema terang"
        aria-pressed={theme === "gray"}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
