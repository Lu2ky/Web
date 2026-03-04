// Basic helper for fetching notifications.  The actual backend
// endpoint is expected to be configured via environment variable
// VITE_API_URL_NOTIFICATIONS.  If the project already has a more
// sophisticated notification API, this file can be replaced or
// augmented accordingly.

const NOTIFICATIONS_BASE = import.meta.env.VITE_API_URL_NOTIFICATIONS || "";
const ADD_NOTIFICATION_ENDPOINT = import.meta.env.VITE_API_ADD_NOTIFICATION;
const ADD_EMAIL_ENDPOINT = import.meta.env.VITE_API_ADD_EMAIL;

/**
 * Retrieve a list of notifications for the given user.
 *
 * The returned value is typically an array of objects containing at
 * least some of the following properties:
 *   - id or _id
 *   - name/title/text
 *   - dueDate / date
 *   - read / completed flag
 *
 * If the environment variable is not defined the function will simply
 * resolve to an empty array so that the UI can continue to work while
 * the backend is being implemented.
 */
export async function getNotifications(userId) {
    if (!userId) return [];

    // if a real notifications endpoint is configured use it
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
            
            // Normalize notification structure
            return items.map(n => ({
                id: n.id || n._id || n.N_idNotificacion,
                name: n.name || n.title || n.T_nombre || n.asunto || n.T_asunto || "(sin título)",
                title: n.title || n.T_nombre || n.name,
                description: n.description || n.T_descripcion || n.content || n.T_contenido || "",
                dueDate: n.dueDate || n.Dt_fechaVencimiento || n.date || n.Dt_fechaEmision || "",
                issueDate: n.issueDate || n.Dt_fechaEmision || "",
                read: n.read || n.B_leido || false,
                completed: n.completed || n.B_estado || false,
                ...n // spread all other properties
            }));
        } catch (e) {
            console.error("Error fetching notifications", e);
            return [];
        }
    }

    // fallback behaviour: use reminders endpoint as a stand-in
    try {
        const { default: ReminderService } = await import("../Docs/reminderService");
        return ReminderService.getByUser(userId);
    } catch (e) {
        return [];
    }
}

/**
 * Add a notification
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
 * Add an email notification
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
