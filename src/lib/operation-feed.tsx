"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

export type OperationFeedMode = "mock" | "live";
export type OperationFeedStatus = "idle" | "loading" | "stalled";

type OperationFeedValue = {
  mode: OperationFeedMode;
  status: OperationFeedStatus;
  pending: OperationFeedMode | null;
  runId: number;
  reload: (mode: OperationFeedMode) => void;
  finish: (runId: number) => void;
  fail: (runId: number) => void;
  cancel: () => void;
};

const OperationFeedContext = createContext<OperationFeedValue | null>(null);
const STALL_MS = 8000;

export function OperationFeedProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<OperationFeedMode>("mock");
  const [status, setStatus] = useState<OperationFeedStatus>("idle");
  const [pending, setPending] = useState<OperationFeedMode | null>(null);
  const [runId, setRunId] = useState(0);
  const token = useRef(0);
  const pendingRef = useRef<OperationFeedMode | null>(null);
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

  const reload = useCallback((next: OperationFeedMode) => {
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
    <OperationFeedContext.Provider value={{ mode, status, pending, runId, reload, finish, fail, cancel }}>
      {children}
    </OperationFeedContext.Provider>
  );
}

export function useOperationFeed() {
  const context = useContext(OperationFeedContext);
  if (!context) throw new Error("useOperationFeed must be used within OperationFeedProvider");
  return context;
}
