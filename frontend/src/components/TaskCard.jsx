import { Draggable } from "@hello-pangea/dnd";
import { Calendar, CheckCircle2, GripVertical } from "lucide-react";
import UserAvatar from "./UserAvatar";

const formatDueDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
};

const isOverdue = (value, status) => {
  if (!value || status === "done") return false;
  const due = new Date(value);
  due.setHours(23, 59, 59, 999);
  return due < new Date();
};

const TaskCard = ({ issue, index, onOpen, dragDisabled }) => (
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
          <button
            type="button"
            className="task-drag-handle"
            {...provided.dragHandleProps}
            aria-label={`Move ${issue.title}`}
            title="Drag to move task"
          >
            <GripVertical size={17} />
          </button>
        </div>

        <button className="task-card-content" type="button" onClick={() => onOpen(issue)}>
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
