import { Trash2 } from "lucide-react";
import InlineNotice from "./InlineNotice";
import Modal from "./Modal";
import { PRIORITIES, WORKFLOW } from "../lib/workflow";

const TaskEditorModal = ({
  open,
  onClose,
  mode,
  draft,
  setDraft,
  members,
  onSubmit,
  submitting,
  error,
  confirmingDelete,
  setConfirmingDelete,
  onDelete,
}) => {
  const update = (field) => (event) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Task details" : "Create a task"}
      eyebrow={mode === "edit" ? "Keep the work current" : "Make the next step clear"}
      size="lg"
    >
      <form className="modal-form task-editor-form" onSubmit={onSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="task-title">Task title</label>
          <input
            className="input"
            id="task-title"
            value={draft.title}
            onChange={update("title")}
            placeholder="What needs to happen?"
            maxLength={140}
            autoFocus
            required
          />
        </div>

        <div className="field">
          <div className="field-label-row">
            <label className="field-label" htmlFor="task-description">Description</label>
            <span>{draft.description.length}/800</span>
          </div>
          <textarea
            className="textarea task-description-input"
            id="task-description"
            value={draft.description}
            onChange={update("description")}
            placeholder="Add context, acceptance criteria or a useful note…"
            maxLength={800}
          />
        </div>

        <div className="task-editor-grid">
          <div className="field">
            <label className="field-label" htmlFor="task-status">Status</label>
            <select className="select" id="task-status" value={draft.status} onChange={update("status")}>
              {WORKFLOW.map((column) => (
                <option key={column.id} value={column.id}>{column.title}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="task-priority">Priority</label>
            <select className="select" id="task-priority" value={draft.priority} onChange={update("priority")}>
              {PRIORITIES.map((priority) => (
                <option key={priority.id} value={priority.id}>{priority.title}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="task-assignee">Assignee</label>
            <select className="select" id="task-assignee" value={draft.assignedMemberId} onChange={update("assignedMemberId")}>
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member._id || member.id} value={member._id || member.id}>
                  {member.username}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="task-due-date">Due date</label>
            <input className="input" id="task-due-date" type="date" value={draft.dueDate} onChange={update("dueDate")} />
          </div>
        </div>

        <InlineNotice message={error} />

        {confirmingDelete ? (
          <div className="delete-confirmation" role="alert">
            <div>
              <strong>Delete this task permanently?</strong>
              <span>This action cannot be undone.</span>
            </div>
            <div>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setConfirmingDelete(false)}>
                Keep task
              </button>
              <button className="btn btn-danger btn-sm" type="button" onClick={onDelete} disabled={submitting}>
                {submitting ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-actions modal-actions-split">
            <div>
              {mode === "edit" && (
                <button className="btn btn-ghost task-delete-button" type="button" onClick={() => setConfirmingDelete(true)}>
                  <Trash2 size={16} /> Delete
                </button>
              )}
            </div>
            <div>
              <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting && <span className="spinner" aria-hidden="true" />}
                {submitting ? "Saving…" : mode === "edit" ? "Save changes" : "Create task"}
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default TaskEditorModal;
