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
import { getSessionCodUsuario } from "./authSession";
import LDAPservice from "./LDAPservice";

const GET_USER_DATA_ENDPOINT = import.meta.env.VITE_API_GET_USER_DATA;
const UPDATE_USER_EMAIL_ENDPOINT = import.meta.env.VITE_API_UPDATE_USER_EMAIL || import.meta.env.VITE_API_UPDATE_REMINDER_ANTICIPATION;
const UPDATE_REMINDER_ANTICIPATION_ENDPOINT = import.meta.env.VITE_API_UPDATE_REMINDER_ANTICIPATION || import.meta.env.VITE_API_UPDATE_USER_EMAIL;
const CHANGE_PASSWORD_ENDPOINT = import.meta.env.VITE_API_CHANGE_PASSWORD || import.meta.env.VITE_API_PASSWORD_CHANGE;

function toTimeMuteValue(value) {
    if (typeof value === "string" && value.includes(":")) {
        const parts = value.split(":");
        const hours = Math.max(0, parseInt(parts[0], 10) || 0);
        const minutes = Math.max(0, parseInt(parts[1], 10) || 0);
        const seconds = Math.max(0, parseInt(parts[2], 10) || 0);
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        const normalizedMinutes = Math.max(0, Math.floor(value));
        const hours = Math.floor(normalizedMinutes / 60);
        const minutes = normalizedMinutes % 60;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
    }

    if (value && typeof value === "object") {
        const hours = Math.max(0, parseInt(value.hours ?? value.horas ?? 0, 10) || 0);
        const minutes = Math.max(0, parseInt(value.minutes ?? value.minutos ?? 0, 10) || 0);
        const seconds = Math.max(0, parseInt(value.seconds ?? value.segundos ?? 0, 10) || 0);
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    return "00:00:00";
}

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

function isAuthResponseSuccessful(response) {
    if (!response || typeof response !== "object") {
        return false;
    }

    return Boolean(
        response.success
        || response.status === "success"
        || response.valid === true
        || response.authenticated === true
        || response.isAuthenticated === true
        || response.data
    );
}

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
        // Cabecera Authorization.
        const tokenLocalStore = localStorage.getItem("token") || "";
        const token = `Bearer ${tokenLocalStore}`;

        const res = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": token,
            },
        });

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

    if (!UPDATE_USER_EMAIL_ENDPOINT) {
        const message = "Falta configurar VITE_API_UPDATE_USER_EMAIL para guardar el correo del perfil";
        console.error(message);
        return { success: false, message };
    }

    // Obtener datos actuales para recuperar antelacionNotis e idUsuario real desde BD
    const currentData = await getUserData(userId);

    const currentUser = Array.isArray(currentData) ? currentData[0] : currentData;

    if (!currentUser) {
        console.error("No user data found for userId:", userId);
        return { success: false, message: "No se encontraron datos del usuario" };
    }

    // Usar el idUsuario real de la base de datos, no el pasado por parámetro
    const actualUserId = currentUser.idUsuario || currentUser.id || Number(userId);

    // Obtener antelacionNotis intentando multiples nombres de campo heredados
    let currentAnticipation = currentUser?.antelacionNotis ||
        currentUser?.tiempoMute ||
        currentUser?.anticipationTime ||
        "00:00:00";

    // Normaliza formato de tiempoMute (HH:MM:SS) incluso si llega como minutos u objeto.
    currentAnticipation = toTimeMuteValue(currentAnticipation);
    const codUsuario = getSessionCodUsuario() || String(userId || "").trim();

    const payload = {
        idUsuario: actualUserId,
        correo: newEmail.trim(),
        antelacionNotis: currentAnticipation,
        codUsuario
    };

    try {
        // Cabecera Authorization.
        const tokenLocalStore = localStorage.getItem("token") || "";
        const token = `Bearer ${tokenLocalStore}`;

        const res = await fetch(UPDATE_USER_EMAIL_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
            body: JSON.stringify(payload),
        });

        const contentType = res.headers.get("content-type") || "";
        const body = contentType.includes("application/json") ? await res.json() : await res.text();

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
        const authUserId = getSessionCodUsuario() || String(userId || "").trim();
        const authResult = await LDAPservice(authUserId, currentPassword);

        if (!authResult) {
            return {
                success: false,
                message: "No se pudo validar la contraseña actual. Intenta nuevamente."
            };
        }

        if (!isAuthResponseSuccessful(authResult)) {
            return {
                success: false,
                message: "La contraseña actual es incorrecta"
            };
        }

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

                if (typeof body === "string") {
                    return { success: false, message: `HTTP ${res.status} - ${body}` };
                }

                return {
                    success: false,
                    message: body?.message || body?.error || `HTTP ${res.status}`
                };
            }
        }

        console.error("changePassword failed: endpoint not found");
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

    if (!UPDATE_REMINDER_ANTICIPATION_ENDPOINT) {
        const message = "Falta configurar VITE_API_UPDATE_REMINDER_ANTICIPATION para guardar el tiempo de anticipación";
        console.error(message);
        return { success: false, message };
    }

    // Convertir minutos a formato TIME (HH:MM:SS) como espera el servidor
    const hours = Math.floor(validatedMinutes / 60);
    const mins = validatedMinutes % 60;
    const antelacionNotis = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;

    // Obtener datos actuales para recuperar correo e idUsuario real desde BD
    const currentData = await getUserData(userId);

    const currentUser = Array.isArray(currentData) ? currentData[0] : currentData;

    if (!currentUser) {
        console.error("No user data found for userId:", userId);
        return { success: false, message: "No se encontraron datos del usuario" };
    }

    // Usar el idUsuario real de la base de datos, no el pasado por parámetro
    const actualUserId = currentUser.idUsuario || currentUser.id || Number(userId);

    const currentEmail = (currentUser?.correo || currentUser?.email || "").trim();
    const codUsuario = getSessionCodUsuario() || String(userId || "").trim();

    const payload = {
        idUsuario: actualUserId,
        correo: currentEmail,
        antelacionNotis: antelacionNotis,
        codUsuario
    };

    try {
        // Cabecera Authorization.
        const tokenLocalStore = localStorage.getItem("token") || "";
        const token = `Bearer ${tokenLocalStore}`;

        const res = await fetch(UPDATE_REMINDER_ANTICIPATION_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
            body: JSON.stringify(payload),
        });

        const contentType = res.headers.get("content-type") || "";
        const body = contentType.includes("application/json") ? await res.json() : await res.text();

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

export default { getUserData, updateUserEmail, changePassword, updateReminderAnticipation };
