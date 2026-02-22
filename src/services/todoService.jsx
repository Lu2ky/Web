// servicio para guardar y recuperar tareas personales en localStorage

const STORAGE_KEY = "personalToDoList";

export function saveToDo(formData) {
    const todos = getAllToDos();

    const newToDo = {
        id: `todo-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        endDay: formData.endDay, // fecha seleccionada en el calendario
        priority: formData.priority,
        tags: Array.isArray(formData.tag) ? formData.tag : [formData.tag],
    };

    todos.push(newToDo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));

    return newToDo;
}

export function getAllToDos() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Error parsing todos:", error);
        return [];
    }
}

export function deleteToDo(id) {
    const todos = getAllToDos();
    const filtered = todos.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearAllToDos() {
    localStorage.removeItem(STORAGE_KEY);
}

