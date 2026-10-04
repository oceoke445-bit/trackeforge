"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

export type GeofenceFeedMode = "mock" | "live";
export type GeofenceFeedStatus = "idle" | "loading" | "stalled";

type GeofenceFeedValue = {
  mode: GeofenceFeedMode;
  status: GeofenceFeedStatus;
  pending: GeofenceFeedMode | null;
  runId: number;
  reload: (mode: GeofenceFeedMode) => void;
  finish: (runId: number) => void;
  fail: (runId: number) => void;
  cancel: () => void;
};

const GeofenceFeedContext = createContext<GeofenceFeedValue | null>(null);
const STALL_MS = 8000;

export function GeofenceFeedProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<GeofenceFeedMode>("mock");
  const [status, setStatus] = useState<GeofenceFeedStatus>("idle");
  const [pending, setPending] = useState<GeofenceFeedMode | null>(null);
  const [runId, setRunId] = useState(0);
  const token = useRef(0);
  const pendingRef = useRef<GeofenceFeedMode | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const cancel = useCallback(() => {
    token.current += 1;
    clearTimers();
    pendingRef.current = null;
    setPending(null);
    setStatus("idle");
  }, [clearTimers]);

  const reload = useCallback((next: GeofenceFeedMode) => {
    token.current += 1;
    const current = token.current;
    clearTimers();
    pendingRef.current = next;
    setPending(next);
    setStatus("loading");
    setRunId(current);
    const stall = window.setTimeout(() => {
      if (token.current === current) setStatus("stalled");
    }, STALL_MS);
    timers.current = [stall];
  }, [clearTimers]);

  const finish = useCallback((run: number) => {
    if (token.current !== run || !pendingRef.current) return;
    clearTimers();
    setMode(pendingRef.current);
    pendingRef.current = null;
    setPending(null);
    setStatus("idle");
  }, [clearTimers]);

  const fail = useCallback((run: number) => {
    if (token.current !== run) return;
    setStatus("stalled");
  }, []);

  return (
    <GeofenceFeedContext.Provider value={{ mode, status, pending, runId, reload, finish, fail, cancel }}>
      {children}
    </GeofenceFeedContext.Provider>
  );
}

export function useGeofenceFeed() {
  const context = useContext(GeofenceFeedContext);
  if (!context) throw new Error("useGeofenceFeed must be used within GeofenceFeedProvider");
  return context;
}
