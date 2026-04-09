// ============================================================================
// Servicio de Silenciamiento de Notificaciones
// ============================================================================
// Gestiona el silenciamiento y reactivación de notificaciones del usuario
// Conecta con los endpoints:
// - VITE_API_NOTIFICATIONS_SILENCE: Silencia las notificaciones
// - VITE_API_NOTIFICATIONS_ACTIVATE: Reactiva las notificaciones
// 
// El servicio almacena el estado en localStorage y se comunica con el backend
// ============================================================================

const SILENCE_ENDPOINT = import.meta.env.VITE_API_NOTIFICATIONS_SILENCE;
const ACTIVATE_ENDPOINT = import.meta.env.VITE_API_NOTIFICATIONS_ACTIVATE;
const STORAGE_KEY = "notificationsMute";

async function tryParseJson(response) {
    try {
        const text = await response.text();
        if (!text) {
            return null;
        }
        return JSON.parse(text);
    } catch {
        return null;
    }
}

/**
 * Silencia las notificaciones del usuario
 * 
 * @param {string|number} userId - ID del usuario (codUsuario)
 * @returns {Promise<Object>} Objeto con { success: boolean, data: {...}, error: string }
 */
export async function silenceNotifications(userId) {
    if (!userId) {
        console.warn("[NotificationsSilenceService] userId is required");
        return { success: false, error: "Usuario no disponible" };
    }

    if (!SILENCE_ENDPOINT) {
        console.warn("[NotificationsSilenceService] VITE_API_NOTIFICATIONS_SILENCE not configured");
        return { success: false, error: "Endpoint de silenciamiento no configurado" };
    }

    try {
        console.log("[NotificationsSilenceService] Silencing notifications for user:", userId);
        
        const payload = {
            codUsuario: String(userId)
        };

        const tokenLocalStore = localStorage.getItem("token") || "";
        const token = `Bearer ${tokenLocalStore}`;

        const res = await fetch(SILENCE_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.text();
            console.error("[NotificationsSilenceService] Error response:", res.status, errorData);
            return { 
                success: false, 
                error: `Error del servidor: ${res.status}`
            };
        }

        const data = await tryParseJson(res);
        console.log("[NotificationsSilenceService] Silence response:", data);

        // Guardar estado en localStorage
        const now = Date.now();
        const muteInfo = {
            enabled: true,
            createdAt: now,
            muteUntil: Number.isFinite(data?.muteUntil) ? data.muteUntil : null,
            userId
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(muteInfo));

        return { 
            success: true, 
            data: muteInfo,
            message: "Notificaciones silenciadas correctamente"
        };
    } catch (error) {
        console.error("[NotificationsSilenceService] Error silencing notifications:", error);
        return { 
            success: false, 
            error: error?.message || "Error al silenciar notificaciones"
        };
    }
}

/**
 * Reactiva las notificaciones del usuario
 * 
 * @param {string|number} userId - ID del usuario (codUsuario)
 * @returns {Promise<Object>} Objeto con { success: boolean, error: string }
 */
export async function activateNotifications(userId) {
    if (!userId) {
        console.warn("[NotificationsSilenceService] userId is required");
        return { success: false, error: "Usuario no disponible" };
    }

    if (!ACTIVATE_ENDPOINT) {
        console.warn("[NotificationsSilenceService] VITE_API_NOTIFICATIONS_ACTIVATE not configured");
        return { success: false, error: "Endpoint de activación no configurado" };
    }

    try {
        console.log("[NotificationsSilenceService] Activating notifications for user:", userId);
        
        const payload = {
            codUsuario: String(userId)
        };

        const tokenLocalStore = localStorage.getItem("token") || "";
        const token = `Bearer ${tokenLocalStore}`;

        const res = await fetch(ACTIVATE_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.text();
            console.error("[NotificationsSilenceService] Error response:", res.status, errorData);
            return { 
                success: false, 
                error: `Error del servidor: ${res.status}`
            };
        }

        const data = await tryParseJson(res);
        console.log("[NotificationsSilenceService] Activate response:", data);

        // Limpiar estado del localStorage
        localStorage.removeItem(STORAGE_KEY);

        return { 
            success: true,
            message: "Notificaciones reactivadas correctamente"
        };
    } catch (error) {
        console.error("[NotificationsSilenceService] Error activating notifications:", error);
        return { 
            success: false, 
            error: error?.message || "Error al reactivar notificaciones"
        };
    }
}

/**
 * Obtiene el estado actual del silenciamiento
 * 
 * @returns {Object|null} Objeto con el estado del silenciamiento o null si no está silenciado
 */
export function getMuteStatus() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Si tiene expiración, validar vigencia.
            if (Number.isFinite(parsed.muteUntil)) {
                if (Date.now() < parsed.muteUntil) {
                    return parsed;
                }
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }

            // Compatibilidad: algunos flujos guardan solo `enabled: true`.
            if (parsed.enabled === true) {
                return parsed;
            }

            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return null;
    } catch (err) {
        console.error("[NotificationsSilenceService] Error getting mute status:", err);
        return null;
    }
}

/**
 * Verifica si las notificaciones están silenciadas
 * 
 * @returns {boolean} true si las notificaciones están silenciadas
 */
export function isNotificationsMuted() {
    return getMuteStatus() !== null;
}

/**
 * Limpia el estado de silenciamiento del localStorage
 */
export function clearMuteStatus() {
    localStorage.removeItem(STORAGE_KEY);
}
