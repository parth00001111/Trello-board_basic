import { Draggable } from "@hello-pangea/dnd";
import { Calendar, CheckCircle2, GripVertical } from "lucide-react";
import UserAvatar from "./UserAvatar";

const formatDueDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
};

const isOverdue = (value, status) => {
  if (!value || status === "done") return false;
  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) return false;
  const dueKey = dueDate.toISOString().slice(0, 10);
  const today = new Date();
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  return dueKey < todayKey;
};

const TaskCard = ({ issue, index, onOpen, dragDisabled, interactionDisabled = false }) => (
  <Draggable draggableId={String(issue._id)} index={index} isDragDisabled={dragDisabled}>
    {(provided, snapshot) => (
      <article
        className={`task-card${snapshot.isDragging ? " task-card-dragging" : ""}`}
        ref={provided.innerRef}
        {...provided.draggableProps}
      >
        <div className="task-card-topline">
          <span className={`priority-badge priority-${issue.priority || "medium"}`}>
            {issue.priority || "medium"}
          </span>
          <span
            className={`task-drag-handle${dragDisabled ? " is-disabled" : ""}`}
            {...provided.dragHandleProps}
            aria-label={`Move ${issue.title}`}
            aria-disabled={dragDisabled}
            title="Drag to move task"
          >
            <GripVertical size={17} />
          </span>
        </div>

        <button
          className="task-card-content"
          type="button"
          onClick={() => onOpen(issue)}
          disabled={interactionDisabled}
        >
          <h3>{issue.title}</h3>
          {issue.description && <p>{issue.description}</p>}
        </button>

        <div className="task-card-footer">
          <div className="task-assignee">
            {issue.assignedTo ? (
              <>
                <UserAvatar name={issue.assignedTo.username} size="xs" />
                <span>{issue.assignedTo.username}</span>
              </>
            ) : (
              <span className="unassigned-label">Unassigned</span>
            )}
          </div>

          {issue.status === "done" ? (
            <span className="task-complete-label"><CheckCircle2 size={14} /> Done</span>
          ) : issue.dueDate ? (
            <span className={isOverdue(issue.dueDate, issue.status) ? "task-due overdue" : "task-due"}>
              <Calendar size={14} /> {formatDueDate(issue.dueDate)}
            </span>
          ) : null}
        </div>
      </article>
    )}
  </Draggable>
);

export default TaskCard;
