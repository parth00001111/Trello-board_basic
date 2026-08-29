import { Droppable } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import TaskCard from "./TaskCard";

const KanbanColumn = ({
  column,
  issues,
  onAdd,
  onOpen,
  dragDisabled,
  interactionDisabled = false,
}) => (
  <section className={`kanban-column column-${column.tone}`} aria-labelledby={`column-${column.id}`}>
    <header className="kanban-column-header">
      <div>
        <span className="column-status-dot" aria-hidden="true" />
        <h2 id={`column-${column.id}`}>{column.title}</h2>
        <span className="column-count">{issues.length}</span>
      </div>
      <button
        className="column-add-button"
        type="button"
        onClick={() => onAdd(column.id)}
        disabled={interactionDisabled}
        aria-label={`Add task to ${column.title}`}
      >
        <Plus size={17} />
      </button>
    </header>
    <p className="kanban-column-description">{column.description}</p>

    <Droppable droppableId={column.id} type="TASK">
      {(provided, snapshot) => (
        <div
          className={`kanban-task-list${snapshot.isDraggingOver ? " is-dragging-over" : ""}`}
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          {issues.map((issue, index) => (
            <TaskCard
              key={issue._id}
              issue={issue}
              index={index}
              onOpen={onOpen}
              dragDisabled={dragDisabled}
              interactionDisabled={interactionDisabled}
            />
          ))}
          {provided.placeholder}
          {!issues.length && !snapshot.isDraggingOver && (
            <button
              className="column-empty-state"
              type="button"
              onClick={() => onAdd(column.id)}
              disabled={interactionDisabled}
            >
              <Plus size={16} /> Add the first task
            </button>
          )}
        </div>
      )}
    </Droppable>
  </section>
);

export default KanbanColumn;
