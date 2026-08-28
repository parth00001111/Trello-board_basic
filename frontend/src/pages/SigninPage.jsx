import { CircleAlert, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../lib/api";
import useAuth from "../hooks/useAuth";
import AuthField from "../components/AuthField";
import AuthLayout from "../components/AuthLayout";

const SigninPage = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshSession } = useAuth();
  const registrationMessage = location.state?.registrationMessage;
  const destination =
    typeof location.state?.from === "string" && location.state.from.startsWith("/")
      ? location.state.from
      : "/dashboard";

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmitError("");
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.username.trim()) nextErrors.username = "Enter your username.";
    if (!form.password) nextErrors.password = "Enter your password.";
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      document.getElementById(`signin-${Object.keys(nextErrors)[0]}`)?.focus();
      return;
    }

    setLoading(true);
    setSubmitError("");

    try {
      await api.post("/signin", {
        username: form.username.trim(),
        password: form.password,
      });
      const sessionUser = await refreshSession();
      if (!sessionUser) {
        setSubmitError("Your account was verified, but the session could not be opened. Try again.");
        return;
      }
      navigate(destination, { replace: true });
    } catch (error) {
      setSubmitError(
        error.response?.data?.message ||
          "We could not sign you in. Check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to your workspace"
      description="Pick up your projects, priorities, and shared team work right where you left them."
      previewTitle="Keep the whole plan in view."
      previewDescription="See priorities, owners, and progress together—then move work forward in a single gesture."
      footer={
        <p>
          New to TaskFlow? <Link to="/signup">Create an account</Link>
        </p>
      }
    >
      <form className="tf-auth-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
        {registrationMessage && (
          <div className="tf-form-success" role="status">
            {registrationMessage}
          </div>
        )}
        {submitError && (
          <div className="tf-form-alert" role="alert">
            <CircleAlert size={18} aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <AuthField
          id="signin-username"
          label="Username"
          name="username"
          value={form.username}
          onChange={updateField("username")}
          error={errors.username}
          autoComplete="username"
          inputMode="text"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={80}
          placeholder="Enter your username"
          disabled={loading}
          required
        />
        <AuthField
          id="signin-password"
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={updateField("password")}
          error={errors.password}
          autoComplete="current-password"
          autoCapitalize="none"
          placeholder="Enter your password"
          disabled={loading}
          required
        />

        <button className="tf-submit-button" type="submit" disabled={loading}>
          {loading && <LoaderCircle className="tf-spinner" size={18} aria-hidden="true" />}
          {loading ? "Signing you in…" : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default SigninPage;
