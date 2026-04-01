import { useCallback, useEffect, useMemo, useState } from "react";
import { FaFilter, FaCheckSquare, FaTimes, FaTrash } from "react-icons/fa";
import "../../styles/ToDoList.css";
import ToDoFilterButton from "./ToDoFilterButton";
import AddButton from "./AddButton";
import TaskEditModal from "./TaskEditModal";
import MessageConfirmation from "./MessageConfirmation";
import ToDoFilterModal from "./ToDoFilterModal";
import ToDoListTagFetcher from "../../services/ToDoListTagFetcher";
import RemindCard from "./RemindCard";
import ReminderService from "../../services/reminderService";
import { getUserData } from "../../services/userService";
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

const parseDueDateForFilter = value => {
    if (!value) return null;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const raw = String(value).trim();
    if (!raw) return null;

    const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) {
        const year = Number(dateOnly[1]);
        const month = Number(dateOnly[2]) - 1;
        const day = Number(dateOnly[3]);
        return new Date(year, month, day, 23, 59, 59, 999);
    }

    const dateTime = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (dateTime) {
        const year = Number(dateTime[1]);
        const month = Number(dateTime[2]) - 1;
        const day = Number(dateTime[3]);
        const hour = Number(dateTime[4]);
        const minute = Number(dateTime[5]);
        const second = Number(dateTime[6] || 0);
        return new Date(year, month, day, hour, minute, second);
    }

    const parsed = new Date(raw.replace(" ", "T"));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
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
    
    // Estados para manejar selección en masa y eliminación múltiple
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

    const loadReminderTasks = useCallback(async () => {
        if (!userId) {
            setTasks(initialTasks);
            return;
        }

        try {
            const reminders = await ReminderService.getByUser(userId);
            
            // Validación adicional: asegurar que no hay IDs duplicados
            const seenIds = new Set();
            const uniqueReminders = reminders.filter(task => {
                if (seenIds.has(task.id)) {
                    console.warn(`[ToDoList] Duplicate task ID detected in loaded reminders: ${task.id}, filtering out`);
                    return false;
                }
                seenIds.add(task.id);
                return true;
            });
            
            setTasks(uniqueReminders);
        } catch (error) {
            console.error("Error al cargar recordatorios:", error);
            setTasks([]);
        }
    }, [userId]);

    useEffect(() => {
        loadReminderTasks();
    }, [loadReminderTasks]);

    useEffect(() => {
        const handleCloseUnrelatedUi = (event) => {
            const allowOpenUi = Array.isArray(event?.detail?.allowOpenUi) ? event.detail.allowOpenUi : [];

            if (!allowOpenUi.includes("modal-todo-filter")) {
                setIsFilterModalOpen(false);
            }
            if (!allowOpenUi.includes("modal-todo-edit")) {
                setIsEditModalOpen(false);
                setTaskToEdit(null);
            }
            if (!allowOpenUi.includes("modal-todo-delete")) {
                setIsDeleteModalOpen(false);
                setTaskToDelete(null);
            }
            if (!allowOpenUi.includes("modal-todo-duplicate")) {
                setIsDuplicateModalOpen(false);
                setTaskToDuplicate(null);
            }
        };

        window.addEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
        return () => window.removeEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
    }, []);

    const [availableTags, setAvailableTags] = useState([]);

    const filteredTasks = useMemo(() => {
        const now = new Date();

        return tasks.filter(task => {
            const dueDate = parseDueDateForFilter(task.dueDate);
            const dueDateMatches = !dueDate || dueDate >= now;

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

            return dueDateMatches && statusMatches && priorityMatches && tagMatches;
        });
    }, [tasks, activeFilters]);

    const toggleTask = async (id) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const newCompletedState = !task.completed;

        // Actualizar la UI de forma optimista
        setTasks((prev) =>
            prev.map((t) =>
                t.id === id ? { ...t, completed: newCompletedState } : t
            )
        );

        // Actualizar en servidor, pasando el task completo para que use el nuevo endpoint unificado
        try {
            await ReminderService.updateState(id, newCompletedState, task);
        } catch (error) {
            console.error("Error al actualizar estado del recordatorio:", error);
            // Revertir en caso de error
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
        if (!userId) {
            setIsDuplicateModalOpen(false);
            setTaskToDuplicate(null);
            return;
        }

        try {
            const userData = await getUserData(userId);
            const rawUser = Array.isArray(userData) ? userData[0] : userData;
            const idUsuario =
                rawUser?.N_idUsuario ??
                rawUser?.idUsuario ??
                rawUser?.id_user ??
                rawUser?.ID_USER ??
                rawUser?.id ??
                userId;

            const tagLabels = (Array.isArray(formData?.tags) ? formData.tags : [])
                .filter((tag) =>
                    typeof tag === "string" ? true : !String(tag?.type ?? "").startsWith("priority-")
                )
                .map((tag) => (typeof tag === "string" ? tag : tag?.label || ""))
                .filter(Boolean);

            // Igual que el alta normal: id interno en P_usuario y código externo en P_codigo_usuario
            await ReminderService.addReminder(
                idUsuario,
                formData.name,
                formData.description,
                formData.dueDate,
                formData.priority,
                tagLabels,
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
        
        // Disparar evento de onboarding después de eliminar
        window.dispatchEvent(new CustomEvent("onboarding:todo-deleted"));
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setTaskToEdit(null);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setTaskToDelete(null);
    };

    // Funciones para selección en masa
    const toggleSelectionMode = () => {
        setSelectionMode(!selectionMode);
        if (selectionMode) {
            // Si estamos saliendo del modo de selección, limpiar selecciones
            setSelectedTaskIds(new Set());
        }
    };

    const toggleTaskSelection = (taskId) => {
        setSelectedTaskIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    const toggleAllTasks = () => {
        if (selectedTaskIds.size === filteredTasks.length) {
            // Si todos están seleccionados, deseleccionar todos
            setSelectedTaskIds(new Set());
        } else {
            // Seleccionar todos los filtrados
            const allIds = new Set(filteredTasks.map(task => task.id));
            setSelectedTaskIds(allIds);
        }
    };

    const handleBulkDelete = async () => {
        console.log("[handleBulkDelete] Starting bulk delete. userId from URL:", userId, "selectedTaskIds:", Array.from(selectedTaskIds));
        
        if (selectedTaskIds.size === 0) {
            console.log("[handleBulkDelete] No tasks selected");
            return;
        }

        // Preparar IDs para API: usar recordatorioId si existe, sino usar id
        const tasksToDelete = Array.from(selectedTaskIds).map(id => 
            tasks.find(t => t.id === id)
        ).filter(Boolean);

        console.log("[handleBulkDelete] tasksToDelete:", tasksToDelete);

        // Extraer los IDs de API (recordatorioId o id)
        const apiIds = tasksToDelete.map(task => task.recordatorioId ?? task.id);
        
        console.log("[handleBulkDelete] apiIds to send:", apiIds);

        try {
            // Obtener datos del usuario desde el endpoint para obtener el idUsuario real de BD
            console.log("[handleBulkDelete] Getting user data from endpoint with userId:", userId);
            const userData = await getUserData(userId);
            console.log("[handleBulkDelete] User data from endpoint:", userData);
            
            // Extraer el idUsuario real de la BD (puede ser array o objeto)
            const userObj = Array.isArray(userData) ? userData[0] : userData;
            const actualUserId = userObj?.idUsuario || userObj?.id || userId;
            
            console.log("[handleBulkDelete] Extracted idUsuario from API response:", actualUserId);
            
            if (!actualUserId) {
                throw new Error("No se pudo obtener el ID del usuario");
            }
            
            // Llamada única a la API para eliminar múltiples recordatorios
            const result = await ReminderService.deleteMultipleReminders(actualUserId, apiIds);
            console.log("[handleBulkDelete] Success! Result:", result);
        } catch (err) {
            console.error("[handleBulkDelete] Error en eliminación en masa:", err);
            return; // No actualizar la UI si hay error
        }

        // Actualizar UI: eliminar las tareas de la lista
        setTasks(prev => prev.filter(task => !selectedTaskIds.has(task.id)));
        
        // Limpiar selecciones y cerrar modales
        setSelectedTaskIds(new Set());
        setIsBulkDeleteModalOpen(false);
        setSelectionMode(false);
        
        // Disparar evento onboarding por cada elemento eliminado
        tasksToDelete.forEach(() => {
            window.dispatchEvent(new CustomEvent("onboarding:todo-deleted"));
        });
    };

    const handleCloseBulkDeleteModal = () => {
        setIsBulkDeleteModalOpen(false);
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
                        {!selectionMode && (
                            <>
                                <ToDoFilterButton onClick={() => setIsFilterModalOpen(true)} />
                                <button
                                    className="todolist-selection-toggle-btn"
                                    onClick={toggleSelectionMode}
                                    title="Seleccionar múltiples tareas"
                                    aria-label="Seleccionar múltiples tareas"
                                    type="button"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="todolist-selection-toggle-icon" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M7 7V5C7 4.44772 7.44772 4 8 4H18C18.5523 4 19 4.44772 19 5V15C19 15.5523 18.5523 16 18 16H16"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            opacity="0.4"
                                        />
                                        <rect x="3" y="8" width="12" height="13" rx="2" stroke="currentColor" strokeWidth="2" fill="white" />
                                        <path d="M6 12H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                                        <path d="M6 16H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                                        <circle cx="18" cy="18" r="5" fill="currentColor" />
                                        <path d="M15.5 18H20.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </button>
                                <AddButton userId={userId} onToDoSaved={loadReminderTasks} availableTags={availableTags} />
                            </>
                        )}
                        {selectionMode && (
                            <div className="todolist-selection-bar">
                                <button
                                    className="todolist-selection-cancel-btn"
                                    onClick={toggleSelectionMode}
                                    title="Cancelar selección"
                                    aria-label="Cancelar selección"
                                    type="button"
                                >
                                    <FaTimes className="todolist-selection-cancel-icon" />
                                </button>
                                <span className="todolist-selection-count">
                                    {selectedTaskIds.size} seleccionado{selectedTaskIds.size !== 1 ? "s" : ""}
                                </span>
                                <button
                                    className="todolist-select-all-btn"
                                    onClick={toggleAllTasks}
                                    title={selectedTaskIds.size === filteredTasks.length ? "Deseleccionar todo" : "Seleccionar todo"}
                                    aria-label={selectedTaskIds.size === filteredTasks.length ? "Deseleccionar todo" : "Seleccionar todo"}
                                    type="button"
                                >
                                    {selectedTaskIds.size === filteredTasks.length ? "Deseleccionar todo" : "Seleccionar todo"}
                                </button>
                                <button
                                    className="todolist-bulk-delete-btn"
                                    onClick={() => setIsBulkDeleteModalOpen(true)}
                                    disabled={selectedTaskIds.size === 0}
                                    title={selectedTaskIds.size === 0 ? "Selecciona al menos una tarea" : "Eliminar seleccionadas"}
                                    aria-label="Eliminar tareas seleccionadas"
                                    type="button"
                                >
                                    <FaTrash className="todolist-bulk-delete-icon" />
                                </button>
                            </div>
                        )}
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
                                onDuplicate={handleDuplicate}
                                isSelectionMode={selectionMode}
                                isSelected={selectedTaskIds.has(task.id)}
                                onSelection={toggleTaskSelection}
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
                    onboardingId="todo-duplicate-modal"
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

                <MessageConfirmation
                    isOpen={isBulkDeleteModalOpen}
                    onClose={handleCloseBulkDeleteModal}
                    onConfirm={handleBulkDelete}
                    title="Eliminar Tareas"
                    description={`¿Estás seguro de que deseas eliminar ${selectedTaskIds.size} tarea${selectedTaskIds.size !== 1 ? "s" : ""}? Esta acción no se puede deshacer.`}
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