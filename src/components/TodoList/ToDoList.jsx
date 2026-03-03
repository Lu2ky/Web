import { useCallback, useEffect, useMemo, useState } from "react";
import "../../styles/ToDoList.css";
import ToDoFilterButton from "./ToDoFilterButton";
import AddButton from "./AddButton";
import TaskEditModal from "./TaskEditModal";
import MessageConfirmation from "./MessageConfirmation";
import ToDoFilterModal from "./ToDoFilterModal";
import ToDoListTagFetcher from "../../services/ToDoListTagFetcher";
import RemindCard from "./RemindCard";
import ReminderService from "../../services/reminderService";

const initialTasks = [];

const defaultFilters = {
    status: "all",
    priority: "all",
    tag: ""
};

const normalizePriority = value => {
    const normalized = String(value || "").toLowerCase();
    if (normalized === "high" || normalized === "alta") return "alta";
    if (normalized === "medium" || normalized === "media") return "media";
    if (normalized === "low" || normalized === "baja") return "baja";
    return "";
};

const getTaskPriority = task => {
    if (task.priority) {
        return normalizePriority(task.priority);
    }

    const priorityTag = task.tags?.find(tag =>
        ["priority-high", "priority-medium", "priority-low"].includes(tag.type)
    );

    if (!priorityTag) return "";
    if (priorityTag.type === "priority-high") return "alta";
    if (priorityTag.type === "priority-medium") return "media";
    if (priorityTag.type === "priority-low") return "baja";
    return "";
};

function ToDoList({ userId = "" }) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [tasks, setTasks] = useState(initialTasks);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [activeFilters, setActiveFilters] = useState(defaultFilters);

    const loadReminderTasks = useCallback(async () => {
        if (!userId) {
            setTasks(initialTasks);
            return;
        }

        try {
            const reminders = await ReminderService.getByUser(userId);
            setTasks(reminders);
        } catch (error) {
            console.error("Error al cargar recordatorios:", error);
            setTasks([]);
        }
    }, [userId]);

    useEffect(() => {
        loadReminderTasks();
    }, [loadReminderTasks]);

    const [availableTags, setAvailableTags] = useState([]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const statusMatches =
                activeFilters.status === "all" ||
                (activeFilters.status === "completed" && task.completed) ||
                (activeFilters.status === "pending" && !task.completed);

            const taskPriority = getTaskPriority(task);
            const priorityMatches =
                activeFilters.priority === "all" || taskPriority === activeFilters.priority;

            const normalizedTagFilter = activeFilters.tag.trim().toLowerCase();
            const tagMatches =
                !normalizedTagFilter ||
                task.tags?.some(tag =>
                    String(tag.label || "")
                        .toLowerCase()
                        .includes(normalizedTagFilter)
                );

            return statusMatches && priorityMatches && tagMatches;
        });
    }, [tasks, activeFilters]);

    const toggleTask = async (id) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const newCompletedState = !task.completed;

        // Optimistically update UI
        setTasks((prev) =>
            prev.map((t) =>
                t.id === id ? { ...t, completed: newCompletedState } : t
            )
        );

        // Update backend
        try {
            await ReminderService.updateState(id, newCompletedState);
        } catch (error) {
            console.error("Error al actualizar estado del recordatorio:", error);
            // Revert on error
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === id ? { ...t, completed: !newCompletedState } : t
                )
            );
        }
    };

    const deleteTask = (id) => {
        setTaskToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const editTask = (id) => {
        // Placeholder: abrir modal o formulario de edición.
        // Actualmente solo hace log para integrarlo visualmente.
        const task = tasks.find(t => t.id === id);
        setTaskToEdit(task);
        setIsEditModalOpen(true);
    };

    const handleSave = async (formData) => {
        if (!taskToEdit) {
            setIsEditModalOpen(false);
            setTaskToEdit(null);
            return;
        }

        const updatedTask = {
            ...taskToEdit,
            name: formData.name,
            description: formData.description,
            dueDate: formData.dueDate,
            tags: formData.tags,
            priority: formData.priority
        };

        setTasks(prev =>
            prev.map(task => (task.id === taskToEdit.id ? updatedTask : task))
        );

        setIsEditModalOpen(false);
        setTaskToEdit(null);

        try {
            await ReminderService.updateFromEdit(taskToEdit, updatedTask, userId);
            await loadReminderTasks();
        } catch (error) {
            console.error("Error al actualizar recordatorio:", error);
            await loadReminderTasks();
        }
    };

    const handleDelete = async () => {
        if (userId && taskToDelete) {
            try {
                await ReminderService.deleteReminder(taskToDelete);
            } catch (err) {
                console.error("Error al eliminar recordatorio en servidor:", err);
            }
        }

        setTasks(prev => prev.filter(task => task.id !== taskToDelete));
        setIsDeleteModalOpen(false);
        setTaskToDelete(null);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setTaskToEdit(null);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setTaskToDelete(null);
    };

    const hasActiveFilters =
        activeFilters.status !== "all" ||
        activeFilters.priority !== "all" ||
        activeFilters.tag.trim() !== "";

    return (
        <>
            <button
                className="todo-drawer-toggle"
                onClick={() => setIsDrawerOpen(true)}
                title={isDrawerOpen ? "Cerrar lista de tareas" : "Abrir lista de tareas"}
                aria-label={isDrawerOpen ? "Cerrar lista de tareas" : "Abrir lista de tareas"}
                type="button"
                style={{display: isDrawerOpen ? 'none' : undefined}}
            >
                TO-DO
            </button>
            {isDrawerOpen && (
                <div
                className="todo-overlay"
                onClick={() => setIsDrawerOpen(false)}
                />
            )}
            <div className={`todolist-panel${isDrawerOpen ? " open" : ""}`}>
<<<<<<< Updated upstream
                <ToDoListTagFetcher userId={userId} onDataLoaded={setAvailableTags} />
=======
                <ToDoListTagFetcher onDataLoaded={setAvailableTags} userId={userId} />
>>>>>>> Stashed changes

                <div className="todolist-header">
                    <h2 className="todolist-title">To-Do List</h2>
                    <div className="todolist-header-actions">
                        <ToDoFilterButton onClick={() => setIsFilterModalOpen(true)} />
<<<<<<< Updated upstream
                        <AddButton userId={userId} onToDoSaved={loadReminderTasks} />
=======
                        <AddButton onToDoSaved={loadReminderTasks} userId={userId} availableTags={availableTags} />
>>>>>>> Stashed changes
                    </div>
                </div>

                <div className="todolist-section-label">
                    TASKS <span className="todolist-task-count">({filteredTasks.length})</span>
                    {hasActiveFilters && <span className="todolist-active-filter-chip">Filtrado</span>}
                </div>

                <div className="todolist-tasks">
                    {filteredTasks.map((task) => {
                        const priority = getTaskPriority(task);
                        return (
                            <RemindCard
                                key={task.id}
                                task={task}
                                priority={priority}
                                onToggle={toggleTask}
                                onEdit={editTask}
                                onDelete={deleteTask}
                            />
                        );
                    })}

                    {filteredTasks.length === 0 && (
                        <div className="todolist-empty-state">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" strokeLinecap="round" strokeLinejoin="round"/>
                                <rect x="9" y="3" width="6" height="4" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <p>{!userId ? "Ingresa un ID para cargar recordatorios." : "No hay tareas para los filtros seleccionados."}</p>
                        </div>
                    )}
                </div>

                <TaskEditModal
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    onSave={handleSave}
                    task={taskToEdit}
                    title={taskToEdit ? "Editar Tarea" : "Nueva Tarea"}
                    availableTags={availableTags}
                />

                <MessageConfirmation
                    isOpen={isDeleteModalOpen}
                    onClose={handleCloseDeleteModal}
                    onConfirm={handleDelete}
                    title="Eliminar Tarea"
                    message="¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer."
                />

                <ToDoFilterModal
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    onApply={setActiveFilters}
                    initialFilters={activeFilters}
                    availableTags={availableTags}
                />
            </div>
        </>
    );
}


export default ToDoList;