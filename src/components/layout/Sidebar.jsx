import {
  Activity,
  BarChart3,
  Dumbbell,
  LayoutDashboard,
  LogIn,
  LogOut,
  MessageCircleHeart,
  Settings,
  Users,
  Utensils,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/useAuth";

const navigation = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Workout",
    path: "/workout",
    icon: Dumbbell,
  },
  {
    label: "Groups",
    path: "/groups",
    icon: Users,
  },
  {
    label: "Progress",
    path: "/progress",
    icon: BarChart3,
  },
  {
    label: "Nutrition",
    path: "/nutrition",
    icon: Utensils,
  },
  {
    label: "AI Coach",
    path: "/coach",
    icon: MessageCircleHeart,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

function Sidebar({ onNavigate }) {
  const {
    user,
    isLoading,
    signInWithGoogle,
    signOut,
  } = useAuth();

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "Member";

  const avatarUrl =
    user?.user_metadata?.avatar_url ??
    user?.user_metadata?.picture ??
    null;

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      onNavigate?.();
    } catch (error) {
      console.error("Google sign-in failed:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onNavigate?.();
    } catch (error) {
      console.error("Sign-out failed:", error);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <Activity size={22} />
        </div>

        <div>
          <strong>FitCircle</strong>
          <span>Powered by AI</span>
        </div>
      </div>

      <nav
        className="sidebar__nav"
        aria-label="Main navigation"
      >
        {navigation.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              `sidebar__link ${
                isActive ? "sidebar__link--active" : ""
              }`
            }
          >
            <Icon size={19} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__profile">
        {isLoading ? (
          <span className="sidebar__auth-status">
            Loading account…
          </span>
        ) : user ? (
          <>
            {avatarUrl ? (
              <img
                className="sidebar__avatar sidebar__avatar--image"
                src={avatarUrl}
                alt={`${displayName} profile`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="sidebar__avatar">
                {initials || "FC"}
              </div>
            )}

            <div className="sidebar__profile-copy">
              <strong>{displayName}</strong>
              <span>{user.email}</span>
            </div>

            <button
              type="button"
              className="sidebar__auth-button"
              aria-label="Sign out"
              title="Sign out"
              onClick={handleSignOut}
            >
              <LogOut size={17} aria-hidden="true" />
            </button>
          </>
        ) : (
          <button
            type="button"
            className="sidebar__google-button"
            onClick={handleGoogleSignIn}
          >
            <LogIn size={17} aria-hidden="true" />
            Continue with Google
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
