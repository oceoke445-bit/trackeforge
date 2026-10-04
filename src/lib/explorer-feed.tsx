"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

export type ExplorerFeedMode = "mock" | "live";
export type ExplorerFeedStatus = "idle" | "loading" | "stalled";

type ExplorerFeedValue = {
  mode: ExplorerFeedMode;
  status: ExplorerFeedStatus;
  pending: ExplorerFeedMode | null;
  runId: number;
  reload: (mode: ExplorerFeedMode) => void;
  finish: (runId: number) => void;
  fail: (runId: number) => void;
  cancel: () => void;
};

const ExplorerFeedContext = createContext<ExplorerFeedValue | null>(null);
const STALL_MS = 8000;

export function ExplorerFeedProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ExplorerFeedMode>("mock");
  const [status, setStatus] = useState<ExplorerFeedStatus>("idle");
  const [pending, setPending] = useState<ExplorerFeedMode | null>(null);
  const [runId, setRunId] = useState(0);
  const token = useRef(0);
  const pendingRef = useRef<ExplorerFeedMode | null>(null);
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

  const reload = useCallback((next: ExplorerFeedMode) => {
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
    <ExplorerFeedContext.Provider value={{ mode, status, pending, runId, reload, finish, fail, cancel }}>
      {children}
    </ExplorerFeedContext.Provider>
  );
}

export function useExplorerFeed() {
  const context = useContext(ExplorerFeedContext);
  if (!context) throw new Error("useExplorerFeed must be used within ExplorerFeedProvider");
  return context;
}
