"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/icon";
import { endSession, readSessionUser } from "@/lib/session";

function labelRole(role: string) {
  return role.split(/[_\s]+/).map((part) => part.slice(0, 1).toUpperCase() + part.slice(1)).join(" ");
}

export default function HeaderUser() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [profile, setProfile] = useState<{ name: string; role: string | null } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const signedIn = readSessionUser();
    if (signedIn) setProfile({ name: signedIn.name, role: signedIn.role });
  }, []);

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setConfirmLogout(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <>
      <div className={`user-menu ${open ? "open" : ""}`} ref={menuRef}>
        <button className="header-user" type="button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
          <span className="user-badge">
            {(profile?.name || "A").slice(0, 1)}
            <i />
          </span>
          <span className="user-copy">
            <strong>{profile?.name || "Signed in"}</strong>
            <small>{profile?.role ? labelRole(profile.role) : "No role"}</small>
          </span>
          <span className="user-caret">
            <Icon name="chevron" size={14} />
          </span>
        </button>
        {open && (
          <div className="user-dropdown" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                router.push("/profile");
              }}
            >
              <Icon name="user" size={15} />
              My Profile
            </button>
            <button
              type="button"
              role="menuitem"
              className="danger"
              onClick={() => {
                setOpen(false);
                setConfirmLogout(true);
              }}
            >
              <Icon name="logout" size={15} />
              Logout
            </button>
          </div>
        )}
      </div>
      {confirmLogout &&
        createPortal(
          <div className="logout-overlay" role="presentation" onClick={() => setConfirmLogout(false)}>
            <div className="logout-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-title" onClick={(event) => event.stopPropagation()}>
              <h2 id="logout-title">Sign <span>out</span></h2>
              <p>Your session will end. You can sign in again anytime.</p>
              <div className="logout-actions">
                <button type="button" className="logout-cancel" onClick={() => setConfirmLogout(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="logout-confirm"
                  onClick={() => {
                    setConfirmLogout(false);
                    endSession();
                    router.push("/login");
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
