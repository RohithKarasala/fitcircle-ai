import {
  Bell,
  Dumbbell,
  LoaderCircle,
  Menu,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/useAuth";
import { useGroupActivity } from "../../hooks/useGroups";
import { formatDate } from "../../utils/date";

const GROUP_ACTIVITY_SEEN_KEY = "fitcircle-group-activity-seen-at";

function getStoredActivitySeenAt() {
  try {
    return localStorage.getItem(GROUP_ACTIVITY_SEEN_KEY) ?? "";
  } catch {
    return "";
  }
}

function getTimestamp(value) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getLatestActivityAt(notifications) {
  return notifications.reduce((latest, item) => {
    const latestTime = getTimestamp(latest);
    const itemTime = getTimestamp(item.sharedAt);

    return itemTime > latestTime ? item.sharedAt : latest;
  }, "");
}

function AppLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] =
    useState(false);
  const [lastSeenActivityAt, setLastSeenActivityAt] = useState(
    getStoredActivitySeenAt,
  );
  const {
    data: notifications = [],
    isLoading: isNotificationsLoading,
  } = useGroupActivity({
    enabled: Boolean(user),
  });

  const latestActivityAt = useMemo(
    () => getLatestActivityAt(notifications),
    [notifications],
  );

  const unreadCount = useMemo(() => {
    const seenTime = getTimestamp(lastSeenActivityAt);

    return notifications.filter((item) => {
      const sharedTime = getTimestamp(item.sharedAt);

      return sharedTime > seenTime;
    }).length;
  }, [lastSeenActivityAt, notifications]);

  function markActivitySeen() {
    if (!latestActivityAt) {
      return;
    }

    setLastSeenActivityAt(latestActivityAt);

    try {
      localStorage.setItem(
        GROUP_ACTIVITY_SEEN_KEY,
        latestActivityAt,
      );
    } catch {
      // Local storage is a convenience only; the panel still works without it.
    }
  }

  function toggleNotifications() {
    if (!isNotificationsOpen) {
      markActivitySeen();
    }

    setIsNotificationsOpen((current) => !current);
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  function openNotification(groupId) {
    setIsNotificationsOpen(false);
    navigate(`/groups/${groupId}`);
  }

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

          <div className="topbar-notifications">
            <button
              className="icon-button topbar-notifications__button"
              type="button"
              aria-label="Notifications"
              aria-expanded={isNotificationsOpen}
              onClick={toggleNotifications}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="topbar-notifications__dot">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="topbar-notifications__panel">
                <div className="topbar-notifications__heading">
                  <strong>Group activity</strong>
                  <span>Shared workouts</span>
                </div>

                {!user ? (
                  <p className="topbar-notifications__empty">
                    Sign in to see group activity.
                  </p>
                ) : isNotificationsLoading ? (
                  <p className="topbar-notifications__empty">
                    <LoaderCircle
                      className="spin"
                      size={16}
                    />
                    Loading activity...
                  </p>
                ) : notifications.length === 0 ? (
                  <p className="topbar-notifications__empty">
                    No shared workouts yet.
                  </p>
                ) : (
                  <div className="topbar-notifications__list">
                    {notifications.map((item) => (
                      <button
                        type="button"
                        key={item.shareId}
                        className="topbar-notifications__item"
                        onClick={() =>
                          openNotification(item.groupId)
                        }
                      >
                        <span>
                          <Dumbbell
                            size={15}
                            aria-hidden="true"
                          />
                        </span>

                        <div>
                          <strong>
                            {item.displayName ||
                              "FitCircle Member"}{" "}
                            shared {item.workoutName}
                          </strong>
                          <small>
                            {item.groupName} ·{" "}
                            {formatDate(item.sharedAt)}
                          </small>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <div
          className="app-content"
          onClick={() => {
            closeSidebar();
            setIsNotificationsOpen(false);
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
