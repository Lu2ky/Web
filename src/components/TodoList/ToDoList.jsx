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
import TaskAddModal from "./TaskAddModal"; // Import del modal para duplicar

const initialTasks = [];

const defaultFilters = {
    status: "all",
    priority: "all",
    tag: ""
};

const normalizePriority = value => {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "1" || normalized === "high" || normalized === "alta") return "alta";
    if (normalized === "2" || normalized === "medium" || normalized === "media") return "media";
    if (normalized === "3" || normalized === "low" || normalized === "baja") return "baja";
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
    
    // Estados para manejar la duplicación de recordatorios
    const [taskToDuplicate, setTaskToDuplicate] = useState(null);
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

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
        const task = tasks.find(t => t.id === id);
        setTaskToDelete(task ?? { id });
        setIsDeleteModalOpen(true);
    };

    const editTask = (id) => {
        const task = tasks.find(t => t.id === id);
        setTaskToEdit(task);
        setIsEditModalOpen(true);
    };

    // Función para manejar la duplicación de recordatorios
    // Recibe el ID de la tarea a duplicar, busca la tarea completa y abre el modal
    const handleDuplicate = (id) => {
        const task = tasks.find(t => t.id === id);
        setTaskToDuplicate(task);
        setIsDuplicateModalOpen(true);
    };

    // Función para guardar la tarea duplicada
    // Crea un nuevo recordatorio con los datos proporcionados desde el modal de duplicado
    const handleSaveDuplicate = async (formData) => {
        if (!taskToDuplicate || !userId) {
            setIsDuplicateModalOpen(false);
            setTaskToDuplicate(null);
            return;
        }

        try {
            // Llamar directamente al servicio con el userId
            await ReminderService.addReminder(
                userId,
                formData.name,
                formData.description,
                formData.dueDate,
                formData.priority,
                // Extraer etiquetas del formulario y filtrar
                formData.tags.map(t => typeof t === 'string' ? t : t.label || "").filter(Boolean),
                userId
            );

            // Cerrar modal y limpiar estado
            setIsDuplicateModalOpen(false);
            setTaskToDuplicate(null);
            
            // Recargar la lista de recordatorios para mostrar el nuevo
            await loadReminderTasks();
        } catch (error) {
            console.error("Error al duplicar recordatorio:", error);
            await loadReminderTasks();
        }
    };

    // Función para cerrar el modal de duplicado y limpiar el estado
    const handleCloseDuplicateModal = () => {
        setIsDuplicateModalOpen(false);
        setTaskToDuplicate(null);
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
            await ReminderService.updateFromEdit(taskToEdit, updatedTask);
            await loadReminderTasks();
        } catch (error) {
            console.error("Error al actualizar recordatorio:", error);
            await loadReminderTasks();
        }
    };

    const handleDelete = async () => {
        if (userId && taskToDelete) {
            const apiId = taskToDelete.recordatorioId ?? taskToDelete.id;
            try {
                await ReminderService.deleteReminder(apiId);
            } catch (err) {
                console.error("Error al eliminar recordatorio en servidor:", err);
            }
        }

        setTasks(prev => prev.filter(task => task.id !== taskToDelete?.id));
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
                style={{ display: isDrawerOpen ? 'none' : undefined }}
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
                <ToDoListTagFetcher userId={userId} onDataLoaded={setAvailableTags} />

                <div className="todolist-header">
                    <h2 className="todolist-title">To-Do List</h2>
                    <div className="todolist-header-actions">
                        <ToDoFilterButton onClick={() => setIsFilterModalOpen(true)} />
                        <AddButton userId={userId} onToDoSaved={loadReminderTasks} availableTags={availableTags} />
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
                                onDuplicate={handleDuplicate} //Pasar función para duplicar
                            />
                        );
                    })}

                    {filteredTasks.length === 0 && (
                        <div className="todolist-empty-state">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" strokeLinecap="round" strokeLinejoin="round" />
                                <rect x="9" y="3" width="6" height="4" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p>{!userId ? "Ingresa un ID para cargar recordatorios." : "No hay tareas para los filtros seleccionados."}</p>
                        </div>
                    )}
                </div>

                {/*  Modal para duplicar recordatorios */}
                {/* Reutiliza TaskAddModal pero con datos precargados de la tarea a duplicar */}
                <TaskAddModal
                    isOpen={isDuplicateModalOpen}
                    onClose={handleCloseDuplicateModal}
                    onSave={handleSaveDuplicate}
                    task={taskToDuplicate}
                    title={taskToDuplicate ? "Duplicar Tarea" : "Nueva Tarea"}
                    userId={userId}
                    availableTags={availableTags}
                />

                <TaskEditModal
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    onSave={handleSave}
                    task={taskToEdit}
                    title={taskToEdit ? "Editar Tarea" : "Nueva Tarea"}
                    userId={userId}
                    availableTags={availableTags}
                />

                <MessageConfirmation
                    isOpen={isDeleteModalOpen}
                    onClose={handleCloseDeleteModal}
                    onConfirm={handleDelete}
                    title="Eliminar Tarea"
                    description="¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer."
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