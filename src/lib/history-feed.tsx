"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

export type HistoryFeedMode = "mock" | "live";
export type HistoryFeedStatus = "idle" | "loading" | "stalled";

type HistoryFeedValue = {
  mode: HistoryFeedMode;
  status: HistoryFeedStatus;
  pending: HistoryFeedMode | null;
  runId: number;
  reload: (mode: HistoryFeedMode) => void;
  finish: (runId: number) => void;
  fail: (runId: number) => void;
  cancel: () => void;
};

const HistoryFeedContext = createContext<HistoryFeedValue | null>(null);
const STALL_MS = 8000;

export function HistoryFeedProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<HistoryFeedMode>("mock");
  const [status, setStatus] = useState<HistoryFeedStatus>("idle");
  const [pending, setPending] = useState<HistoryFeedMode | null>(null);
  const [runId, setRunId] = useState(0);
  const token = useRef(0);
  const pendingRef = useRef<HistoryFeedMode | null>(null);
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

  const reload = useCallback((next: HistoryFeedMode) => {
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
    <HistoryFeedContext.Provider value={{ mode, status, pending, runId, reload, finish, fail, cancel }}>
      {children}
    </HistoryFeedContext.Provider>
  );
}

export function useHistoryFeed() {
  const context = useContext(HistoryFeedContext);
  if (!context) throw new Error("useHistoryFeed must be used within HistoryFeedProvider");
  return context;
}
