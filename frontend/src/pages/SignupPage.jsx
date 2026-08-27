import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import AuthField from "../components/AuthField";
import AuthLayout from "../components/AuthLayout";

const SignupPage = () => {
  const [form, setForm] = useState({ username: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({
      ...current,
      [field]: "",
      ...(field === "password" ? { confirmPassword: "" } : {}),
    }));
    setSubmitError("");
  };

  const validate = () => {
    const nextErrors = {};
    const username = form.username.trim();

    if (!username) {
      nextErrors.username = "Choose a username.";
    } else if (username.length < 3 || username.length > 40) {
      nextErrors.username = "Username must be between 3 and 40 characters.";
    }

    if (!form.password) {
      nextErrors.password = "Create a password.";
    } else if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      document.getElementById(`signup-${Object.keys(nextErrors)[0]}`)?.focus();
      return;
    }

    setLoading(true);
    setSubmitError("");

    try {
      await api.post("/signup", {
        username: form.username.trim(),
        password: form.password,
      });
      navigate("/signin", {
        replace: true,
        state: { registrationMessage: "Account created. Sign in to open your workspace." },
      });
    } catch (error) {
      setSubmitError(
        error.response?.data?.message ||
          "We could not create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Start for free"
      title="Create your TaskFlow account"
      description="Set up a calm, shared home for projects your team can understand at a glance."
      previewTitle="Give every project a clear path."
      previewDescription="Start with a board, invite the team, and turn scattered requests into visible progress."
      footer={
        <p>
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      }
    >
      <form className="tf-auth-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
        {submitError && (
          <div className="tf-form-alert" role="alert">
            <CircleAlert size={18} aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <AuthField
          id="signup-username"
          label="Username"
          name="username"
          value={form.username}
          onChange={updateField("username")}
          error={errors.username}
          hint="Use 3–40 characters."
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={40}
          placeholder="Choose a username"
          disabled={loading}
          required
        />
        <AuthField
          id="signup-password"
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={updateField("password")}
          error={errors.password}
          hint="Use at least 8 characters."
          autoComplete="new-password"
          autoCapitalize="none"
          minLength={8}
          placeholder="Create a password"
          disabled={loading}
          required
        />
        <AuthField
          id="signup-confirmPassword"
          label="Confirm password"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={updateField("confirmPassword")}
          error={errors.confirmPassword}
          autoComplete="new-password"
          autoCapitalize="none"
          placeholder="Enter your password again"
          disabled={loading}
          required
        />

        <div className="tf-password-note">
          <Check size={14} aria-hidden="true" /> Use a unique password you do not reuse elsewhere.
        </div>

        <button className="tf-submit-button" type="submit" disabled={loading}>
          {loading && <LoaderCircle className="tf-spinner" size={18} aria-hidden="true" />}
          {loading ? "Creating your account…" : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default SignupPage;
