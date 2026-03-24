// ============================================================================
// Servicio de Notificaciones
// ============================================================================
// Gestiona la obtención, creación y normalización de notificaciones.
// Soporta múltiples formatos de respuesta API.
// Las notificaciones pueden proceder de tareas completadas, recordatorios, etc.
// ============================================================================

// Utilidad para obtener notificaciones. El endpoint debe estar configurado
// en la variable de entorno  VITE_API_URL_NOTIFICATIONS.

const NOTIFICATIONS_BASE = import.meta.env.VITE_API_URL_NOTIFICATIONS || "";
const ADD_NOTIFICATION_ENDPOINT = import.meta.env.VITE_API_ADD_NOTIFICATION;
const ADD_EMAIL_ENDPOINT = import.meta.env.VITE_API_ADD_EMAIL;

/**
 * Obtiene una lista de notificaciones para el usuario indicado.
 *
 * El valor retornado suele ser un arreglo de objetos que contiene al
 * menos algunas de las siguientes propiedades:
 *   - id o _id
 *   - name/title/text
 *   - dueDate / date
 *   - bandera read / completed
 *
 * Si la variable de entorno no está definida, la función simplemente
 * retorna un arreglo vacío para que la UI siga funcionando mientras
 * se implementa el backend.
 */
export async function getNotifications(userId) {
    if (!userId) return [];

    // Si hay un endpoint real de notificaciones configurado, usarlo
    if (NOTIFICATIONS_BASE) {
        try {
            const url = `${NOTIFICATIONS_BASE}${userId}`;
            console.log("[NotificationService] GET", url);
            const res = await fetch(url);
            if (!res.ok) {
                console.error("getNotifications failed", res.status);
                return [];
            }
            const data = await res.json();
            console.log("[NotificationService] Response:", data);
            
            let items = [];
            if (Array.isArray(data)) items = data;
            else if (Array.isArray(data?.data)) items = data.data;
            
            // Normalizar estructura de notificación
            return items.map(n => ({
                id: n.id || n._id || n.N_idNotificacion,
                name: n.name || n.title || n.T_nombre || n.asunto || n.T_asunto || "(sin título)",
                title: n.title || n.T_nombre || n.name,
                description: n.description || n.T_descripcion || n.content || n.T_contenido || "",
                dueDate: n.dueDate || n.Dt_fechaVencimiento || n.date || n.Dt_fechaEmision || "",
                issueDate: n.issueDate || n.Dt_fechaEmision || "",
                read: n.read || n.B_leido || false,
                completed: n.completed || n.B_estado || false,
                ...n // conservar el resto de propiedades
            }));
        } catch (e) {
            console.error("Error fetching notifications", e);
            return [];
        }
    }

    // Comportamiento de respaldo: usar endpoint de recordatorios como sustituto
    try {
        const { default: ReminderService } = await import("./reminderService");
        return ReminderService.getByUser(userId);
    } catch (e) {
        return [];
    }
}

/**
 * Agrega una notificación
 * @param {object} params
 * @param {number|string} params.todoId - N_idToDoList
 * @param {string} params.name - T_nombre
 * @param {string} params.description - T_descripcion
 * @param {string} params.issueDate - Dt_fechaEmision
 */
export async function addNotification({ todoId, name, description, issueDate }) {
    if (!ADD_NOTIFICATION_ENDPOINT) {
        console.warn("VITE_API_ADD_NOTIFICATION not configured");
        return;
    }

    const payload = {
        N_idToDoList: todoId,
        T_nombre: name,
        T_descripcion: description,
        Dt_fechaEmision: issueDate
    };

    const res = await fetch(ADD_NOTIFICATION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`addNotification failed: ${res.status} ${text}`);
    }

    return res.json();
}

/**
 * Agrega una notificación por correo
 * @param {object} params
 * @param {number|string} params.todoId - N_idToDoList
 * @param {string} params.issue - T_asunto
 * @param {string} params.content - T_contenido
 * @param {string} params.issueDate - Dt_fechaEmision
 */
export async function addEmail({ todoId, issue, content, issueDate }) {
    if (!ADD_EMAIL_ENDPOINT) {
        console.warn("VITE_API_ADD_EMAIL not configured");
        return;
    }

    const payload = {
        N_idToDoList: todoId,
        T_asunto: issue,
        T_contenido: content,
        Dt_fechaEmision: issueDate
    };

    const res = await fetch(ADD_EMAIL_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`addEmail failed: ${res.status} ${text}`);
    }

    return res.json();
}
