import { useEffect, useRef, useState } from "react";
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
  const [boardsUnavailable, setBoardsUnavailable] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settledId, setSettledId] = useState("");
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
  const [teamNotice, setTeamNotice] = useState("");
  const [confirmingMemberId, setConfirmingMemberId] = useState("");
  const [removingMemberId, setRemovingMemberId] = useState("");
  const successTimer = useRef(null);
  const confirmationKeepButton = useRef(null);
  const memberActionButtons = useRef(new Map());
  const membersHeading = useRef(null);

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      api.get(`/organization/${id}`),
      api.get("/boards", { params: { organizationId: id } }),
      api.get("/members", { params: { organizationId: id } }),
    ])
      .then(([organizationResult, boardsResult, membersResult]) => {
        if (!active) return;
        setPartialError("");

        if (organizationResult.status === "rejected") {
          setOrganization(null);
          setBoards([]);
          setBoardsUnavailable(false);
          setMembers([]);
          setLoadErrorStatus(organizationResult.reason?.response?.status || null);
          setLoadError(
            getErrorMessage(organizationResult.reason, "We couldn’t open this workspace."),
          );
          return;
        }

        const nextOrganization = organizationResult.value.data.organization;
        const unavailableSections = [];

        setOrganization(nextOrganization);
        setLoadError("");
        setLoadErrorStatus(null);

        if (boardsResult.status === "fulfilled") {
          setBoards(boardsResult.value.data.Boards || boardsResult.value.data.boards || []);
          setBoardsUnavailable(false);
        } else {
          setBoards([]);
          setBoardsUnavailable(true);
          unavailableSections.push("boards");
        }

        if (membersResult.status === "fulfilled") {
          setMembers(membersResult.value.data.members || []);
        } else {
          setMembers(nextOrganization?.members || []);
          unavailableSections.push("teammates");
        }

        if (unavailableSections.length) {
          const sectionLabel = unavailableSections.join(" and ");
          setPartialError(
            `We couldn’t refresh ${sectionLabel}. The rest of the workspace is still available.`,
          );
        }
      })
      .finally(() => {
        if (active) {
          setSettledId(id);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  useEffect(
    () => () => {
      if (successTimer.current) window.clearTimeout(successTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!teamOpen || !confirmingMemberId) return undefined;
    const focusFrame = window.requestAnimationFrame(() => {
      confirmationKeepButton.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(focusFrame);
  }, [confirmingMemberId, teamOpen]);

  const showSuccess = (message) => {
    if (successTimer.current) window.clearTimeout(successTimer.current);
    setSuccess(message);
    successTimer.current = window.setTimeout(() => {
      setSuccess("");
      successTimer.current = null;
    }, 4000);
  };

  const retryLoad = () => {
    setLoading(true);
    setLoadError("");
    setLoadErrorStatus(null);
    setPartialError("");
    setReloadKey((current) => current + 1);
  };

  const openBoardModal = () => {
    setFormError("");
    setBoardOpen(true);
  };

  const openTeamModal = () => {
    setFormError("");
    setTeamNotice("");
    setConfirmingMemberId("");
    setTeamOpen(true);
  };

  const teamBusy = submitting || Boolean(removingMemberId);

  const closeModals = () => {
    if (teamBusy) return;
    setBoardOpen(false);
    setTeamOpen(false);
    setFormError("");
    setTeamNotice("");
    setConfirmingMemberId("");
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
    if (teamBusy) return;
    const username = memberUsername.trim();
    if (username.length < 2) {
      setFormError("Enter a valid username.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setTeamNotice("");
    try {
      const { data } = await api.post("/add-member-to-organization", {
        organizationId: id,
        memberUsername: username,
      });
      if (data.member) {
        const returnedMemberId = String(data.member._id || data.member.id || "");
        setMembers((current) => {
          const existingIndex = current.findIndex((member) => {
            const currentMemberId = String(member._id || member.id || "");
            return returnedMemberId
              ? currentMemberId === returnedMemberId
              : member.username === data.member.username;
          });

          if (existingIndex === -1) return [...current, data.member];
          return current.map((member, index) =>
            index === existingIndex ? { ...member, ...data.member } : member,
          );
        });
      }
      setMemberUsername("");
      setTeamOpen(false);
      showSuccess(
        data.message === "Member added"
          ? `${username} was added to the workspace.`
          : data.message || "Workspace membership is already up to date.",
      );
    } catch (error) {
      setFormError(getErrorMessage(error, "We couldn’t add this teammate."));
    } finally {
      setSubmitting(false);
    }
  };

  const removeMember = async (member) => {
    const memberId = String(member._id || member.id || "");
    if (!memberId || member.role === "admin" || teamBusy) return;

    setRemovingMemberId(memberId);
    setFormError("");
    setTeamNotice("");
    try {
      const { data } = await api.delete("/members", {
        data: {
          organizationId: id,
          memberUsername: member.username,
        },
      });
      setMembers((current) =>
        current.filter((candidate) => String(candidate._id || candidate.id) !== memberId),
      );
      setConfirmingMemberId("");
      const unassignedCount = Number(data.unassignedIssues) || 0;
      const assignmentMessage = unassignedCount
        ? ` ${unassignedCount} ${unassignedCount === 1 ? "task was" : "tasks were"} unassigned.`
        : "";
      setTeamNotice(
        data.message === "Member removed"
          ? `${member.username} was removed.${assignmentMessage}`
          : data.message || "Workspace membership is already up to date.",
      );
      window.requestAnimationFrame(() => {
        membersHeading.current?.focus({ preventScroll: true });
      });
    } catch (error) {
      setFormError(getErrorMessage(error, "We couldn’t remove this teammate."));
    } finally {
      setRemovingMemberId("");
    }
  };

  const cancelMemberRemoval = (memberId) => {
    setConfirmingMemberId("");
    window.requestAnimationFrame(() => {
      memberActionButtons.current.get(memberId)?.focus({ preventScroll: true });
    });
  };

  if (loading || settledId !== id) {
    return (
      <AppShell>
        <PageLoader label="Loading workspace" cards={4} />
      </AppShell>
    );
  }

  if (loadError || !organization) {
    const canRetry = ![400, 403, 404].includes(loadErrorStatus);

    return (
      <AppShell>
        <EmptyState
          icon={FolderKanban}
          title="This workspace isn’t available"
          description={loadError || "It may have moved, or you may not have access."}
          action={
            <div className="empty-state-actions">
              <Link className="btn btn-secondary" to="/dashboard">
                <ArrowLeft size={17} /> Back to workspaces
              </Link>
              {canRetry && (
                <button className="btn btn-primary" type="button" onClick={retryLoad}>
                  <RefreshCw size={17} /> Try again
                </button>
              )}
            </div>
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
            <button className="btn btn-secondary" type="button" onClick={openTeamModal}>
              <UserPlus size={17} /> Manage team
            </button>
          )}
          <button className="btn btn-primary" type="button" onClick={openBoardModal}>
            <Plus size={17} /> New board
          </button>
        </div>
      </section>

      <InlineNotice message={success} tone="success" />
      {partialError && (
        <div className="workspace-load-warning">
          <InlineNotice message={partialError} />
          <button className="btn btn-secondary btn-sm" type="button" onClick={retryLoad}>
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      )}

      <section className="organization-summary" aria-label="Workspace summary">
        <div>
          <span><LayoutGrid size={18} /></span>
          <strong>{boardsUnavailable ? "—" : boards.length}</strong>
          <p>
            {boardsUnavailable
              ? "Boards unavailable"
              : boards.length === 1
                ? "Active board"
                : "Active boards"}
          </p>
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

        {boardsUnavailable ? (
          <EmptyState
            icon={RefreshCw}
            title="We couldn’t load this workspace’s boards"
            description="Your workspace and teammates are still available. Try loading the boards again."
            action={
              <button className="btn btn-primary" type="button" onClick={retryLoad}>
                <RefreshCw size={17} /> Try again
              </button>
            }
            compact
          />
        ) : boards.length ? (
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

            <button className="board-card board-create-card" type="button" onClick={openBoardModal}>
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
              <button className="btn btn-primary" type="button" onClick={openBoardModal}>
                <Plus size={17} /> Create your first board
              </button>
            }
          />
        )}
      </section>

      <Modal
        open={boardOpen}
        onClose={closeModals}
        title="Create a new board"
        eyebrow={organization.title}
        dismissible={!submitting}
        initialFocusSelector="#board-title"
      >
        <form className="modal-form" onSubmit={createBoard} aria-busy={submitting}>
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
              disabled={submitting}
              required
            />
            <span className="field-hint">A focused name helps everyone find the right work.</span>
          </div>
          <InlineNotice message={formError} />
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={closeModals}
              disabled={submitting}
            >
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting && <span className="spinner" aria-hidden="true" />}
              {submitting ? "Creating…" : "Create board"}
            </button>
          </div>
        </form>
      </Modal>

      {organization.role === "admin" && (
        <Modal
          open={teamOpen}
          onClose={closeModals}
          title="Manage teammates"
          eyebrow={organization.title}
          size="lg"
          dismissible={!teamBusy}
        >
          <div className="team-manager">
            <InlineNotice message={teamNotice} tone="success" />
            <InlineNotice message={formError} />

            <section className="team-member-section" aria-labelledby="workspace-members-title">
              <div className="team-section-heading">
                <div>
                  <h3 ref={membersHeading} id="workspace-members-title" tabIndex={-1}>
                    Workspace members
                  </h3>
                  <p>Admins can add people or remove access at any time.</p>
                </div>
                <span>{members.length}</span>
              </div>

              <ul className="team-member-list">
                {members.map((member) => {
                  const memberId = String(member._id || member.id || "");
                  const isAdmin = member.role === "admin";
                  const isConfirming = confirmingMemberId === memberId;
                  const isRemoving = removingMemberId === memberId;

                  return (
                    <li key={memberId || member.username}>
                      <UserAvatar name={member.username} size="md" />
                      <div className="team-member-copy">
                        <strong>{member.username}</strong>
                        <span>{isAdmin ? "Workspace admin" : "Member"}</span>
                      </div>

                      {isAdmin ? (
                        <span className="team-admin-badge">
                          <ShieldCheck size={15} /> Admin
                        </span>
                      ) : isConfirming ? (
                        <div className="team-remove-confirmation" role="alert">
                          <span>Remove access?</span>
                          <button
                            ref={confirmationKeepButton}
                            className="btn btn-ghost btn-sm"
                            type="button"
                            onClick={() => cancelMemberRemoval(memberId)}
                            disabled={teamBusy}
                          >
                            Keep
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            type="button"
                            onClick={() => void removeMember(member)}
                            disabled={teamBusy}
                          >
                            {isRemoving ? "Removing…" : "Remove"}
                          </button>
                        </div>
                      ) : (
                        <button
                          ref={(node) => {
                            if (node) memberActionButtons.current.set(memberId, node);
                            else memberActionButtons.current.delete(memberId);
                          }}
                          className="btn btn-ghost btn-icon team-remove-button"
                          type="button"
                          onClick={() => {
                            setFormError("");
                            setConfirmingMemberId(memberId);
                          }}
                          disabled={teamBusy}
                          aria-label={`Remove ${member.username} from this workspace`}
                          title={`Remove ${member.username}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            <form className="modal-form team-invite-form" onSubmit={inviteMember} aria-busy={submitting}>
              <div className="team-section-heading">
                <div>
                  <h3>Add a teammate</h3>
                  <p>They need an existing TaskFlow account.</p>
                </div>
              </div>
              <div className="team-invite-row">
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
                    disabled={teamBusy}
                    required
                  />
                </div>
                <button
                  className="btn btn-primary team-invite-button"
                  type="submit"
                  disabled={teamBusy}
                >
                  {submitting && <span className="spinner" aria-hidden="true" />}
                  {submitting ? "Adding…" : "Add teammate"}
                </button>
              </div>
            </form>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={closeModals}
                disabled={teamBusy}
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AppShell>
  );
};

export default OrganizationPage;
