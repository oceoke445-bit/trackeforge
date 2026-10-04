"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { readSessionUser } from "@/lib/session";

type AccessSessionValue = {
  userId: number | null;
  permissions: string[] | null;
  revision: number;
  setAccessUser: (userId: number, permissions: string[]) => void;
  clearAccessUser: () => void;
  touchAccess: () => void;
};

const AccessSessionContext = createContext<AccessSessionValue | null>(null);

export function AccessProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [revision, setRevision] = useState(0);
  const setAccessUser = useCallback((nextId: number, nextPermissions: string[]) => {
    setUserId(nextId);
    setPermissions(nextPermissions);
  }, []);
  const clearAccessUser = useCallback(() => {
    setUserId(null);
    setPermissions(null);
  }, []);
  const touchAccess = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    const signedIn = readSessionUser();
    if (!signedIn) return;
    setUserId(signedIn.id);
    setPermissions(signedIn.permissions);
  }, []);
  const value = useMemo<AccessSessionValue>(() => ({
    userId,
    permissions,
    revision,
    setAccessUser,
    clearAccessUser,
    touchAccess,
  }), [clearAccessUser, permissions, revision, setAccessUser, touchAccess, userId]);

  return <AccessSessionContext.Provider value={value}>{children}</AccessSessionContext.Provider>;
}

export function useAccessSession() {
  const context = useContext(AccessSessionContext);
  if (!context) throw new Error("useAccessSession must be used within AccessProvider");
  return context;
}
