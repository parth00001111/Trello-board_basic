import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const GuestRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main
        className="route-loader"
        id="main-content"
        aria-busy="true"
        aria-label="Checking your session"
      >
        <div className="route-loader-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p>Checking your session…</p>
      </main>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default GuestRoute;
