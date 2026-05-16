import EditButton from "./EditButton";
import DuplicateButton from "./DuplicateButton";
import "../../styles/Reminder.css";

function RemindCard({ task, priority = "", onToggle, onEdit, onDelete, onDuplicate = () => {}, isSelectionMode = false, isSelected = false, onSelection = () => {} }) {
    const priorityClass = priority ? `remindcard-priority-${priority}` : "";
    const title = task?.name || "Recordatorio";
    const description = task?.description || "";
    const isCompleted = task.completed === true;

    const formatDueDate = (value) => {
        if (!value) return "";

        if (typeof value === "string") {
            const normalized = value.includes(" ") ? value.replace(" ", "T") : value;
            const date = new Date(normalized);
            if (!Number.isNaN(date.getTime())) {
                const day = String(date.getDate()).padStart(2, "0");
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const year = date.getFullYear();
                const minutes = String(date.getMinutes()).padStart(2, "0");

                const rawHours = date.getHours();
                const period = rawHours >= 12 ? "p.m." : "a.m.";
                const hours12 = String(rawHours % 12 || 12).padStart(2, "0");

                return `${day}/${month}/${year} ${hours12}:${minutes} ${period}`;
            }
        }

        return String(value);
    };

    const dueDateText = formatDueDate(task?.dueDate);

    return (
        <div className={`remindcard ${priorityClass}${isCompleted ? " completed" : ""}${isSelected ? " selected" : ""}${isSelectionMode ? " selection-mode" : ""}`}>
            <div className="remindcard-accent" />
            <div className="remindcard-body">
                <div className="remindcard-top">
                    {isSelectionMode && (
                        <button
                            className={`remindcard-selection-checkbox${isSelected ? " checked" : ""}`}
                            onClick={() => onSelection(task.id)}
                            aria-label={isSelected ? "Deseleccionar" : "Seleccionar"}
                            title={isSelected ? "Deseleccionar" : "Seleccionar"}
                            type="button"
                        >
                            {isSelected && (
                                <svg width="10" height="10" viewBox="0 0 12 10" fill="none">
                                    <path d="M1 5.5L4 8.5L11 1.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </button>
                    )}
                    <div className="remindcard-info">
                        <div className="remindcard-title-row">
                            <span className="remindcard-name">{title}</span>
                            <button
                                className={`remindcard-status-toggle remindcard-status-toggle-${isCompleted ? "completed" : "pending"}`}
                                onClick={() => onToggle(task.id)}
                                aria-label={isCompleted ? "Marcar como pendiente" : "Marcar como completada"}
                                title={isCompleted ? "Marcar como pendiente" : "Marcar como completada"}
                                type="button"
                            >
                                {isCompleted ? "Completada" : "Pendiente"}
                            </button>
                        </div>
                        {description && (
                            <span className="remindcard-description">{description}</span>
                        )}
                        {dueDateText && (
                            <span className="remindcard-due">
                                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M4 0a1 1 0 0 1 1 1h6a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1zm-2 4h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                                </svg>
                                {dueDateText}
                            </span>
                        )}
                    </div>
                </div>

                <div className="remindcard-actions">
                    <EditButton
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent("onboarding:todo-card-edit-clicked"));
                            onEdit(task.id);
                        }}
                        className="todo-card-edit-btn"
                        dataOnboardingId="todo-card-edit-button"
                    />
                    <DuplicateButton
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent("onboarding:todo-card-duplicate-clicked"));
                            onDuplicate(task.id);
                        }}
                        className="todo-card-duplicate-btn"
                        dataOnboardingId="todo-card-duplicate-button"
                    />
                    <button
                        className="remindcard-delete"
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent("onboarding:todo-card-delete-clicked"));
                            onDelete(task.id);
                        }}
                        aria-label="Eliminar tarea"
                        title="Eliminar"
                        type="button"
                        data-onboarding-id="todo-card-delete-button"
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                        </svg>
                    </button>
                </div>

                {task.tags && task.tags.length > 0 && (
                    <div className="remindcard-tags">
                        {task.tags.map((tag, index) => {
                            const label = typeof tag === "string" ? tag : (tag?.label ?? tag?.name ?? "");
                            const type = typeof tag === "string" ? "custom" : (tag?.type ?? "custom");
                            if (!label) return null;
                            return (
                                <span key={`${label}-${index}`} className={`remindcard-tag ${type}`}>
                                    {label}
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default RemindCard;
