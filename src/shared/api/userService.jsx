// ============================================================================
// Servicio de Usuario
// ============================================================================
// Datos de perfil y preferencias del usuario. Todo pasa por `apiClient`; no hay
// `fetch` directo ni endpoints en variables de entorno.
//
// Contrato real de `apps/api-go`:
//   GET  /users/:id              -> UserData[] | null (id numérico)
//   POST /notifications/mute     -> { message }
//   POST /auth/change-password   -> { message }
// ============================================================================

import { apiClient } from "./apiClient";
import { getAuthSession, getSessionCodUsuario, getSessionNumericUserId } from "../session/authSession";
import { changePasswordLocal } from "./authLocal";

const APIClient = apiClient;

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

function toMinutes(timeValue) {
    const normalized = toTimeMuteValue(timeValue);
    const [hours, minutes] = normalized.split(":").map((part) => parseInt(part, 10) || 0);
    return hours * 60 + minutes;
}

/**
 * Resuelve el `N_idUsuario` numérico que espera la API.
 * - Si el valor recibido ya es numérico, se usa.
 * - Si no, se usa el id numérico guardado en la sesión (login).
 */
function resolveNumericUserId(userId) {
    const direct = Number(userId);
    if (Number.isInteger(direct) && direct > 0) return direct;

    const fromSession = Number(getSessionNumericUserId());
    if (Number.isInteger(fromSession) && fromSession > 0) return fromSession;

    return null;
}

/**
 * Normaliza una fila de `GET /users/:id`.
 *
 * La API devuelve las claves `N_*`/`T_*` del modelo de base de datos. La UI
 * consume `id`; el resto de campos se conservan con sus alias para no romper
 * los consumidores que aún leen nombres legacy.
 */
export function normalizeUserRow(user) {
    if (!user || typeof user !== "object") return user;

    const id = user.id
        ?? user.idUsuario
        ?? user.N_idUsuario
        ?? user.id_user
        ?? user.ID_USER
        ?? null;

    return { ...user, id };
}

function unwrapUserData(data) {
    if (!data) return null;
    if (Array.isArray(data)) return data.length > 0 ? data[0] : null;
    return data;
}

/**
 * Obtiene datos del usuario por su ID.
 * @param {number|string} userId id numérico o username
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<object[]|null>} array de UserData o null
 */
export async function getUserData(userId, { signal } = {}) {
    if (!userId) return null;

    const numericId = resolveNumericUserId(userId);
    if (!numericId) {
        // `GET /users/:id` solo acepta N_idUsuario; sin sesión no se puede resolver.
        return null;
    }

    try {
        const data = await APIClient.get(`/users/${numericId}`, { signal });
        if (!data) return null;
        return (Array.isArray(data) ? data : [data]).map(normalizeUserRow);
    } catch (error) {
        if (error?.name === "AbortError" || error?.status === 0) {
            if (signal?.aborted) return null;
        }
        console.error("Error fetching user data:", error?.message || error);
        return null;
    }
}

/**
 * Actualiza el correo del usuario conservando su antelación de notificaciones.
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function updateUserEmail(userId, newEmail) {
    if (!userId || !newEmail) {
        return { success: false, message: "Usuario y correo son obligatorios" };
    }

    const currentUser = unwrapUserData(await getUserData(userId));
    if (!currentUser) {
        return { success: false, message: "No se encontraron datos del usuario" };
    }

    const actualUserId = currentUser.idUsuario ?? currentUser.N_idUsuario ?? resolveNumericUserId(userId);
    const currentAnticipation = toTimeMuteValue(
        currentUser.antelacionNotis ?? currentUser.tiempoMute ?? "00:00:00"
    );

    try {
        const body = await APIClient.post("/notifications/mute", {
            idUsuario: Number(actualUserId),
            correo: newEmail.trim(),
            antelacionNotis: currentAnticipation,
            codUsuario: getSessionCodUsuario(),
        });
        return { success: true, ...(typeof body === "string" ? { message: body } : body) };
    } catch (error) {
        console.error("Error updating user email:", error?.message || error);
        return { success: false, message: error?.message || "No se pudo actualizar el correo" };
    }
}

/**
 * Actualiza la antelación de notificaciones conservando el correo actual.
 * @param {number|string} userId
 * @param {number} minutes
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function updateReminderAnticipation(userId, minutes) {
    if (!userId || minutes === undefined) {
        return { success: false, message: "Usuario y minutos son obligatorios" };
    }

    const validatedMinutes = Math.min(Math.max(0, parseInt(minutes, 10) || 0), 1440);
    const currentUser = unwrapUserData(await getUserData(userId));
    if (!currentUser) {
        return { success: false, message: "No se encontraron datos del usuario" };
    }

    const actualUserId = currentUser.idUsuario ?? currentUser.N_idUsuario ?? resolveNumericUserId(userId);
    const currentEmail = String(currentUser.correo ?? currentUser.email ?? "").trim();
    const hours = Math.floor(validatedMinutes / 60);
    const mins = validatedMinutes % 60;

    try {
        const body = await APIClient.post("/notifications/mute", {
            idUsuario: Number(actualUserId),
            correo: currentEmail,
            antelacionNotis: `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`,
            codUsuario: getSessionCodUsuario(),
        });
        return { success: true, ...(typeof body === "string" ? { message: body } : body) };
    } catch (error) {
        console.error("Error updating reminder anticipation:", error?.message || error);
        return { success: false, message: error?.message || "No se pudo actualizar el tiempo de anticipación" };
    }
}

export function getAnticipationMinutes(userData) {
    if (!userData) return 0;
    return toMinutes(userData.antelacionNotis ?? userData.tiempoMute ?? "00:00:00");
}

/**
 * Cambia la contraseña del usuario usando autenticación local.
 * 1) Verifica la contraseña actual con el endpoint local.
 * 2) Llama a `/auth/change-password` con la nueva contraseña.
 */
export async function changePassword(userId, currentPassword, newPassword) {
    if (!userId || !currentPassword || !newPassword) {
        return { success: false, message: "Todos los campos son obligatorios" };
    }

    if (String(currentPassword) === String(newPassword)) {
        return { success: false, message: "La nueva contraseña debe ser diferente a la actual" };
    }

    const username = String(getAuthSession()?.userId || userId).trim();

    try {
        const authResult = await changePasswordLocal(currentPassword, newPassword);
        
        if (!authResult.success) {
            return { success: false, message: authResult?.message || "La contraseña actual es incorrecta" };
        }

        return { success: true, message: "Contraseña cambiada correctamente" };
    } catch (error) {
        console.error("Error changing password:", error?.message || error);
        return { success: false, message: error?.message || "No se pudo cambiar la contraseña" };
    }
}

export default { getUserData, updateUserEmail, updateReminderAnticipation, changePassword, getAnticipationMinutes };