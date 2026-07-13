import {
  Activity,
  BarChart3,
  Dumbbell,
  LayoutDashboard,
  MessageCircleHeart,
  Settings,
  Utensils,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigation = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Workout", path: "/workout", icon: Dumbbell },
  { label: "Progress", path: "/progress", icon: BarChart3 },
  { label: "Nutrition", path: "/nutrition", icon: Utensils },
  { label: "AI Coach", path: "/coach", icon: MessageCircleHeart },
  { label: "Settings", path: "/settings", icon: Settings },
];

function Sidebar() {
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

      <nav className="sidebar__nav" aria-label="Main navigation">
        {navigation.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__profile">
        <div className="sidebar__avatar">RK</div>

        <div>
          <strong>Rohith</strong>
          <span>View profile</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
