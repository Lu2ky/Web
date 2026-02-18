import { useState } from "react";
import "../styles/ToDoList.css";

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

    return (
        <div className="todolist-panel">
            <div className="todolist-header">
                <h2 className="todolist-title">To-Do List</h2>
                <button className="todolist-add-btn" title="Add task">+</button>
            </div>

            <button className="todolist-filters-btn">
                <span className="todolist-filters-icon">🔽</span>
                Filters
            </button>

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
                            <button
                                className="todolist-task-delete"
                                onClick={() => deleteTask(task.id)}
                                aria-label="Delete task"
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

export default ToDoList;