import { useState } from "react";
import "../../styles/ToDoList.css";
import EditButton from "./EditButton";
import ToDoFilterButton from "./ToDoFilterButton";
import AddButton from "./AddButton";
import TaskEditModal from "./TaskEditModal";
import MessageConfirmation from "./MessageConfirmation";

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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState(null);
    const [taskToDelete, setTaskToDelete] = useState(null);

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

    return (
        <div className="todolist-panel">
            <div className="todolist-header">
                <h2 className="todolist-title">To-Do List</h2>
                <div className="todolist-header-actions">
                    <ToDoFilterButton onClick={() => console.log('Filters clicked')} />
                    <AddButton onToDoSaved={() => setTasks(initialTasks)} />
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

            <TaskEditModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                onSave={handleSave}
                task={taskToEdit}
                title={taskToEdit ? "Editar Tarea" : "Nueva Tarea"}
            />

            <MessageConfirmation
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleDelete}
                title="Eliminar Tarea"
                message="¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer."
            />
        </div>
    );
}

export default ToDoList;