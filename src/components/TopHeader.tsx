import HeaderClock from "@/components/header-clock";
import HeaderUser from "@/components/header-user";
import Icon from "@/components/ui/icon";
import SidebarToggle from "@/components/sidebar-toggle";
// import ThemeToggle from "@/components/theme-toggle";

export default function TopHeader() {
  return (
    <header className="topbar">
      <div className="top-left">
        <SidebarToggle />
        <div className="global-search">
          <Icon name="search" size={17} />
          <input placeholder="Search vehicle, device, driver..." />
          <kbd>⌘ K</kbd>
        </div>
      </div>
      <div className="top-actions">
        {/* <ThemeToggle /> */}
        <HeaderClock />
        <button className="notify-button" aria-label="Notifications" type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 17H6.2a1 1 0 0 1-.8-1.6C6.2 14.4 7 13 7 10a5 5 0 0 1 10 0c0 3 .8 4.4 1.6 5.4a1 1 0 0 1-.8 1.6H15Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M10 17a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <b>9+</b>
        </button>
        <span className="top-divider" aria-hidden="true" />
        <HeaderUser />
      </div>
    </header>
  );
}
