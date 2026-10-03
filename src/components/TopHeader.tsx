import HeaderClock from "@/components/header-clock";
import HeaderNotifications from "@/components/header-notifications";
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
        <HeaderNotifications />
        <span className="top-divider" aria-hidden="true" />
        <HeaderUser />
      </div>
    </header>
  );
}
