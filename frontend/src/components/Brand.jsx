import { PanelsTopLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Brand = ({ className = "", showTagline = false, to = "/", compact = false }) => {
  return (
    <Link
      className={`tf-brand ${compact ? "tf-brand--compact" : ""} ${className}`.trim()}
      to={to}
      aria-label={to === "/" ? "TaskFlow home" : "TaskFlow dashboard"}
    >
      <span className="tf-brand__mark" aria-hidden="true">
        <PanelsTopLeft size={20} strokeWidth={2.3} />
      </span>
      <span className="tf-brand__copy">
        <span className="tf-brand__name">TaskFlow</span>
        {showTagline && !compact && <span className="tf-brand__tagline">Work in motion</span>}
      </span>
    </Link>
  );
};

export default Brand;
