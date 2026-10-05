"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { ExplorerFeedProvider } from "@/lib/explorer-feed";
import { GeofenceFeedProvider } from "@/lib/geofence-feed";
import { AlertFeedProvider } from "@/lib/alert-feed";
import { HistoryFeedProvider } from "@/lib/history-feed";
import { TicketFeedProvider } from "@/lib/ticket-feed";
import { hasSession } from "@/lib/session";
import { AccessProvider } from "@/lib/access-session";
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
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const signedIn = hasSession();
    if (pathname === "/login") {
      if (signedIn) router.replace("/overview");
      else setReady(true);
      return;
    }
    if (!signedIn) {
      router.replace("/login");
      return;
    }
    if (pathname === "/") {
      router.replace("/overview");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (pathname === "/login") return children;
  if (!ready || !hasSession()) return null;

  return (
    <ExplorerFeedProvider>
      <GeofenceFeedProvider>
        <AlertFeedProvider>
          <HistoryFeedProvider>
            <TicketFeedProvider>
              <AccessProvider>
                <SidebarProvider>
                  <Shell>{children}</Shell>
                </SidebarProvider>
              </AccessProvider>
            </TicketFeedProvider>
          </HistoryFeedProvider>
        </AlertFeedProvider>
      </GeofenceFeedProvider>
    </ExplorerFeedProvider>
  );
}
