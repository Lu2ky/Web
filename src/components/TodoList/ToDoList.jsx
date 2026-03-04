<<<<<<< Updated upstream
import { useState } from "react";
import "../../styles/ToDoList.css";
import EditButton from "./EditButton";
import ToDoFilterButton from "./ToDoFilterButton";

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

function ToDoList() {
    const [tasks, setTasks] = useState(initialTasks);

    const toggleTask = (id) => {
        setTasks((prev) =>
            prev.map((task) =>
                task.id === id ? { ...task, completed: !task.completed } : task
            )
        );
    };

    const deleteTask = (id) => {
        setTasks((prev) => prev.filter((task) => task.id !== id));
    };

    const editTask = (id) => {
        // Placeholder: abrir modal o formulario de edición.
        // Actualmente solo hace log para integrarlo visualmente.
        console.log('Edit task', id);
    };

    return (
        <div className="todolist-panel">
            <div className="todolist-header">
                <h2 className="todolist-title">To-Do List</h2>
                <div className="todolist-header-actions">
                    <ToDoFilterButton onClick={() => console.log('Filters clicked')} />
                    <button className="todolist-add-btn" title="Add task">+</button>
                </div>
            </div>

            <div className="todolist-section-label">
                TASKS <span className="todolist-task-count">({tasks.length})</span>
            </div>

            <div className="todolist-tasks">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        className={`todolist-task-card${task.completed ? " completed" : ""}`}
                    >
                        <div className="todolist-task-top">
                            <button
                                className={`todolist-task-checkbox${task.completed ? " checked" : ""}`}
                                onClick={() => toggleTask(task.id)}
                                aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
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
                            {task.tags.map((tag, index) => (
                                <span key={index} className={`todolist-tag ${tag.type}`}>
                                    {tag.label}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
=======
import {useEffect, useState, useCallback } from 'react'
import '../../styles/ToDoList.css'
// Botones y componentes 
import TodoCard from './ToDoCard'
import AddTodoButton from './addToDoButton'
import EditTodoModal from './editTodoModal'
import FilterModal from './filterModal'
import MessageConfirmationToDo from './MensageConfirmationToDo'
import ToDoListTagFetcher, {
    deleteReminder,
    updateReminderState,
    fetchUserTags,
} from '../../services/ToDoListTagFetcher'
//import { deleteReminder, toggleReminderComplete } from '../../services/ToDoListService'

const ToDoList = ({ userId }) => {
    // Estado local para las tareas y el filtro
    const [tasks, setTasks] = useState([]) // Lista de tareas
    const [userTags, setUserTags] = useState([])       // Etiquetas del usuario (para filtro y sugerencias)
    // Estados para modales
    const [editTask, setEditTask] = useState(null) // Tarea seleccionada para edición
    const [filterOpen, setFilterOpen] = useState(false) // Estado para controlar la apertura del modal de filtrado
    const [deleteConfirm, setDeleteConfirm] = useState(null)    // Tarea a eliminar (null = cerrado)
    // Estado filtro activo
    const [selectedFilterTags, setSelectedFilterTags] = useState([]) // Tags seleccionados para filtrar

    // Cargar etiquetas del usuario (filtro y sugerencias) al montar el componente
    useEffect(() => {
        if (!userId) return;

        const loadTags = async () => {
            try {
                const tags = await fetchUserTags(userId);
                setUserTags(tags); // [{ id, nombre }, ...]
            } catch (err) {
                console.error("Error al cargar etiquetas del usuario:", err);
            }
        };

        loadTags();
    }, [userId]);

    // Callback para cuando el fetcher carga datos
    const handleDataLoaded = useCallback((data) => {
        setTasks(data)
    }, [])

    // Agregar nueva tarea (viene del modal AddTodoButton)
    const handleTaskAdd = (newTask) => {
        // Agregar tarea temporal a la UI inmediatamente
        setTasks((prev) => [newTask, ...prev]);

        // Recargar datos del backend después de 1 segundo
        // Esto reemplaza la tarea temporal con los datos reales (IDs correctos)
        setTimeout(() => {
            setFetchKey((prev) => prev + 1);
        }, 1000);
    };

    // Toggle completado
    const handleToggleComplete = async (id, newState) => {
        // Actualización optimizada
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, completed: newState } : t))
        )

        // Buscar el reminderId para la API
        const task = tasks.find((t) => t.id === id)
        if (task?.reminderId) {
            try {
                await updateReminderState(task.reminderId, newState)
            } catch (err) {
                console.error("Error al actualizar estado:", err)
                // Revertir si falla
                setTasks((prev) =>
                    prev.map((t) => (t.id === id ? { ...t, completed: !newState } : t))
                )
            }
        }
    }

    // Editar tarea
    const handleEdit = (task) => {
        console.log("Editar tarea:", task)
        setEditTask(task);
        // Abrir modal de edición
    }

    // Guardar cambios de edición en estado local
    const handleEditSave = (updatedTask) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
        );
        setEditTask(null); // Cerrar el modal de edición
    };


    // Eliminar tarea (Mostrar confirmación antes de eliminar)
    const handleDeleteRequest = (id) => {
        // Buscar la tarea completa para mostrar en el mensaje
        const task = tasks.find((t) => t.id === id);
        if (task) {
            setDeleteConfirm(task); // Abre el modal de confirmación
        }
    };

    // Confirmar eliminación

    const handleDeleteConfirm = async () => {
        const task = deleteConfirm; // Tarea a eliminar
        setDeleteConfirm(null);     // Cerrar modal de confirmación

        if (!task) return;

        // Actualización optimizada— remover de la lista
        setTasks((prev) => prev.filter((t) => t.id !== task.id));

        if (task.reminderId) {
            try {
                // POST al backend para eliminar el recordatorio
                await deleteReminder(task.reminderId);
                console.log(`Recordatorio ${task.reminderId} eliminado exitosamente`);
            } catch (err) {
                console.error("Error al eliminar:", err);
                // Revertir — volver a agregar la tarea si falla
                setTasks((prev) => [...prev, task]);
            }
        }
    };

    // Filtrar tareas visibles (no eliminadas)
    const handleFilterApply = (selectedTags) => {
        setSelectedFilterTags(selectedTags); // Guardar filtros activos
        setFilterOpen(false);                // Cerrar modal de filtro
    };

    // Limpiar todos los filtros
    const handleFilterClear = () => {
        setSelectedFilterTags([]);
        setFilterOpen(false);
    };

    // Tareas visibles según filtros activos
    const visibleTasks = tasks
        // 1. Filtrar tareas no eliminadas
        .filter((t) => !t.isDeleted)
        // 2. Filtrar por etiquetas seleccionadas (si hay alguna)
        .filter((t) => {
            // Si no hay filtros activos, mostrar todas
            if (selectedFilterTags.length === 0) return true;

            // Verificar si la tarea tiene al menos una de las etiquetas seleccionadas
            return t.tags?.some((tag) =>
                selectedFilterTags.includes(tag.label.toLowerCase())
            );
        });


    return (
        <div className="todo-list-container">
            {/* Fetcher invisible — solo carga datos al montar */}
            <ToDoListTagFetcher onDataLoaded={handleDataLoaded} userId={userId} />

            {/* ---- Header ---- */}
            <div className="todo-header">
                <h2 className="todo-title">To-Do List</h2>
                <div className="todo-actions">
                    {/* Botón de filtrado — abre modal de filtro */}
                    <button
                        className={`btn-filter ${selectedFilterTags.length > 0 ? 'btn-filter--active' : ''}`}
                        onClick={() => setFilterOpen(true)}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                        {/* Indicador de filtros activos */}
                        {selectedFilterTags.length > 0 && (
                            <span className="filter-badge">{selectedFilterTags.length}</span>
                        )}
                    </button>

                    {/* Botón de agregar — abre modal de creación */}
                    <AddTodoButton
                        userId={userId}
                        onTaskAdd={handleTaskAdd}
                        userTags={userTags} // Pasar etiquetas del usuario para sugerencias
                    />
                </div>
            </div>

            <div className="todo-divider"></div>

            {/* ---- Contador de tasks ---- */}
            <div className="todo-counter">
                <span className="counter-label">TASKS</span>
                <span className="counter-number">({visibleTasks.length})</span>
            </div>

            {/* ---- Cuerpo — Cards ---- */}
            <div className="todo-body">
                {visibleTasks.length === 0 ? (
                    <div className="todo-empty">
                        <p>No hay tareas pendientes</p>
                        <span>
                            {selectedFilterTags.length > 0
                                ? "No hay tareas con las etiquetas seleccionadas"
                                : "Presiona + para agregar una nueva"
                            }
                        </span>
                    </div>
                ) : (
                    visibleTasks.map((task) => (
                        <TodoCard
                            key={task.id}
                            task={task}
                            onToggleComplete={handleToggleComplete}
                            onEdit={handleEdit}
                            onDelete={handleDeleteRequest} // Abre confirmación, no elimina directamente
                        />
                    ))
                )}
            </div>

            {/* ---- Modal de filtrado ---- */}
            <FilterModal
                isOpen={filterOpen}
                onClose={() => setFilterOpen(false)}
                userTags={userTags}
                selectedTags={selectedFilterTags}
                onApply={handleFilterApply}
                onClear={handleFilterClear}
            />

            {/* ---- Modal de edición ---- */}
            {editTask && (
                <EditTodoModal
                    isOpen={!!editTask}
                    task={editTask}
                    userId={userId}
                    userTags={userTags}
                    onClose={() => setEditTask(null)}
                    onSave={handleEditSave}
                />
            )}

            {/* ---- Modal de confirmación de eliminación ---- */}
            <MessageConfirmationToDo
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDeleteConfirm}
                title={`¿Eliminar "${deleteConfirm?.title}"?`}
                description="Esta acción no se puede deshacer. El recordatorio se borrará permanentemente."
                confirmText="Sí, eliminar"
                cancelText="No, mantener"
            />
        </div>
    );
};
>>>>>>> Stashed changes

export default ToDoList;