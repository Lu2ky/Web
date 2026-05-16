// ============================================================================
// Servicio de Tareas Personales (ToDo List)
// ============================================================================
// Gestiona la persistencia de tareas personales en localStorage.
// Proporciona operaciones CRUD para crear, leer, actualizar y eliminar tareas.
// ============================================================================

const STORAGE_KEY = "personalToDoList";

// Crea una nueva tarea y la persiste en localStorage
// Genera automáticamente un ID único basado en timestamp
export function saveToDo(formData) {
    const todos = getAllToDos();

    const newToDo = {
        id: `todo-${Date.now()}`, // ID único: timestamp
        title: formData.title,
        description: formData.description,
        endDay: formData.endDay, // Fecha de vencimiento
        priority: formData.priority, // alta, media, baja
        tags: Array.isArray(formData.tag) ? formData.tag : [formData.tag],
    };

    todos.push(newToDo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));

    return newToDo;
}

// Recupera todas las tareas almacenadas en localStorage
// Retorna array vacío si hay error al parsear o si no hay datos
export function getAllToDos() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Error parsing todos:", error);
        return [];
    }
}

// Elimina una tarea específica por su ID
export function deleteToDo(id) {
    const todos = getAllToDos();
    const filtered = todos.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearAllToDos() {
    localStorage.removeItem(STORAGE_KEY);
}

