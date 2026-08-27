import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Brand from "./Brand";
import MarketingBoard from "./MarketingBoard";

const AuthLayout = ({
  eyebrow,
  title,
  description,
  children,
  footer,
  previewTitle,
  previewDescription,
}) => {
  return (
    <main className="tf-auth-shell">
      <div className="tf-auth-orb tf-auth-orb--one" aria-hidden="true" />
      <div className="tf-auth-orb tf-auth-orb--two" aria-hidden="true" />

      <section className="tf-auth-card" aria-labelledby="tf-auth-title">
        <div className="tf-auth-card__form-side">
          <div className="tf-auth-card__topbar">
            <Brand showTagline />
            <Link className="tf-back-link" to="/">
              <ArrowLeft size={16} aria-hidden="true" />
              Home
            </Link>
          </div>

          <div className="tf-auth-card__form-wrap">
            <div className="tf-auth-heading">
              <span className="tf-auth-heading__eyebrow">{eyebrow}</span>
              <h1 id="tf-auth-title">{title}</h1>
              <p>{description}</p>
            </div>
            {children}
            <div className="tf-auth-switch">{footer}</div>
            <p className="tf-auth-trust">
              <ShieldCheck size={15} aria-hidden="true" />
              Your session is protected with secure cookies.
            </p>
          </div>
        </div>

        <aside className="tf-auth-card__preview" aria-label="TaskFlow product preview">
          <div className="tf-auth-preview__copy">
            <span className="tf-auth-preview__badge">
              <Sparkles size={14} aria-hidden="true" />
              Clear work, calmer teams
            </span>
            <h2>{previewTitle}</h2>
            <p>{previewDescription}</p>
          </div>
          <MarketingBoard compact />
          <div className="tf-auth-preview__stat" aria-hidden="true">
            <span className="tf-auth-preview__pulse" />
            <div>
              <strong>Everything is on track</strong>
              <small>8 tasks moved this week</small>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default AuthLayout;
