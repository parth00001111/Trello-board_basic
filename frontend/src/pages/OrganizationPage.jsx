import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  FolderKanban,
  LayoutGrid,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import AvatarStack from "../components/AvatarStack";
import EmptyState from "../components/EmptyState";
import InlineNotice from "../components/InlineNotice";
import Modal from "../components/Modal";
import PageLoader from "../components/PageLoader";
import UserAvatar from "../components/UserAvatar";
import api, { getErrorMessage } from "../lib/api";

const formatDate = (value) => {
  if (!value) return "Recently";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const OrganizationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [boards, setBoards] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadErrorStatus, setLoadErrorStatus] = useState(null);
  const [partialError, setPartialError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [boardOpen, setBoardOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [boardTitle, setBoardTitle] = useState("");
  const [memberUsername, setMemberUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmingMemberId, setConfirmingMemberId] = useState("");
  const [removingMemberId, setRemovingMemberId] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      api.get(`/organization/${id}`),
      api.get("/boards", { params: { organizationId: id } }),
      api.get("/members", { params: { organizationId: id } }),
    ])
      .then(([organizationResponse, boardsResponse, membersResponse]) => {
        if (!active) return;
        setOrganization(organizationResponse.data.organization);
        setBoards(boardsResponse.data.Boards || boardsResponse.data.boards || []);
        setMembers(membersResponse.data.members || []);
      })
      .catch((error) => {
        if (active) {
          setLoadError(getErrorMessage(error, "We couldn’t open this workspace."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const closeModals = () => {
    if (submitting) return;
    setBoardOpen(false);
    setInviteOpen(false);
    setFormError("");
  };

  const createBoard = async (event) => {
    event.preventDefault();
    const cleanTitle = boardTitle.trim();
    if (cleanTitle.length < 2) {
      setFormError("Board name needs at least 2 characters.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const { data } = await api.post("/board", {
        title: cleanTitle,
        organizationId: id,
      });
      const boardId = data.board?._id || data.BoardId;
      setBoardTitle("");
      setBoardOpen(false);

      if (boardId) {
        navigate(`/board/${boardId}`);
      } else {
        const response = await api.get("/boards", { params: { organizationId: id } });
        setBoards(response.data.Boards || response.data.boards || []);
      }
    } catch (error) {
      setFormError(getErrorMessage(error, "We couldn’t create this board."));
    } finally {
      setSubmitting(false);
    }
  };

  const inviteMember = async (event) => {
    event.preventDefault();
    const username = memberUsername.trim();
    if (username.length < 2) {
      setFormError("Enter a valid username.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      await api.post("/add-member-to-organization", {
        organizationId: id,
        memberUsername: username,
      });
      const response = await api.get("/members", { params: { organizationId: id } });
      setMembers(response.data.members || []);
      setMemberUsername("");
      setInviteOpen(false);
      setSuccess(`${username} was added to the workspace.`);
      window.setTimeout(() => setSuccess(""), 4000);
    } catch (error) {
      setFormError(getErrorMessage(error, "We couldn’t add this teammate."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <PageLoader label="Loading workspace" cards={4} />
      </AppShell>
    );
  }

  if (loadError || !organization) {
    return (
      <AppShell>
        <EmptyState
          icon={FolderKanban}
          title="This workspace isn’t available"
          description={loadError || "It may have moved, or you may not have access."}
          action={
            <Link className="btn btn-secondary" to="/dashboard">
              <ArrowLeft size={17} /> Back to workspaces
            </Link>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/dashboard">Workspaces</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{organization.title}</span>
      </nav>

      <section className="organization-hero">
        <div className="organization-monogram" aria-hidden="true">
          {organization.title?.charAt(0).toUpperCase()}
        </div>
        <div className="organization-heading-copy">
          <p className="eyebrow">Team workspace</p>
          <h1>{organization.title}</h1>
          <p>{organization.description || "A shared place to plan, build and finish the work."}</p>
        </div>
        <div className="organization-hero-actions">
          <AvatarStack members={members} limit={5} />
          {organization.role === "admin" && (
            <button className="btn btn-secondary" type="button" onClick={() => setInviteOpen(true)}>
              <UserPlus size={17} /> Invite
            </button>
          )}
          <button className="btn btn-primary" type="button" onClick={() => setBoardOpen(true)}>
            <Plus size={17} /> New board
          </button>
        </div>
      </section>

      <InlineNotice message={success} tone="success" />

      <section className="organization-summary" aria-label="Workspace summary">
        <div>
          <span><LayoutGrid size={18} /></span>
          <strong>{boards.length}</strong>
          <p>{boards.length === 1 ? "Active board" : "Active boards"}</p>
        </div>
        <div>
          <span><Users size={18} /></span>
          <strong>{members.length}</strong>
          <p>{members.length === 1 ? "Team member" : "Team members"}</p>
        </div>
        <div className="organization-members-list">
          <p>People in this workspace</p>
          <div>
            {members.slice(0, 6).map((member) => (
              <span key={member._id || member.id}>
                <UserAvatar name={member.username} />
                {member.username}
              </span>
            ))}
            {!members.length && <span>Invite your first teammate</span>}
          </div>
        </div>
      </section>

      <section className="content-section organization-boards-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Boards</p>
            <h2>Plan the work visually</h2>
            <p>Each board turns a stream of tasks into a clear, shared workflow.</p>
          </div>
          <span className="section-count">{boards.length}</span>
        </div>

        {boards.length ? (
          <div className="board-grid">
            {boards.map((board, index) => (
              <article className="board-card" key={board._id}>
                <button
                  type="button"
                  className={`board-card-preview board-preview-${(index % 4) + 1}`}
                  onClick={() => navigate(`/board/${board._id}`)}
                  aria-label={`Open ${board.title}`}
                >
                  {[3, 2, 2].map((cardCount, columnIndex) => (
                    <span className="mini-column" key={columnIndex} aria-hidden="true">
                      <i />
                      {Array.from({ length: cardCount }, (_, cardIndex) => (
                        <b key={cardIndex} />
                      ))}
                    </span>
                  ))}
                </button>
                <div className="board-card-body">
                  <div>
                    <h3>{board.title}</h3>
                    <p>
                      Created by {board.createdBy?.username || "your team"} · {formatDate(board.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="board-open-link"
                    onClick={() => navigate(`/board/${board._id}`)}
                    aria-label={`Open ${board.title}`}
                  >
                    <ArrowUpRight size={18} />
                  </button>
                </div>
              </article>
            ))}

            <button className="board-card board-create-card" type="button" onClick={() => setBoardOpen(true)}>
              <span><Plus size={21} /></span>
              <strong>Create another board</strong>
              <small>Start with a clean workflow</small>
            </button>
          </div>
        ) : (
          <EmptyState
            icon={LayoutGrid}
            title="Turn your plan into a board"
            description="Create a board, add tasks and move them from backlog all the way to done."
            action={
              <button className="btn btn-primary" type="button" onClick={() => setBoardOpen(true)}>
                <Plus size={17} /> Create your first board
              </button>
            }
          />
        )}
      </section>

      <Modal open={boardOpen} onClose={closeModals} title="Create a new board" eyebrow={organization.title}>
        <form className="modal-form" onSubmit={createBoard}>
          <div className="field">
            <label className="field-label" htmlFor="board-title">Board name</label>
            <input
              className="input"
              id="board-title"
              value={boardTitle}
              onChange={(event) => setBoardTitle(event.target.value)}
              placeholder="e.g. Website launch"
              maxLength={120}
              autoFocus
              required
            />
            <span className="field-hint">A focused name helps everyone find the right work.</span>
          </div>
          <InlineNotice message={formError} />
          <div className="modal-actions">
            <button className="btn btn-secondary" type="button" onClick={closeModals}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting && <span className="spinner" aria-hidden="true" />}
              {submitting ? "Creating…" : "Create board"}
            </button>
          </div>
        </form>
      </Modal>

      {organization.role === "admin" && (
        <Modal open={inviteOpen} onClose={closeModals} title="Invite a teammate" eyebrow="Grow the workspace">
          <form className="modal-form" onSubmit={inviteMember}>
          <div className="field">
            <label className="field-label" htmlFor="member-username">TaskFlow username</label>
            <input
              className="input"
              id="member-username"
              value={memberUsername}
              onChange={(event) => setMemberUsername(event.target.value)}
              placeholder="e.g. anika"
              autoComplete="off"
              maxLength={80}
              autoFocus
              required
            />
            <span className="field-hint">They need an existing TaskFlow account.</span>
          </div>
          <InlineNotice message={formError} />
          <div className="modal-actions">
            <button className="btn btn-secondary" type="button" onClick={closeModals}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting && <span className="spinner" aria-hidden="true" />}
              {submitting ? "Inviting…" : "Add to workspace"}
            </button>
          </div>
          </form>
        </Modal>
      )}
    </AppShell>
  );
};

export default OrganizationPage;
