"use client";

import { usePathname } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { SidebarProvider, useSidebar } from "@/lib/sidebar";

function Shell({ children }: { children: ReactNode }) {
  const { open } = useSidebar();
  const [peek, setPeek] = useState(false);
  const leaveTimer = useRef<number | null>(null);

  const onSidebarEnter = () => {
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    if (!open) setPeek(true);
  };

  const onSidebarLeave = () => {
    leaveTimer.current = window.setTimeout(() => setPeek(false), 120);
  };

  return (
    <div className={`app-shell themed-shell ${open ? "" : "sidebar-collapsed"} ${!open && peek ? "sidebar-peek" : ""}`}>
      <Sidebar onMouseEnter={onSidebarEnter} onMouseLeave={onSidebarLeave} />
      <div className="workspace">
        <TopHeader />
        <main>{children}</main>
      </div>
    </div>
  );
}

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") return children;

  return (
    <SidebarProvider>
      <Shell>{children}</Shell>
    </SidebarProvider>
  );
}
