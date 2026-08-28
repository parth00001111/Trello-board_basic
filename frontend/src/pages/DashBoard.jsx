import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  FolderKanban,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import EmptyState from "../components/EmptyState";
import InlineNotice from "../components/InlineNotice";
import Modal from "../components/Modal";
import PageLoader from "../components/PageLoader";
import useAuth from "../hooks/useAuth";
import api, { getErrorMessage } from "../lib/api";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const formatDate = (value) => {
  if (!value) return "Recently created";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    let active = true;

    api
      .get("/organizations")
      .then(({ data }) => {
        if (active) {
          setOrganizations(data.organizations || []);
          setLoadError("");
        }
      })
      .catch((error) => {
        if (active) {
          setLoadError(getErrorMessage(error, "We couldn’t load your workspaces."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const retryLoad = () => {
    setLoading(true);
    setLoadError("");
    setReloadKey((current) => current + 1);
  };

  const firstName = useMemo(
    () => user?.username?.trim().split(/\s+/)[0] || "there",
    [user?.username],
  );

  const closeCreate = () => {
    if (creating) return;
    setCreateOpen(false);
    setFormError("");
  };

  const createOrganization = async (event) => {
    event.preventDefault();
    const cleanTitle = title.trim();

    if (cleanTitle.length < 2) {
      setFormError("Workspace name needs at least 2 characters.");
      return;
    }

    setCreating(true);
    setFormError("");

    try {
      const { data } = await api.post("/organization", {
        title: cleanTitle,
        description: description.trim(),
      });
      const organizationId = data.organization?._id || data.id;

      setTitle("");
      setDescription("");
      setCreateOpen(false);

      if (organizationId) {
        navigate(`/organizations/${organizationId}`);
      } else {
        const response = await api.get("/organizations");
        setOrganizations(response.data.organizations || []);
      }
    } catch (error) {
      setFormError(getErrorMessage(error, "We couldn’t create this workspace."));
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppShell>
      <section className="page-hero dashboard-hero">
        <div>
          <p className="eyebrow">
            <Sparkles size={14} /> Your command center
          </p>
          <h1>
            {getGreeting()}, <span>{firstName}.</span>
          </h1>
          <p>Pick up where your team left off, or shape a new place to work.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setCreateOpen(true)}>
          <Plus size={18} /> New workspace
        </button>
      </section>

      <section className="dashboard-overview" aria-label="Workspace overview">
        <article className="overview-card overview-card-accent">
          <span className="overview-icon"><BriefcaseBusiness size={20} /></span>
          <div>
            <strong>{loading ? "—" : organizations.length}</strong>
            <span>{organizations.length === 1 ? "Workspace" : "Workspaces"}</span>
          </div>
        </article>
        <article className="overview-card">
          <span className="overview-icon overview-icon-blue"><FolderKanban size={20} /></span>
          <div>
            <strong>{loading ? "Checking" : organizations.length ? "Ready" : "Start"}</strong>
            <span>Planning status</span>
          </div>
        </article>
        <article className="overview-card dashboard-date-card">
          <span className="overview-icon overview-icon-violet"><CalendarDays size={20} /></span>
          <div>
            <strong>
              {new Intl.DateTimeFormat("en", { weekday: "long" }).format(new Date())}
            </strong>
            <span>
              {new Intl.DateTimeFormat("en", { month: "long", day: "numeric" }).format(
                new Date(),
              )}
            </span>
          </div>
        </article>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Spaces</p>
            <h2>Your workspaces</h2>
            <p>Boards, people and tasks stay organized inside each workspace.</p>
          </div>
          <span className="section-count">{organizations.length}</span>
        </div>

        {loading ? (
          <PageLoader label="Loading workspaces" />
        ) : loadError ? (
          <EmptyState
            icon={RefreshCw}
            title="We couldn’t load your workspaces"
            description={loadError}
            action={
              <button className="btn btn-primary" type="button" onClick={retryLoad}>
                <RefreshCw size={17} /> Try again
              </button>
            }
          />
        ) : organizations.length ? (
          <div className="workspace-grid">
            {organizations.map((organization, index) => (
              <article className="workspace-card" key={organization._id}>
                <div className={`workspace-card-cover cover-${(index % 4) + 1}`}>
                  <span className="workspace-monogram" aria-hidden="true">
                    {organization.title?.charAt(0).toUpperCase()}
                  </span>
                  <span className="workspace-role">Workspace</span>
                </div>
                <div className="workspace-card-body">
                  <div>
                    <h3>{organization.title}</h3>
                    <p>{organization.description || "A focused space for your team’s best work."}</p>
                  </div>
                  <div className="workspace-card-meta">
                    <span>Created {formatDate(organization.createdAt)}</span>
                    <button
                      className="workspace-open-button"
                      type="button"
                      onClick={() => navigate(`/organizations/${organization._id}`)}
                      aria-label={`Open ${organization.title}`}
                    >
                      Open <ArrowUpRight size={17} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BriefcaseBusiness}
            title="Your first workspace starts here"
            description="Create a workspace for a product, campaign or team. You can add boards and invite people next."
            action={
              <button className="btn btn-primary" type="button" onClick={() => setCreateOpen(true)}>
                <Plus size={17} /> Create workspace
              </button>
            }
          />
        )}
      </section>

      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Create a workspace"
        eyebrow="A home for the work"
        dismissible={!creating}
      >
        <form className="modal-form" onSubmit={createOrganization} aria-busy={creating}>
          <div className="field">
            <label className="field-label" htmlFor="workspace-title">Workspace name</label>
            <input
              className="input"
              id="workspace-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Product studio"
              maxLength={120}
              autoFocus
              required
            />
          </div>
          <div className="field">
            <div className="field-label-row">
              <label className="field-label" htmlFor="workspace-description">Description</label>
              <span>{description.length}/500</span>
            </div>
            <textarea
              className="textarea"
              id="workspace-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What will your team organize here?"
              maxLength={500}
            />
          </div>
          <InlineNotice message={formError} />
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={closeCreate}
              disabled={creating}
            >
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={creating}>
              {creating && <span className="spinner" aria-hidden="true" />}
              {creating ? "Creating…" : "Create workspace"}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};

export default Dashboard;
