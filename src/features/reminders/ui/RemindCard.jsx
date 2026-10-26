import EditButton from "../../../shared/ui/EditButton";
import DuplicateButton from "../../../shared/ui/DuplicateButton";
import { Icon } from "../../../shared/ui/IconSystem";
import "./Reminder.css";

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
                            <Icon 
                                name={isSelected ? "radioChecked" : "radio"} 
                                size="sm" 
                                aria-hidden="true"
                            />
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
                                <Icon name="calendar" size="xs" aria-hidden="true" />
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
                        <Icon name="trash" size="sm" aria-hidden="true" />
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
