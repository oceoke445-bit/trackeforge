"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

export type AlertFeedMode = "mock" | "live";
export type AlertFeedStatus = "idle" | "loading" | "stalled";

type AlertFeedValue = {
  mode: AlertFeedMode;
  status: AlertFeedStatus;
  pending: AlertFeedMode | null;
  runId: number;
  reload: (mode: AlertFeedMode) => void;
  finish: (runId: number) => void;
  fail: (runId: number) => void;
  cancel: () => void;
};

const AlertFeedContext = createContext<AlertFeedValue | null>(null);
const STALL_MS = 8000;

export function AlertFeedProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AlertFeedMode>("mock");
  const [status, setStatus] = useState<AlertFeedStatus>("idle");
  const [pending, setPending] = useState<AlertFeedMode | null>(null);
  const [runId, setRunId] = useState(0);
  const token = useRef(0);
  const pendingRef = useRef<AlertFeedMode | null>(null);
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

  const reload = useCallback((next: AlertFeedMode) => {
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
    <AlertFeedContext.Provider value={{ mode, status, pending, runId, reload, finish, fail, cancel }}>
      {children}
    </AlertFeedContext.Provider>
  );
}

export function useAlertFeed() {
  const context = useContext(AlertFeedContext);
  if (!context) throw new Error("useAlertFeed must be used within AlertFeedProvider");
  return context;
}
