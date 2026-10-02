"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/icon";
import { navItems } from "@/components/data/fleet";

export default function Sidebar({
  onMouseEnter,
  onMouseLeave,
}: {
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="sidebar" id="app-sidebar" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="brand">
        <div className="brand-icon">
          <span />
          <span />
          <span />
        </div>
        <div>
          <strong>TRACKFORGE</strong>
          <small>Fleet Intelligence</small>
        </div>
      </div>
      <nav>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={active ? "active" : ""}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.label === "Alerts" && <b>24</b>}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div className="system">
          <div>
            <span />
            <strong>All systems operational</strong>
          </div>
        </div>
      </div>
    </aside>
  );
}
