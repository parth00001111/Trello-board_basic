const PageLoader = ({ label = "Loading…", cards = 3 }) => (
  <div className="page-loader" aria-busy="true" aria-label={label}>
    <div className="skeleton skeleton-title" />
    <div className="skeleton skeleton-copy" />
    <div className="skeleton-grid">
      {Array.from({ length: cards }, (_, index) => (
        <div className="skeleton skeleton-card" key={index} />
      ))}
    </div>
  </div>
);

export default PageLoader;
