// ============================================================================
// Servicio de Silenciamiento de Notificaciones
// ============================================================================
// El backend no expone endpoints de silencio: el estado vive en localStorage y
// la campana lo consulta con `getMuteStatus`. Las preferencias reales de correo
// y antelación se guardan con `POST /notifications/mute`.
// ============================================================================

const STORAGE_KEY = "notificationsMute";

/**
 * Silencia las notificaciones para el usuario actual (solo estado local).
 * @param {string|number} userId
 * @returns {Promise<{success: boolean, data?: object, message?: string, error?: string}>}
 */
export async function silenceNotifications(userId) {
    if (!userId) {
        return { success: false, error: "Usuario no disponible" };
    }

    try {
        const muteInfo = {
            enabled: true,
            createdAt: Date.now(),
            userId: String(userId),
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(muteInfo));

        return {
            success: true,
            data: muteInfo,
            message: "Notificaciones silenciadas correctamente",
        };
    } catch (error) {
        console.error("[NotificationsSilenceService] Error silencing notifications:", error);
        return {
            success: false,
            error: error?.message || "Error al silenciar notificaciones",
        };
    }
}

/**
 * Reactiva las notificaciones (limpia el estado local).
 * @param {string|number} userId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function activateNotifications(userId) {
    if (!userId) {
        return { success: false, error: "Usuario no disponible" };
    }

    try {
        localStorage.removeItem(STORAGE_KEY);
        return { success: true, message: "Notificaciones reactivadas correctamente" };
    } catch (error) {
        console.error("[NotificationsSilenceService] Error activating notifications:", error);
        return {
            success: false,
            error: error?.message || "Error al reactivar notificaciones",
        };
    }
}

/**
 * Estado actual del silenciamiento.
 * @returns {object|null}
 */
export function getMuteStatus() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const parsed = JSON.parse(stored);
        if (parsed?.enabled === true) return parsed;

        localStorage.removeItem(STORAGE_KEY);
        return null;
    } catch (error) {
        console.error("[NotificationsSilenceService] Error getting mute status:", error);
        return null;
    }
}

/** @returns {boolean} */
export function isNotificationsMuted() {
    return getMuteStatus() !== null;
}

/** Limpia el estado de silenciamiento. */
export function clearMuteStatus() {
    localStorage.removeItem(STORAGE_KEY);
}
