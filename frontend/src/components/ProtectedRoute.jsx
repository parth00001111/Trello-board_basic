import { AlertTriangle, RefreshCw } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const ProtectedRoute = () => {
  const { user, loading, sessionError, refreshSession } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main
        id="main-content"
        className="route-loader"
        aria-busy="true"
        aria-label="Loading your workspace"
      >
        <div className="route-loader-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p>Opening your workspace…</p>
      </main>
    );
  }

  if (!user && sessionError) {
    return (
      <main className="session-error-page" id="main-content">
        <span aria-hidden="true"><AlertTriangle size={23} /></span>
        <h1>We couldn’t open your session</h1>
        <p>{sessionError}</p>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => void refreshSession({ showLoading: true })}
        >
          <RefreshCw size={17} /> Try again
        </button>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
