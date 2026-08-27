import {
  Check,
  CheckCircle2,
  Clock3,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
} from "lucide-react";

const MarketingBoard = ({ compact = false }) => {
  return (
    <figure className={`tf-board-scene ${compact ? "tf-board-scene--compact" : ""}`}>
      <div className="tf-board-glow" aria-hidden="true" />
      <div className="tf-kanban" aria-hidden="true">
        <div className="tf-kanban__topbar">
          <div>
            <span className="tf-kanban__eyebrow">Product sprint</span>
            <strong>Launch workspace</strong>
          </div>
          <div className="tf-kanban__people">
            <span className="tf-avatar tf-avatar--peach">AN</span>
            <span className="tf-avatar tf-avatar--blue">MK</span>
            <span className="tf-avatar tf-avatar--green">JS</span>
            <span className="tf-kanban__more"><MoreHorizontal size={16} /></span>
          </div>
        </div>

        <div className="tf-kanban__columns">
          <section className="tf-kanban-column">
            <div className="tf-kanban-column__heading">
              <span><i className="tf-dot" />Backlog</span>
              <small>3</small>
            </div>
            <article className="tf-task-card">
              <span className="tf-task-card__tag tf-task-card__tag--violet">Research</span>
              <strong>Map customer journey</strong>
              <p>Capture friction across the core flow.</p>
              <div className="tf-task-card__meta">
                <span><Paperclip size={13} /> 2</span>
                <span className="tf-avatar tf-avatar--peach">AN</span>
              </div>
            </article>
            <article className="tf-task-card tf-task-card--quiet">
              <span className="tf-task-card__tag tf-task-card__tag--amber">Content</span>
              <strong>Write launch notes</strong>
              <div className="tf-task-card__meta">
                <span><Clock3 size={13} /> Fri</span>
                <span className="tf-avatar tf-avatar--blue">MK</span>
              </div>
            </article>
          </section>

          <section className="tf-kanban-column tf-kanban-column--focus">
            <div className="tf-kanban-column__heading">
              <span><i className="tf-dot tf-dot--orange" />In progress</span>
              <small>2</small>
            </div>
            <article className="tf-task-card tf-task-card--active">
              <span className="tf-task-card__tag tf-task-card__tag--blue">Design</span>
              <strong>Refine dashboard states</strong>
              <p>Empty, loading and success views.</p>
              <div className="tf-progress"><span /></div>
              <div className="tf-task-card__meta">
                <span><MessageCircle size={13} /> 4</span>
                <span className="tf-avatar tf-avatar--green">JS</span>
              </div>
            </article>
            <article className="tf-task-card tf-task-card--quiet">
              <span className="tf-task-card__tag tf-task-card__tag--rose">Engineering</span>
              <strong>Connect activity feed</strong>
              <div className="tf-task-card__meta">
                <span><Clock3 size={13} /> Today</span>
                <span className="tf-avatar tf-avatar--blue">MK</span>
              </div>
            </article>
          </section>

          <section className="tf-kanban-column">
            <div className="tf-kanban-column__heading">
              <span><i className="tf-dot tf-dot--green" />Done</span>
              <small>4</small>
            </div>
            <article className="tf-task-card tf-task-card--done">
              <span className="tf-task-card__tag tf-task-card__tag--green">Shipped</span>
              <strong>Project foundations</strong>
              <p><CheckCircle2 size={14} /> All checks passed</p>
              <div className="tf-task-card__meta">
                <span><Check size={13} /> Complete</span>
                <span className="tf-avatar tf-avatar--peach">AN</span>
              </div>
            </article>
            <article className="tf-task-card tf-task-card--quiet tf-task-card--checked">
              <CheckCircle2 size={15} />
              <strong>Invite the team</strong>
            </article>
          </section>
        </div>
      </div>
      <figcaption className="tf-visually-hidden">
        A TaskFlow project board showing work moving from backlog, through in progress, to done.
      </figcaption>
    </figure>
  );
};

export default MarketingBoard;
