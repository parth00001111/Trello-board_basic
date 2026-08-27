import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main
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

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
