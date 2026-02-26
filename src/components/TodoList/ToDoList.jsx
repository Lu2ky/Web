import { useCallback, useEffect, useMemo, useState } from "react";
import "../../styles/ToDoList.css";
import EditButton from "./EditButton";
import ToDoFilterButton from "./ToDoFilterButton";
import AddButton from "./AddButton";
import TaskEditModal from "./TaskEditModal";
import MessageConfirmation from "./MessageConfirmation";
import ToDoFilterModal from "./ToDoFilterModal";
import ToDoListTagFetcher from "../../services/ToDoListTagFetcher";

const initialTasks = [
    {
        id: 1,
        name: "Grade midterm exams",
        completed: false,
        tags: [
            { label: "Mathematics", type: "subject" },
            { label: "Grading", type: "category" },
            { label: "high", type: "priority-high" },
        ],
    },
    {
        id: 2,
        name: "Prepare lesson plan for next week",
        completed: false,
        tags: [
            { label: "English", type: "subject" },
            { label: "Planning", type: "category" },
            { label: "medium", type: "priority-medium" },
        ],
    },
    {
        id: 3,
        name: "Review homework submissions",
        completed: true,
        tags: [
            { label: "Physics", type: "subject" },
            { label: "Review", type: "category" },
            { label: "low", type: "priority-low" },
        ],
    },
    {
        id: 4,
        name: "Update course materials",
        completed: false,
        tags: [
            { label: "Chemistry", type: "subject" },
            { label: "Administrative", type: "category" },
            { label: "medium", type: "priority-medium" },
        ],
    },
];

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

    useEffect(() => {
        if (!userId) {
            setTasks(initialTasks);
        }
    }, [userId]);

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

    const toggleTask = (id) => {
        setTasks((prev) =>
            prev.map((task) =>
                task.id === id ? { ...task, completed: !task.completed } : task
            )
        );
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

    const handleSave = (formData) => {
        if (taskToEdit) {
            // Editar tarea existente
            setTasks(prev => prev.map(task => 
                task.id === taskToEdit.id 
                    ? { 
                        ...task, 
                        name: formData.name, 
                        dueDate: formData.dueDate,
                        tags: formData.tags,
                        priority: formData.priority
                    }
                    : task
            ));
        }
        setIsEditModalOpen(false);
        setTaskToEdit(null);
    };

    const handleDelete = () => {
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
            >
            </button>
            {isDrawerOpen && (
                <div
                className="todo-overlay"
                onClick={() => setIsDrawerOpen(false)}
                />
            )}
            <div className={`todolist-panel${isDrawerOpen ? " open" : ""}`}>
                <ToDoListTagFetcher onDataLoaded={setAvailableTags} />

                <div className="todolist-header">
                    <h2 className="todolist-title">To-Do List</h2>
                    <div className="todolist-header-actions">
                        <ToDoFilterButton onClick={() => setIsFilterModalOpen(true)} />
                        <AddButton onToDoSaved={() => setTasks(initialTasks)} />
                    </div>
                </div>

                <div className="todolist-section-label">
                    TASKS <span className="todolist-task-count">({filteredTasks.length})</span>
                    {hasActiveFilters && <span className="todolist-active-filter-chip">Filtrado</span>}
                </div>

                <div className="todolist-tasks">
                    {filteredTasks.map((task) => (
                        <div
                            key={task.id}
                            className={`todolist-task-card${task.completed ? " completed" : ""}`}
                        >
                            <div className="todolist-task-top">
                                <button
                                    className={`todolist-task-checkbox${task.completed ? " checked" : ""}`}
                                    onClick={() => toggleTask(task.id)}
                                    aria-label={task.completed ? "Marcar como pendiente" : "Marcar como completada"}
                                    title={task.completed ? "Marcar como pendiente" : "Marcar como completada"}
                                    type="button"
                                />
                                <span className="todolist-task-name">{task.name}</span>
                                <EditButton onClick={() => editTask(task.id)} />

                                <button
                                    className="todolist-task-delete"
                                    onClick={() => deleteTask(task.id)}
                                    aria-label="Delete task"
                                    title="Eliminar"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="todolist-task-tags">
                                {(task.tags || []).map((tag, index) => (
                                    <span key={index} className={`todolist-tag ${tag.type}`}>
                                        {tag.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredTasks.length === 0 && (
                        <p className="todolist-empty-state">No hay tareas para los filtros seleccionados.</p>
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