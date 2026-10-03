"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type SidebarContextValue = {
  open: boolean;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);
const STORAGE_KEY = "traxon-sidebar";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "closed") setOpen(false);
    if (saved === "open") setOpen(true);
  }, []);

  const toggle = () => {
    setOpen((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, next ? "open" : "closed");
      return next;
    });
  };

  return <SidebarContext.Provider value={{ open, toggle }}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}
