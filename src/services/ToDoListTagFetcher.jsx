import { useEffect, useState } from "react";
import LoadingModal from "./loadingModal";


// 0peraciones CRUD de To-Do List

// Crear un nuevo recordatorio (POST) 

export const createReminder = async (userId, taskData) => {
    // Construir fecha completa: "2026-03-03 14:00:00"
    const fullDate = taskData.dueDate && taskData.dueTime
        ? `${taskData.dueDate} ${taskData.dueTime}:00`
        : null;

    // Mapear tags a P_tag1...P_tag5 (máximo 5 tags)
    const tags = taskData.tags || [];

    const body = {
        P_usuario: userId,
        P_nombre: taskData.title,
        P_descripcion: taskData.description || "",
        P_fecha: fullDate,
        P_prioridad: taskData.priority || "media",
        P_tag1: tags[0] || "",
        P_tag2: tags[1] || "",
        P_tag3: tags[2] || "",
        P_tag4: tags[3] || "",
        P_tag5: tags[4] || "",
    };
    
    // Realizar la solicitud POST a la API para crear el recordatorio
    const response = await fetch(import.meta.env.VITE_API_ADD_REMINDER, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    // Manejar la respuesta de la API, verificando si la solicitud fue exitosa o si ocurrió un error
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
            errorData?.error || `Error al crear recordatorio (${response.status})`
        );
    }
    // Convertir la respuesta en formato JSON y verificar si la creación del recordatorio fue exitosa según la respuesta de la API
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || "Error desconocido al crear recordatorio");
    }
    return result;
};

// Eliminar un recordatorio 
export const deleteReminder = async (reminderId) => {
    const response = await fetch(import.meta.env.VITE_API_DELETE_REMINDER, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ P_idRecordatorio: reminderId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
            errorData?.error || `Error al eliminar recordatorio (${response.status})`
        );
    }

    return await response.json();
};

// Actualizar estado de un recordatorio (completado o no completado)

export const toggleReminderComplete = async (reminderId, completed) => {
    const response = await fetch(import.meta.env.VITE_API_UPDATE_STATE_REMINDER, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            ID: reminderId,
            NEW_STATE: completed,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
            errorData?.error || `Error al actualizar recordatorio (${response.status})`
        );
    }

    return await response.json();
};

// Actualizar nombre de un recordatorio
export const updateReminderName = async (todoId, newName) => {
    const response = await fetch(import.meta.env.VITE_API_UPDATE_REMINDER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ P_idToDo: todoId, P_nombre: newName }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Error al actualizar nombre (${response.status})`);
    }
    return await response.json();
};

// Actualizar descripción de un recordatorio
export const updateReminderDescription = async (todoId, newDesc) => {
    const response = await fetch(import.meta.env.VITE_API_UPDATE_DESCRIPTION_REMINDER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ P_idToDo: todoId, P_descripcion: newDesc }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Error al actualizar descripción (${response.status})`);
    }
    return await response.json();
};

// Actualizar fecha de un recordatorio
export const updateReminderDate = async (todoId, newDate) => {
    const response = await fetch(import.meta.env.VITE_API_UPDATE_DATE_REMINDER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ P_idToDo: todoId, P_fecha: newDate }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Error al actualizar fecha (${response.status})`);
    }
    return await response.json();
};

// Actualizar prioridad de un recordatorio
export const updateReminderPriority = async (todoId, newPriority) => {
    const response = await fetch(import.meta.env.VITE_API_UPDATE_PRIORITY_REMINDER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ P_idToDo: todoId, P_prioridad: newPriority }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Error al actualizar prioridad (${response.status})`);
    }
    return await response.json();
};

// Actualizar etiquetas de un recordatorio (envía un array de etiquetas, la API se encarga de actualizar los campos P_tag1...P_tag5)
export const updateReminderTags = async (todoId, tagsArray) => {
    const response = await fetch(import.meta.env.VITE_API_UPDATE_TAGS_REMINDER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            P_idToDo: todoId,
            P_tag1: tagsArray[0] || null,
            P_tag2: tagsArray[1] || null,
            P_tag3: tagsArray[2] || null,
            P_tag4: tagsArray[3] || null,
            P_tag5: tagsArray[4] || null,
        }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Error al actualizar etiquetas (${response.status})`);
    }
    return await response.json();
};

// Eliminar una etiqueta (solo la etiqueta, no el recordatorio) y desvincularla de los recordatorios que la tengan asignada
export const deleteTag = async (tagId) => {
    const response = await fetch(import.meta.env.VITE_API_DELETE_TAGS_REMINDER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idTag: tagId }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Error al eliminar etiqueta (${response.status})`);
    }
    return await response.json();
};

// Obtener etiquetas del usuario para mostrar en el filtro y en el formulario de edición (GET)
export const fetchUserTags = async (userId) => {
    const baseUrl = import.meta.env.VITE_API_URL_TAGS_USER;
    const response = await fetch(`${baseUrl}${userId}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Error al obtener etiquetas (${response.status})`);
    }
    const json = await response.json();
    const data = json?.data || json;
    return Array.isArray(data)
        ? data
            .map((eachData) => {
                if (eachData.B_isDeleted?.Bool) return null;
                return { id: eachData.N_idEtiqueta, nombre: eachData.T_nombre };
            })
            .filter((tag) => tag !== null)
        : [];
};


// Compara datos originales vs nuevos y solo actualiza lo que cambió

export const updateReminderFields = async (todoId, originalTask, newData) => {
    const promises = [];

    // Cambiar el nombre?
    if (newData.title !== originalTask.title) {
        promises.push(updateReminderName(todoId, newData.title));
    }

    // Cambiar la descripción?
    if (newData.description !== originalTask.description) {
        promises.push(updateReminderDescription(todoId, newData.description));
    }

    // Cambiar la fecha u hora?
    const originalFullDate = originalTask.dueDate && originalTask.dueTime
        ? `${originalTask.dueDate} ${originalTask.dueTime}:00`
        : null;
    const newFullDate = newData.dueDate && newData.dueTime
        ? `${newData.dueDate} ${newData.dueTime}:00`
        : null;
    if (newFullDate !== originalFullDate) {
        promises.push(updateReminderDate(todoId, newFullDate));
    }

    // Cambiar la prioridad?
    if (newData.priority !== originalTask.priority) {
        promises.push(updateReminderPriority(todoId, newData.priority));
    }

    // Cambiaron los tags?
    const originalTagLabels = (originalTask.tags || []).map((t) => t.label).sort().join(",");
    const newTagLabels = (newData.tags || []).sort().join(",");
    if (newTagLabels !== originalTagLabels) {
        promises.push(updateReminderTags(todoId, newData.tags || []));
    }

    // Ejecutar en paralelo solo los que cambiaron
    if (promises.length > 0) {
        await Promise.all(promises);
    }

    return { updated: promises.length };
};

// Actualizar completado o no completado (toggle) de un recordatorio
export const updateReminderState = async (todoId, newState) => {
    const response = await fetch(import.meta.env.VITE_API_UPDATE_STATE_REMINDER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            P_idToDo: todoId,
            P_estado: newState,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Error al actualizar estado (${response.status})`);
    }

    return await response.json();
};


// Normalizar el formato de etiquetas
function normalizeReminder(item, index) {

    // Normalización de la fecha de vencimiento
    // Cadena completa
    const completeDate = item.Dt_fechaVencimiento?.Valid ?
        item.Dt_fechaVencimiento.String :
        null;

    // Definir variables para fecha y hora
    let dueDate = null;
    let dueTime = null;

    // Si completeDate es válido, intentar dividirlo en fecha y hora
    if (completeDate) {
        const [datePart, timePart] = completeDate.split(" ");
        dueDate = datePart || null; // Asignar la parte de fecha o null si no existe "2026-03-02"
        dueTime = timePart ? timePart.slice(0, 5) : null; // Asignar la parte de hora o null si no existe "14:00:00" -> "14:00"
    }

    return {
        id: item.N_idToDoList || `${index}`, //Id recordatorio y si no existe se genera uno
        userId: item.N_idUsuario, // id del usuario 
        reminderId: item.N_idRecordatorio, // id del recordatorio
        title: item.T_nombre, // titulo del recordatorio
        description: item.T_descripcion?.Valid ? item.T_descripcion.String : "", // Descripción del recordatorio, si no existe se asigna una cadena vacía
        dueDate, // Fecha de vencimiento del recordatorio, si no existe se asigna null
        dueTime, // Hora de vencimiento del recordatorio, si no existe se asigna null
        isDeleted: item.B_isDeleted, // Indica si el recordatorio ha sido eliminado
        priority: item.T_Prioridad, // Prioridad del recordatorio
        completed: item.B_estado, // Estado del recordatorio, se asigna true si B_estado es verdadero, de lo contrario se asigna false
        tags: Array.isArray(item.tags) // Verifica si item.tags es un array antes de mapearlo
            ? item.tags.map((t, i) => ({ // Mapea cada etiqueta a un nuevo formato
                id: t.tag_id || `tag-${i}`, // Id de la etiqueta, si no existe se genera uno basado en el índice
                label: t.tag_nombre, // Nombre de la etiqueta
            }))
            : []
    };
}

// Carga de datos desde la API 
function ToDoListTagFetcher({ onDataLoaded, userId }) {
    const [loading, setLoading] = useState(true);
    const [apiData, setApiData] = useState([]);

    useEffect(() => {
        if (!userId) { // Si no hay userId, se detiene la carga y notifica al padre con un arreglo vacio 
            setLoading(false);
            setApiData([]);
            if (onDataLoaded) onDataLoaded([]); // Notificar al componente padre que no se cargaron datos debido a la falta de userId
            return;
        }
        // URL base para la API de recordatorios y etiquetas del usuario
        const baseUrl = import.meta.env.VITE_API_URL_REMINDERS_TAGS_USER;
        // Concatena la URL base con el userId para obtener los datos específicos del usuario
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${baseUrl}${userId}`);
                const json = await response.json(); // Convierte respuesta en Json

                const rawData = Array.isArray(json?.data) // Verifica si json.data es un array antes de asignarlo a rawData, si no es un array se asigna un arreglo vacío
                    ? json.data
                    : Array.isArray(json) ? json
                        : [];

                // Normalización de la información y filtro de valores nulos
                const normalized = rawData.map(normalizeReminder).filter(Boolean);
                // Guarda datos en estado interno y se notifica al componente padre que los datos han sido cargados y normalizados
                setApiData(normalized);
                if (onDataLoaded) onDataLoaded(normalized);
            } catch (error) {
                console.error("Error al cargar To-Do-list:", error);
                setApiData([]); // En caso de error, se asigna un arreglo vacío a apiData
                if (onDataLoaded) onDataLoaded([]);
            } finally {
                setLoading(false); // Se finaliza la carga, independientemente de si fue exitosa o no
            }
        };

        fetchData();
    }, [onDataLoaded, userId]); // El efecto se ejecuta cada vez que cambia onDataLoaded o userId

    if (loading) {
        return ( // Modal de carga que se muestra mientras se están cargando los datos
            <LoadingModal
                isOpen={loading}
                title="Cargando recordatorios"
            />
        );
    }

    return null; // No renderiza nada, solo envia datos al padre a través de onDataLoaded
}

export default ToDoListTagFetcher;

