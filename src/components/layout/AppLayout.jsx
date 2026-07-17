import { Bell, Menu } from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      <div
        className={`sidebar-wrapper ${
          isSidebarOpen ? "sidebar-wrapper--open" : ""
        }`}
      >
        <Sidebar onNavigate={closeSidebar} />
      </div>

      {isSidebarOpen && (
        <button
          className="sidebar-overlay"
          type="button"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      <main className="app-main">
        <header className="topbar">
          <button
            className="icon-button topbar__menu"
            type="button"
            aria-label="Open navigation"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div className="topbar__title">
            <span>FitCircle</span>
          </div>

          <button
            className="icon-button"
            type="button"
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>
        </header>

        <div className="app-content" onClick={closeSidebar}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
