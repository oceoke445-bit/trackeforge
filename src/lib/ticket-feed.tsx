"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

export type TicketFeedMode = "mock" | "live";
export type TicketFeedStatus = "idle" | "loading" | "stalled";

type TicketFeedValue = {
  mode: TicketFeedMode;
  status: TicketFeedStatus;
  pending: TicketFeedMode | null;
  runId: number;
  reload: (mode: TicketFeedMode) => void;
  finish: (runId: number) => void;
  fail: (runId: number) => void;
  cancel: () => void;
};

const TicketFeedContext = createContext<TicketFeedValue | null>(null);
const STALL_MS = 8000;

export function TicketFeedProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<TicketFeedMode>("mock");
  const [status, setStatus] = useState<TicketFeedStatus>("idle");
  const [pending, setPending] = useState<TicketFeedMode | null>(null);
  const [runId, setRunId] = useState(0);
  const token = useRef(0);
  const pendingRef = useRef<TicketFeedMode | null>(null);
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

  const reload = useCallback((next: TicketFeedMode) => {
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
    <TicketFeedContext.Provider value={{ mode, status, pending, runId, reload, finish, fail, cancel }}>
      {children}
    </TicketFeedContext.Provider>
  );
}

export function useTicketFeed() {
  const context = useContext(TicketFeedContext);
  if (!context) throw new Error("useTicketFeed must be used within TicketFeedProvider");
  return context;
}
