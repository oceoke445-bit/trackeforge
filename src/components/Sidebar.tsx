"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/icon";
import { navGroups } from "@/components/data/fleet";

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
        <img className="brand-mark" src="/images/traxon-mark.png" alt="" aria-hidden="true" />
        <img className="brand-wordmark" src="/images/traxon-wordmark.png" alt="Traxon" />
      </div>
      <nav>
        {navGroups.map((group) => (
          <div key={group.label ?? "main"} className="nav-group">
            {group.label && <p className="nav-group-label">{group.label}</p>}
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={active ? "active" : ""}>
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                  {item.label === "Alerts" && <b>36</b>}
                </Link>
              );
            })}
          </div>
        ))}
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
