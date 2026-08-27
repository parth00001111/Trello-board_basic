import { useEffect, useMemo, useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDotDashed,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import AvatarStack from "../components/AvatarStack";
import InlineNotice from "../components/InlineNotice";
import KanbanColumn from "../components/KanbanColumn";
import PageLoader from "../components/PageLoader";
import TaskEditorModal from "../components/TaskEditorModal";
import api, { getErrorMessage } from "../lib/api";
import {
  flattenGroups,
  groupIssues,
  serializeGroups,
  WORKFLOW,
} from "../lib/workflow";

const emptyTask = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  assignedMemberId: "",
  dueDate: "",
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const TaskPage = () => {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create");
  const [activeIssue, setActiveIssue] = useState(null);
  const [draft, setDraft] = useState(emptyTask);
  const [submitting, setSubmitting] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [boardNotice, setBoardNotice] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([api.get(`/boards/${id}`), api.get(`/boards/${id}/issues`)])
      .then(([boardResponse, issueResponse]) => {
        if (!active) return;
        setBoard(boardResponse.data.board);
        setOrganization(boardResponse.data.organization);
        setMembers(boardResponse.data.members || []);
        setIssues(issueResponse.data.issues || []);
      })
      .catch((error) => {
        if (active) {
          setLoadError(getErrorMessage(error, "We couldn’t open this board."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const groups = useMemo(() => groupIssues(issues), [issues]);
  const completed = groups.done.length;
  const completion = issues.length ? Math.round((completed / issues.length) * 100) : 0;

  const closeEditor = () => {
    if (submitting) return;
    setEditorOpen(false);
    setEditorError("");
    setConfirmingDelete(false);
  };

  const openCreate = (status = "todo") => {
    setEditorMode("create");
    setActiveIssue(null);
    setDraft({
      ...emptyTask,
      status,
      assignedMemberId: members[0]?._id || members[0]?.id || "",
    });
    setEditorError("");
    setConfirmingDelete(false);
    setEditorOpen(true);
  };

  const openEdit = (issue) => {
    setEditorMode("edit");
    setActiveIssue(issue);
    setDraft({
      title: issue.title || "",
      description: issue.description || "",
      status: issue.status || "todo",
      priority: issue.priority || "medium",
      assignedMemberId: issue.assignedTo?._id || issue.assignedTo?.id || "",
      dueDate: toDateInput(issue.dueDate),
    });
    setEditorError("");
    setConfirmingDelete(false);
    setEditorOpen(true);
  };

  const saveTask = async (event) => {
    event.preventDefault();
    const title = draft.title.trim();
    if (title.length < 2) {
      setEditorError("Task title needs at least 2 characters.");
      return;
    }

    const payload = {
      title,
      description: draft.description.trim(),
      boardId: id,
      status: draft.status,
      priority: draft.priority,
      dueDate: draft.dueDate || null,
      assignedMemberId: draft.assignedMemberId || null,
    };

    setSubmitting(true);
    setEditorError("");

    try {
      if (editorMode === "edit" && activeIssue) {
        const { data } = await api.patch(`/issues/${activeIssue._id}`, payload);
        setIssues((current) =>
          current.map((issue) => (issue._id === activeIssue._id ? data.issue : issue)),
        );
        setBoardNotice("Task updated.");
      } else {
        const { data } = await api.post("/issue", payload);
        setIssues((current) => [...current, data.issue]);
        setBoardNotice("Task added to the board.");
      }
      setEditorOpen(false);
      setConfirmingDelete(false);
      window.setTimeout(() => setBoardNotice(""), 3000);
    } catch (error) {
      setEditorError(getErrorMessage(error, "We couldn’t save this task."));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTask = async () => {
    if (!activeIssue) return;
    setSubmitting(true);
    setEditorError("");
    try {
      await api.delete(`/issues/${activeIssue._id}`);
      setIssues((current) => current.filter((issue) => issue._id !== activeIssue._id));
      setEditorOpen(false);
      setConfirmingDelete(false);
      setBoardNotice("Task deleted.");
      window.setTimeout(() => setBoardNotice(""), 3000);
    } catch (error) {
      setEditorError(getErrorMessage(error, "We couldn’t delete this task."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDragEnd = async ({ source, destination }) => {
    if (!destination || savingOrder) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const previousIssues = issues;
    const nextGroups = Object.fromEntries(
      Object.entries(groups).map(([status, items]) => [status, [...items]]),
    );
    const sourceItems = nextGroups[source.droppableId];
    const destinationItems = nextGroups[destination.droppableId];
    const [movedIssue] = sourceItems.splice(source.index, 1);
    destinationItems.splice(destination.index, 0, {
      ...movedIssue,
      status: destination.droppableId,
    });

    const optimisticIssues = flattenGroups(nextGroups);
    setIssues(optimisticIssues);
    setSavingOrder(true);
    setBoardNotice("");

    try {
      const { data } = await api.patch(`/boards/${id}/issues/reorder`, {
        groups: serializeGroups(nextGroups),
      });
      setIssues(data.issues || optimisticIssues);
      setBoardNotice("Board order saved.");
      window.setTimeout(() => setBoardNotice(""), 2200);
    } catch (error) {
      if (error.response?.status === 409) {
        try {
          const { data } = await api.get(`/boards/${id}/issues`);
          setIssues(data.issues || previousIssues);
          setBoardNotice("The board changed elsewhere, so the latest order was restored.");
        } catch {
          setIssues(previousIssues);
          setBoardNotice("The board changed elsewhere. Refresh before moving another task.");
        }
      } else {
        setIssues(previousIssues);
        setBoardNotice(getErrorMessage(error, "That move couldn’t be saved, so it was undone."));
      }
    } finally {
      setSavingOrder(false);
    }
  };

  if (loading) {
    return (
      <AppShell wide>
        <PageLoader label="Loading board" cards={5} />
      </AppShell>
    );
  }

  if (loadError || !board) {
    const fallbackPath = organization?._id ? `/organizations/${organization._id}` : "/dashboard";
    return (
      <AppShell>
        <section className="empty-state">
          <span className="empty-state-icon"><CircleDotDashed size={22} /></span>
          <h2>This board isn’t available</h2>
          <p>{loadError || "It may have moved, or you may not have access."}</p>
          <Link className="btn btn-secondary" to={fallbackPath}>
            <ArrowLeft size={17} /> Go back
          </Link>
        </section>
      </AppShell>
    );
  }

  const organizationId = organization?._id || board.organizationId?._id || board.organizationId;

  return (
    <AppShell wide>
      <section className="board-toolbar">
        <div className="board-title-area">
          <Link
            className="board-back-button"
            to={organizationId ? `/organizations/${organizationId}` : "/dashboard"}
            aria-label="Back to workspace"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="board-workspace-name">{organization?.title || "Workspace"}</p>
            <h1>{board.title}</h1>
          </div>
        </div>

        <div className="board-toolbar-actions">
          <div className="board-progress" aria-label={`${completion}% tasks complete`}>
            <div>
              <span>Progress</span>
              <strong>{completion}%</strong>
            </div>
            <span className="progress-track"><i style={{ width: `${completion}%` }} /></span>
          </div>
          <AvatarStack members={members} limit={5} />
          <button className="btn btn-primary" type="button" onClick={() => openCreate("todo")}>
            <Plus size={18} /> Add task
          </button>
        </div>
      </section>

      <section className="board-status-bar" aria-live="polite">
        <div>
          <span><CircleDotDashed size={16} /> {issues.length} total</span>
          <span><Sparkles size={16} /> {groups["in-progress"].length} in progress</span>
          <span><CheckCircle2 size={16} /> {completed} complete</span>
        </div>
        <div className={savingOrder ? "save-indicator is-saving" : "save-indicator"}>
          {savingOrder && <RefreshCw size={14} />}
          {savingOrder ? "Saving board…" : boardNotice || "Drag tasks anywhere to reprioritize"}
        </div>
      </section>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-board" aria-label={`${board.title} kanban board`}>
          {WORKFLOW.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              issues={groups[column.id]}
              onAdd={openCreate}
              onOpen={openEdit}
              dragDisabled={savingOrder}
            />
          ))}
        </div>
      </DragDropContext>

      <div className="board-mobile-hint" role="note">
        Swipe horizontally to see every stage. Use each card’s handle to drag it.
      </div>

      <InlineNotice message={loadError} />

      <TaskEditorModal
        open={editorOpen}
        onClose={closeEditor}
        mode={editorMode}
        draft={draft}
        setDraft={setDraft}
        members={members}
        onSubmit={saveTask}
        submitting={submitting}
        error={editorError}
        confirmingDelete={confirmingDelete}
        setConfirmingDelete={setConfirmingDelete}
        onDelete={deleteTask}
      />
    </AppShell>
  );
};

export default TaskPage;
