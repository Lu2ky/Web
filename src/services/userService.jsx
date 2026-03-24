// ============================================================================
// Servicio de Usuario
// ============================================================================
// Gestiona operaciones relacionadas con datos y configuración de usuario.
// Proporciona funciones para:
// - Obtener datos de perfil del usuario (email, información personal)
// - Actualizar email
// - Cambiar contraseña
// - Configurar notificaciones (anticipación)
// ============================================================================

const GET_USER_DATA_ENDPOINT = import.meta.env.VITE_API_GET_USER_DATA;
const CONFIG_NOTIFICATION_ENDPOINT = import.meta.env.VITE_API_UPDATE_USER_EMAIL || import.meta.env.VITE_API_UPDATE_REMINDER_ANTICIPATION;
const CHANGE_PASSWORD_ENDPOINT = import.meta.env.VITE_API_CHANGE_PASSWORD || import.meta.env.VITE_API_PASSWORD_CHANGE;

function buildPasswordEndpointCandidates(rawEndpoint) {
    const normalized = String(rawEndpoint || "").trim();
    if (!normalized) return [];

    const variants = new Set();
    variants.add(normalized);
    variants.add(normalized.endsWith("/") ? normalized.slice(0, -1) : `${normalized}/`);

    // Compatibilidad con ruta legacy usada en pruebas y entornos antiguos.
    if (/\/api\/change-password\/?$/i.test(normalized)) {
        const modern = normalized.replace(/\/api\/change-password\/?$/i, "/api/auth/changepassword");
        variants.add(modern);
        variants.add(modern.endsWith("/") ? modern.slice(0, -1) : `${modern}/`);
    }

    return Array.from(variants);
}

function validatePasswordComplexity(password) {
    const value = String(password || "");

    if (value.length < 8) {
        return "La contraseña debe tener al menos 8 caracteres";
    }

    if (!/[a-z]/.test(value)) {
        return "La contraseña debe incluir al menos una letra minúscula";
    }

    if (!/[A-Z]/.test(value)) {
        return "La contraseña debe incluir al menos una letra mayúscula";
    }

    if (!/\d/.test(value)) {
        return "La contraseña debe incluir al menos un número";
    }

    if (!/[^A-Za-z0-9\s]/.test(value)) {
        return "La contraseña debe incluir al menos un símbolo";
    }

    return null;
}

// Registrar endpoints para depuración
console.log("Config Notification Endpoint:", CONFIG_NOTIFICATION_ENDPOINT);

/**
 * Obtiene datos del usuario por su ID
 * @param {number|string} userId - ID del usuario
 * @returns {Promise<object|null>} Datos del usuario o null si no se encuentra
 */
export async function getUserData(userId) {
    if (!userId) {
        console.warn("getUserData: userId is required");
        return null;
    }

    if (!GET_USER_DATA_ENDPOINT) {
        console.warn("VITE_API_GET_USER_DATA not configured");
        return null;
    }

    try {
        const url = `${GET_USER_DATA_ENDPOINT}${userId}`;
        const res = await fetch(url);

        if (!res.ok) {
            console.error(`getUserData failed: ${res.status}`);
            return null;
        }

        const json = await res.json();
        
        // El servidor retorna { success: boolean, data: {...} }
        if (json.success && json.data) {
            return json.data;
        }

        return json.data || null;
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
}

/**
 * Actualiza el correo del usuario
 * @param {number|string} userId - ID del usuario
 * @param {string} newEmail - Nuevo correo electrónico
 * @returns {Promise<object|null>} Resultado de la actualización o null
 */
export async function updateUserEmail(userId, newEmail) {
    if (!userId || !newEmail) {
        console.warn("updateUserEmail: userId and newEmail are required");
        return null;
    }

    if (!CONFIG_NOTIFICATION_ENDPOINT) {
        const message = "Falta configurar VITE_API_UPDATE_USER_EMAIL para guardar el correo del perfil";
        console.error(message);
        return { success: false, message };
    }

    // Obtener datos actuales para recuperar tiempoMute e idUsuario real desde BD
    const currentData = await getUserData(userId);
    console.log("Current user data received:", currentData);
    
    const currentUser = Array.isArray(currentData) ? currentData[0] : currentData;
    console.log("Current user object:", currentUser);
    
    if (!currentUser) {
        console.error("No user data found for userId:", userId);
        return { success: false, message: "No se encontraron datos del usuario" };
    }
    
    // Usar el idUsuario real de la base de datos, no el pasado por parámetro
    const actualUserId = currentUser.idUsuario || currentUser.id || Number(userId);
    console.log("Using actualUserId from DB:", actualUserId);
    
    // Obtener tiempoMute intentando múltiples nombres de campo
    let currentTimeMute = currentUser?.antelacionNotis || 
                         currentUser?.tiempoMute || 
                         currentUser?.anticipationTime ||
                         "00:00:00";
    
    console.log("Current tiempoMute:", currentTimeMute);
    
    // Validar formato de tiempoMute (debe ser HH:MM:SS)
    if (typeof currentTimeMute !== 'string' || !currentTimeMute.includes(':')) {
        console.warn("tiempoMute format invalid, using default");
        currentTimeMute = "00:00:00";
    }

    const currentPhone = currentUser?.cellphoneDisplay ? currentUser.cellphoneDisplay.trim() : null;
    console.log("Current telefono:", currentPhone);

    const payload = {
        idUsuario: actualUserId,
        correo: newEmail.trim(),
        tiempoMute: currentTimeMute,
        telefono: currentPhone
    };

    try {
        console.log("Updating email with payload:", payload);
        console.log("Endpoint:", CONFIG_NOTIFICATION_ENDPOINT);
        
        const res = await fetch(CONFIG_NOTIFICATION_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        console.log("Response status:", res.status);
        const contentType = res.headers.get("content-type") || "";
        const body = contentType.includes("application/json") ? await res.json() : await res.text();
        console.log("Response body:", body);

        // Verificar si el servidor retornó success: false en el cuerpo (incluso con status 200)
        if (typeof body === 'object' && body.success === false) {
            console.error("Backend returned success: false -", body.message);
            return { success: false, message: body.message || "El servidor rechazó la actualización" };
        }

        if (!res.ok) {
            const message = typeof body === "string" ? body : body?.message;
            console.error(`updateUserEmail HTTP ${res.status}:`, message);
            return { success: false, message: `HTTP ${res.status} - ${message}` };
        }

        return typeof body === "string" ? { success: true, message: body } : body;
    } catch (error) {
        console.error("Error updating user email:", error);
        return { success: false, message: error?.message || "No se pudo actualizar el correo" };
    }
}

/**
 * Cambia la contraseña del usuario
 * @param {number|string} userId - ID del usuario
 * @param {string} currentPassword - Contraseña actual para verificación
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<object|null>} Resultado del cambio o null
 */
export async function changePassword(userId, currentPassword, newPassword) {
    if (!userId || !currentPassword || !newPassword) {
        console.warn("changePassword: userId, currentPassword and newPassword are required");
        return null;
    }

    if (!CHANGE_PASSWORD_ENDPOINT) {
        console.warn("VITE_API_CHANGE_PASSWORD / VITE_API_PASSWORD_CHANGE not configured");
        return null;
    }

    const policyError = validatePasswordComplexity(newPassword);
    if (policyError) {
        return {
            success: false,
            message: policyError
        };
    }

    const payload = {
        user: String(userId),
        pass: String(newPassword)
    };

    const endpointCandidates = buildPasswordEndpointCandidates(CHANGE_PASSWORD_ENDPOINT);
    const methodCandidates = ["POST", "PUT"];

    try {
        for (const endpoint of endpointCandidates) {
            for (const method of methodCandidates) {
                const res = await fetch(endpoint, {
                    method,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });

                const contentType = res.headers.get("content-type") || "";
                const body = contentType.includes("application/json") ? await res.json() : await res.text();

                if (res.ok) {
                    return typeof body === "string" ? { success: true, message: body } : body;
                }

                if (res.status === 404 || res.status === 405) {
                    continue;
                }

                console.error(`changePassword failed: ${res.status} (${method} ${endpoint})`, body);
                if (typeof body === "string") {
                    return { success: false, message: `HTTP ${res.status} - ${body}` };
                }

                return {
                    success: false,
                    message: body?.message || body?.error || `HTTP ${res.status}`
                };
            }
        }

        console.error("changePassword failed: endpoint not found", endpointCandidates);
        return {
            success: false,
            message: "No se encontro endpoint de cambio de contrasena (404/405 en variantes conocidas)."
        };
    } catch (error) {
        console.error("Error changing password:", error);
        return { success: false, message: error?.message || "No se pudo cambiar la contrasena" };
    }
}

/**
 * Actualiza el tiempo de anticipación de recordatorios en preferencias de usuario
 * @param {number|string} userId - ID del usuario
 * @param {number} minutes - Minutos de anticipación (máximo 1440 = 24 horas)
 * @returns {Promise<object|null>} Resultado de la actualización o null
 */
export async function updateReminderAnticipation(userId, minutes) {
    if (!userId || minutes === undefined) {
        console.warn("updateReminderAnticipation: userId and minutes are required");
        return null;
    }

    // Validar máximo 24 horas (1440 minutos)
    const validatedMinutes = Math.min(Math.max(0, parseInt(minutes)), 1440);

    if (!CONFIG_NOTIFICATION_ENDPOINT) {
        const message = "Falta configurar VITE_API_UPDATE_REMINDER_ANTICIPATION para guardar el tiempo de anticipación";
        console.error(message);
        return { success: false, message };
    }

    // Convertir minutos a formato TIME (HH:MM:SS) como espera el servidor
    const hours = Math.floor(validatedMinutes / 60);
    const mins = validatedMinutes % 60;
    const tiempoMute = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;

    // Obtener datos actuales para recuperar correo e idUsuario real desde BD
    const currentData = await getUserData(userId);
    console.log("Current user data received:", currentData);
    
    const currentUser = Array.isArray(currentData) ? currentData[0] : currentData;
    console.log("Current user object:", currentUser);
    
    if (!currentUser) {
        console.error("No user data found for userId:", userId);
        return { success: false, message: "No se encontraron datos del usuario" };
    }
    
    // Usar el idUsuario real de la base de datos, no el pasado por parámetro
    const actualUserId = currentUser.idUsuario || currentUser.id || Number(userId);
    console.log("Using actualUserId from DB:", actualUserId);
    
    const currentEmail = (currentUser?.correo || currentUser?.email || "").trim();
    console.log("Current email:", currentEmail);

    const currentPhone = currentUser?.cellphoneDisplay ? currentUser.cellphoneDisplay.trim() : null;
    console.log("Current telefono:", currentPhone);

    const payload = {
        idUsuario: actualUserId,
        correo: currentEmail,
        tiempoMute: tiempoMute,
        telefono: currentPhone
    };

    try {
        console.log("Updating reminder anticipation with payload:", payload);
        console.log("Endpoint:", CONFIG_NOTIFICATION_ENDPOINT);
        
        const res = await fetch(CONFIG_NOTIFICATION_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        console.log("Response status:", res.status);
        const contentType = res.headers.get("content-type") || "";
        const body = contentType.includes("application/json") ? await res.json() : await res.text();
        console.log("Response body:", body);

        // Verificar si el servidor retornó success: false en el cuerpo (incluso con status 200)
        if (typeof body === 'object' && body.success === false) {
            console.error("Backend returned success: false -", body.message);
            return { success: false, message: body.message || "El servidor rechazó la actualización" };
        }

        if (!res.ok) {
            const message = typeof body === "string" ? body : body?.message;
            console.error(`updateReminderAnticipation HTTP ${res.status}:`, message);
            return { success: false, message: `HTTP ${res.status} - ${message}` };
        }

        return typeof body === "string" ? { success: true, message: body } : body;
    } catch (error) {
        console.error("Error updating reminder anticipation:", error);
        return { success: false, message: error?.message || "No se pudo actualizar el tiempo de anticipación" };
    }
}

/**
 * Actualiza el número de celular del usuario
 * @param {number|string} userId - ID del usuario
 * @param {string} cellphone - Número de celular
 * @returns {Promise<object|null>} Resultado de la actualización o null
 */
export async function updateUserCellphone(userId, cellphone) {
    if (!userId || !cellphone) {
        console.warn("updateUserCellphone: userId and cellphone are required");
        return null;
    }

    if (!CONFIG_NOTIFICATION_ENDPOINT) {
        const message = "Falta configurar VITE_API_UPDATE_USER_CELLPHONE para guardar el celular";
        console.error(message);
        return { success: false, message };
    }

    // Obtener datos actuales para recuperar correo, tiempoMute e idUsuario real desde BD
    const currentData = await getUserData(userId);
    console.log("Current user data received:", currentData);
    
    const currentUser = Array.isArray(currentData) ? currentData[0] : currentData;
    console.log("Current user object:", currentUser);
    
    if (!currentUser) {
        console.error("No user data found for userId:", userId);
        return { success: false, message: "No se encontraron datos del usuario" };
    }
    
    // Usar el idUsuario real de la base de datos, no el pasado por parámetro
    const actualUserId = currentUser.idUsuario || currentUser.id || Number(userId);
    console.log("Using actualUserId from DB:", actualUserId);
    
    const currentEmail = (currentUser?.correo || currentUser?.email || "").trim();
    console.log("Current email:", currentEmail);
    
    // Obtener tiempoMute intentando múltiples nombres de campo
    let currentTimeMute = currentUser?.antelacionNotis || 
                         currentUser?.tiempoMute || 
                         currentUser?.anticipationTime ||
                         "00:00:00";
    
    console.log("Current tiempoMute:", currentTimeMute);
    
    // Validar formato de tiempoMute (debe ser HH:MM:SS)
    if (typeof currentTimeMute !== 'string' || !currentTimeMute.includes(':')) {
        console.warn("tiempoMute format invalid, using default");
        currentTimeMute = "00:00:00";
    }

    const payload = {
        idUsuario: actualUserId,
        correo: currentEmail,
        tiempoMute: currentTimeMute,
        telefono: cellphone.trim()
    };

    try {
        console.log("Updating cellphone with payload:", payload);
        console.log("Endpoint:", CONFIG_NOTIFICATION_ENDPOINT);
        
        const res = await fetch(CONFIG_NOTIFICATION_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        console.log("Response status:", res.status);
        const contentType = res.headers.get("content-type") || "";
        const body = contentType.includes("application/json") ? await res.json() : await res.text();
        console.log("Response body:", body);

        // Verificar si el servidor retornó success: false en el cuerpo (incluso con status 200)
        if (typeof body === 'object' && body.success === false) {
            console.error("Backend returned success: false -", body.message);
            return { success: false, message: body.message || "El servidor rechazó la actualización" };
        }

        if (!res.ok) {
            const message = typeof body === "string" ? body : body?.message;
            console.error(`updateUserCellphone HTTP ${res.status}:`, message);
            return { success: false, message: `HTTP ${res.status} - ${message}` };
        }

        return typeof body === "string" ? { success: true, message: body } : body;
    } catch (error) {
        console.error("Error updating user cellphone:", error);
        return { success: false, message: error?.message || "No se pudo actualizar el celular" };
    }
}

export default { getUserData, updateUserEmail, changePassword, updateReminderAnticipation, updateUserCellphone };
