import {
  ArrowRight,
  Check,
  Gauge,
  Layers3,
  Move,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import Brand from "../components/Brand";
import MarketingBoard from "../components/MarketingBoard";

const features = [
  {
    icon: Move,
    title: "A board that stays flexible",
    description:
      "Move work between clear stages, reorder priorities, and keep the next action obvious.",
    tone: "orange",
  },
  {
    icon: UsersRound,
    title: "Built for shared momentum",
    description:
      "Bring projects, people, and progress into one calm workspace your whole team can follow.",
    tone: "blue",
  },
  {
    icon: Gauge,
    title: "Progress without the noise",
    description:
      "See what is moving, what needs attention, and what has shipped without digging through updates.",
    tone: "green",
  },
];

const LandingPage = () => {
  return (
    <div className="tf-public">
      <header className="tf-site-header">
        <div className="tf-container tf-site-header__inner">
          <Brand />

          <nav className="tf-site-nav" aria-label="Primary navigation">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#principles">Why TaskFlow</a>
          </nav>

          <div className="tf-site-header__actions">
            <Link className="tf-button tf-button--ghost" to="/signin">
              Sign in
            </Link>
            <Link className="tf-button tf-button--primary tf-header-cta" to="/signup">
              Start free
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="tf-hero" aria-labelledby="tf-hero-title">
          <div className="tf-hero__wash" aria-hidden="true" />
          <div className="tf-container tf-hero__grid">
            <div className="tf-hero__copy">
              <div className="tf-kicker">
                <Sparkles size={15} aria-hidden="true" />
                A clearer way to move work forward
              </div>
              <h1 id="tf-hero-title">
                Turn busywork into
                <span> visible progress.</span>
              </h1>
              <p className="tf-hero__lead">
                TaskFlow gives your team one focused place to plan projects, move tasks, and finish
                the work that matters—without a heavy setup.
              </p>
              <div className="tf-hero__actions">
                <Link className="tf-button tf-button--primary tf-button--large" to="/signup">
                  Create your workspace
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <a className="tf-button tf-button--secondary tf-button--large" href="#workflow">
                  See how it works
                </a>
              </div>
              <ul className="tf-hero__assurances" aria-label="Product highlights">
                <li><Check size={15} aria-hidden="true" />Free to get started</li>
                <li><Check size={15} aria-hidden="true" />No card required</li>
                <li><Check size={15} aria-hidden="true" />Ready in minutes</li>
              </ul>
            </div>

            <div className="tf-hero__visual">
              <div className="tf-hero__visual-badge tf-hero__visual-badge--top" aria-hidden="true">
                <span className="tf-live-dot" />
                Shared workspace
              </div>
              <MarketingBoard />
              <div className="tf-hero__visual-badge tf-hero__visual-badge--bottom" aria-hidden="true">
                <span className="tf-visual-check"><Check size={14} /></span>
                <span><strong>Drag tasks</strong> to update their status</span>
              </div>
            </div>
          </div>

          <div className="tf-container tf-proof-row" aria-label="TaskFlow principles">
            <p>Designed for teams that value</p>
            <div className="tf-proof-row__items">
              <span><Layers3 size={17} aria-hidden="true" />Clarity</span>
              <span><Gauge size={17} aria-hidden="true" />Momentum</span>
              <span><ShieldCheck size={17} aria-hidden="true" />Focus</span>
            </div>
          </div>
        </section>

        <section className="tf-section tf-features" id="features" aria-labelledby="tf-features-title">
          <div className="tf-container">
            <div className="tf-section-heading tf-section-heading--center">
              <span className="tf-section-heading__eyebrow">Simple by design</span>
              <h2 id="tf-features-title">Enough structure to stay aligned. No clutter.</h2>
              <p>
                A focused toolset that helps teams understand the work and act on it quickly.
              </p>
            </div>

            <div className="tf-feature-grid">
              {features.map(({ icon: Icon, title, description, tone }) => (
                <article className="tf-feature-card" key={title}>
                  <span className={`tf-feature-card__icon tf-feature-card__icon--${tone}`}>
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <a className="tf-feature-card__detail" href="#workflow">
                    Explore the workflow <ArrowRight size={15} aria-hidden="true" />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="tf-section tf-workflow" id="workflow" aria-labelledby="tf-workflow-title">
          <div className="tf-container tf-workflow__grid">
            <div className="tf-workflow__copy">
              <span className="tf-section-heading__eyebrow">One natural workflow</span>
              <h2 id="tf-workflow-title">From first thought to finished—without losing context.</h2>
              <p>
                Create a home for each initiative, shape the work into a visual board, then move
                every task toward done.
              </p>
              <ol className="tf-workflow-list">
                <li>
                  <span>01</span>
                  <div><strong>Create a workspace</strong><p>Keep related boards and teammates together.</p></div>
                </li>
                <li>
                  <span>02</span>
                  <div><strong>Make the plan visible</strong><p>Turn ideas into clear, owned tasks.</p></div>
                </li>
                <li>
                  <span>03</span>
                  <div><strong>Move work forward</strong><p>Drag, reorder, and finish with confidence.</p></div>
                </li>
              </ol>
            </div>

            <div className="tf-workflow-panel" role="group" aria-label="Example task progress">
              <div className="tf-workflow-panel__header">
                <div>
                  <span>Weekly progress</span>
                  <strong>Product launch</strong>
                </div>
                <small>72% complete</small>
              </div>
              <div className="tf-workflow-panel__progress"><span /></div>
              <div className="tf-workflow-panel__items">
                <div className="tf-workflow-item tf-workflow-item--complete">
                  <span><Check size={15} /></span>
                  <div><strong>Define launch scope</strong><small>Completed yesterday</small></div>
                  <em>Done</em>
                </div>
                <div className="tf-workflow-item tf-workflow-item--active">
                  <span>02</span>
                  <div><strong>Polish customer experience</strong><small>Design · 4 tasks</small></div>
                  <em>Active</em>
                </div>
                <div className="tf-workflow-item">
                  <span>03</span>
                  <div><strong>Prepare release</strong><small>Engineering · 6 tasks</small></div>
                  <em>Next</em>
                </div>
              </div>
              <div className="tf-workflow-panel__note">
                <Sparkles size={16} aria-hidden="true" />
                Every task keeps its owner, priority, due date, and position.
              </div>
            </div>
          </div>
        </section>

        <section className="tf-section tf-principles" id="principles" aria-labelledby="tf-principles-title">
          <div className="tf-container tf-principles__inner">
            <div>
              <span className="tf-section-heading__eyebrow">Made for real work</span>
              <h2 id="tf-principles-title">Calm software for ambitious teams.</h2>
            </div>
            <blockquote>
              “The best project tool is the one your team can understand at a glance. TaskFlow keeps
              the interface quiet so the work can speak.”
              <footer>TaskFlow product principle</footer>
            </blockquote>
          </div>
        </section>

        <section className="tf-final-cta" aria-labelledby="tf-cta-title">
          <div className="tf-container tf-final-cta__inner">
            <div>
              <span className="tf-final-cta__eyebrow">Your next project deserves a clear start.</span>
              <h2 id="tf-cta-title">Bring the plan together today.</h2>
            </div>
            <Link className="tf-button tf-button--light tf-button--large" to="/signup">
              Start using TaskFlow
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="tf-site-footer">
        <div className="tf-container tf-site-footer__inner">
          <Brand showTagline />
          <p>Built to keep work clear, human, and moving.</p>
          <div className="tf-site-footer__links">
            <Link to="/signin">Sign in</Link>
            <Link to="/signup">Create account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
