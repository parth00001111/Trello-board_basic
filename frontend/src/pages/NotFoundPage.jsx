import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <main className="not-found-page" id="main-content">
    <div className="not-found-orbit" aria-hidden="true">
      <span>4</span>
      <i />
      <span>4</span>
    </div>
    <p className="eyebrow">Lost card</p>
    <h1>This task wandered off the board.</h1>
    <p>The page you’re looking for doesn’t exist or may have moved.</p>
    <Link className="btn btn-primary" to="/">
      <ArrowLeft size={17} /> Back to TaskFlow
    </Link>
  </main>
);

export default NotFoundPage;
