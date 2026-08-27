const EmptyState = ({ icon: Icon, title, description, action = null, compact = false }) => (
  <section className={compact ? "empty-state empty-state-compact" : "empty-state"}>
    {Icon && (
      <span className="empty-state-icon" aria-hidden="true">
        <Icon size={22} />
      </span>
    )}
    <h2>{title}</h2>
    <p>{description}</p>
    {action}
  </section>
);

export default EmptyState;
