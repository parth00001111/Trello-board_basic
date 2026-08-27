import { LayoutDashboard, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import useAuth from "../hooks/useAuth";
import Brand from "./Brand";
import UserAvatar from "./UserAvatar";

const AppShell = ({ children, wide = false, headerContent = null }) => {
  const { user, clearSession } = useAuth();
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await api.post("/logout");
    } finally {
      clearSession();
      navigate("/signin", { replace: true });
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <Brand to="/dashboard" compact />

          <nav className="app-main-nav" aria-label="Workspace navigation">
            <Link to="/dashboard">
              <LayoutDashboard size={17} />
              Workspaces
            </Link>
          </nav>

          <div className="app-account">
            <div className="app-account-copy">
              <span>Signed in as</span>
              <strong>{user?.username}</strong>
            </div>
            <UserAvatar name={user?.username} size="md" />
            <button
              className="btn btn-ghost btn-icon app-logout"
              type="button"
              onClick={logout}
              aria-label="Log out"
              title="Log out"
            >
              <LogOut size={19} />
            </button>
          </div>
        </div>
        {headerContent}
      </header>

      <main className={wide ? "app-main app-main-wide" : "app-main"}>{children}</main>
    </div>
  );
};

export default AppShell;
