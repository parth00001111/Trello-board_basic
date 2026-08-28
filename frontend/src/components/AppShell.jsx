import { useState } from "react";
import { AlertCircle, LayoutDashboard, LogOut, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import useAuth from "../hooks/useAuth";
import Brand from "./Brand";
import UserAvatar from "./UserAvatar";

const AppShell = ({ children, wide = false, headerContent = null }) => {
  const { user, clearSession } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const logout = async () => {
    setLoggingOut(true);
    setLogoutError("");
    try {
      await api.post("/logout");
      clearSession();
      navigate("/signin", { replace: true });
    } catch {
      setLogoutError("We couldn’t log you out. Check your connection and try again.");
    } finally {
      setLoggingOut(false);
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
              disabled={loggingOut}
              aria-label="Log out"
              title={loggingOut ? "Logging out" : "Log out"}
            >
              {loggingOut ? <span className="spinner" aria-hidden="true" /> : <LogOut size={19} />}
            </button>
          </div>
        </div>
        {logoutError && (
          <div className="app-session-notice" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{logoutError}</span>
            <button type="button" onClick={() => setLogoutError("")} aria-label="Dismiss message">
              <X size={15} />
            </button>
          </div>
        )}
        {headerContent}
      </header>

      <main id="main-content" className={wide ? "app-main app-main-wide" : "app-main"}>
        {children}
      </main>
    </div>
  );
};

export default AppShell;
