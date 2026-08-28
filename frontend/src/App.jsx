import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthProvider from "./context/AuthProvider";
import GuestRoute from "./components/GuestRoute";
import NavigationEffects from "./components/NavigationEffects";
import ProtectedRoute from "./components/ProtectedRoute";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const SigninPage = lazy(() => import("./pages/SigninPage"));
const DashBoard = lazy(() => import("./pages/DashBoard"));
const OrganizationPage = lazy(() => import("./pages/OrganizationPage"));
const TaskPage = lazy(() => import("./pages/TaskPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const RouteFallback = () => (
  <main className="route-loader" id="main-content" aria-busy="true" aria-label="Loading page">
    <div className="route-loader-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
    <p>Loading TaskFlow…</p>
  </main>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <NavigationEffects />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<GuestRoute />}>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/signin" element={<SigninPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashBoard />} />
            <Route path="/organizations/:id" element={<OrganizationPage />} />
            <Route path="/board/:id" element={<TaskPage />} />
          </Route>

          <Route path="/home" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
