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
const DELETE_NOTIFICATIONS_ENDPOINT =
    import.meta.env.VITE_API_DELETE_NOTIFICATIONS ||
    NOTIFICATIONS_BASE.replace(/notifications-by-user\/?$/, "delete-notifications");
const ADD_EMAIL_ENDPOINT = import.meta.env.VITE_API_ADD_EMAIL;

function unwrapDbValue(value) {
    if (value === null || value === undefined) return value;
    if (typeof value !== "object") return value;

    if ("Int64" in value) return value.Int64;
    if ("Float64" in value) return value.Float64;
    if ("String" in value) return value.String;
    if ("Bool" in value) return value.Bool;

    return value;
}

function extractNotificationId(notification) {
    if (!notification || typeof notification !== "object") return "";

    const directCandidates = [
        notification.N_idNotificacion,
        notification.N_idNotification,
        notification.notificationId,
        notification.IdNotificacion,
        notification.id,
        notification._id,
    ];

    for (const candidate of directCandidates) {
        const unwrapped = unwrapDbValue(candidate);
        if (unwrapped !== null && unwrapped !== undefined && String(unwrapped).trim() !== "") {
            return String(unwrapped).trim();
        }
    }

    for (const [key, value] of Object.entries(notification)) {
        const unwrapped = unwrapDbValue(value);
        if (
            unwrapped !== null &&
            unwrapped !== undefined &&
            /id/i.test(key) &&
            /(noti|notif|notification)/i.test(key) &&
            String(unwrapped).trim() !== ""
        ) {
            return String(unwrapped).trim();
        }
    }

    return "";
}

function toBooleanFlag(value) {
    const unwrapped = unwrapDbValue(value);
    if (typeof unwrapped === "boolean") return unwrapped;
    if (typeof unwrapped === "number") return unwrapped === 1;
    if (typeof unwrapped === "string") {
        const normalized = unwrapped.trim().toLowerCase();
        return normalized === "1" || normalized === "true" || normalized === "t" || normalized === "yes";
    }
    return false;
}

function extractReadFlag(notification) {
    if (!notification || typeof notification !== "object") return false;

    const stateCandidates = [
        notification.B_estado,
        notification.B_leido,
        notification.B_notiLeida,
        notification.notiLeida,
        notification.read,
        notification.isRead,
    ];

    for (const candidate of stateCandidates) {
        if (candidate !== undefined && candidate !== null) {
            return toBooleanFlag(candidate);
        }
    }

    return false;
}

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
            const res = await fetch(url, {
                cache: "no-store",
                headers: {
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                },
            });
            if (!res.ok) {
                console.error("getNotifications failed", res.status);
                return [];
            }
            const data = await res.json();
            console.log("[NotificationService] Response:", data);
            
            let items = [];
            if (Array.isArray(data)) items = data;
            else if (Array.isArray(data?.data)) items = data.data;
            
            // Normalizar estructura de notificación según contrato backend (B_estado y N_idNotificacion)
            const normalizedItems = items.map(n => {
                const normalizedId = extractNotificationId(n);
                return {
                    ...n,
                    id: normalizedId,
                    notificationId: normalizedId,
                    name: n.T_nombre || n.name || n.title || "(sin título)",
                    title: n.T_nombre || n.title || n.name || "(sin título)",
                    description: n.T_descripcion || n.description || n.content || "",
                    dueDate: n.Dt_fechaEmision || n.dueDate || n.date || "",
                    issueDate: n.Dt_fechaEmision || n.issueDate || "",
                    read: extractReadFlag(n),
                };
            });

            return normalizedItems;
        } catch (e) {
            console.error("Error fetching notifications", e);
            return [];
        }
    }

    return [];
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

/**
 * Marca múltiples notificaciones como leídas por ids.
 * @param {Array<string|number>|string} ids
 * @param {string|number} [userId]
 */
export async function acknowledgeNotifications(ids, userId) {
    if (!DELETE_NOTIFICATIONS_ENDPOINT) {
        console.warn("VITE_API_DELETE_NOTIFICATIONS not configured");
        return { ok: false, reason: "missing-endpoint" };
    }

    const normalizedIds = Array.isArray(ids)
        ? ids
            .map((id) => String(id).trim())
            .filter(Boolean)
        : String(ids || "")
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);

    const uniqueIds = [...new Set(normalizedIds)];

    if (uniqueIds.some((id) => !/^\d+$/.test(id))) {
        throw new Error(`acknowledgeNotifications invalid ids: ${JSON.stringify(uniqueIds)}`);
    }

    if (uniqueIds.length === 0) {
        return { ok: true, skipped: true, ids: [] };
    }

    const MAX_IDS_PER_REQUEST = 10;
    const batches = [];
    for (let i = 0; i < uniqueIds.length; i += MAX_IDS_PER_REQUEST) {
        batches.push(uniqueIds.slice(i, i + MAX_IDS_PER_REQUEST));
    }

    const responses = [];

    for (const batch of batches) {
        const idsCsv = batch.join(",");
        // Mantener el payload exactamente igual al caso validado en Postman.
        const payload = { ids: idsCsv };

        const res = await fetch(DELETE_NOTIFICATIONS_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const raw = await res.text();
        let parsed;
        try {
            parsed = raw ? JSON.parse(raw) : null;
        } catch {
            parsed = raw;
        }

        if (!res.ok) {
            throw new Error(`acknowledgeNotifications failed: ${res.status} ${typeof parsed === "string" ? parsed : JSON.stringify(parsed)}`);
        }

        const hasLogicalError =
            parsed &&
            typeof parsed === "object" &&
            (parsed.success === false ||
                String(parsed.status || "").toLowerCase() === "error" ||
                String(parsed.result || "").toLowerCase() === "error" ||
                String(parsed.ok || "").toLowerCase() === "false");

        responses.push({
            ids: batch,
            logicalError: hasLogicalError,
            status: res.status,
            response: parsed,
        });
    }

    const logicalError = responses.some((entry) => entry.logicalError);

    return {
        ok: !logicalError,
        logicalError,
        status: 200,
        response: responses,
        ids: uniqueIds,
    };
}

// Compatibilidad temporal con llamadas existentes.
export const deleteNotifications = acknowledgeNotifications;
