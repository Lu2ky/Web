// ============================================================================
// Servicio de Etiquetas
// ============================================================================
// Contrato real de `apps/api-go`:
//   GET  /tags/users/:id
//   GET  /tags/users/:id/reminders/:reminderId
//   POST /tags/delete  { N_idEtiqueta, P_usuario, codUsuario }
// ============================================================================

import { apiClient } from "../../../shared/api/apiClient";
import { getSessionCodUsuario, getSessionNumericUserId } from "../../../shared/session/authSession";
import { getUserData } from "../../../shared/api/userService";

const APIClient = apiClient;

function isDeleted(value) {
    if (value === true || value === 1 || value === "1") return true;
    if (value && typeof value === "object") return value.Bool === true;
    return false;
}

function normalizeTag(tag) {
    if (typeof tag === "string") return tag;

    const label = tag?.T_nombre ?? tag?.nombre ?? tag?.label ?? tag?.name ?? null;
    if (!label) return null;

    return {
        id: tag?.N_idEtiqueta ?? tag?.id ?? null,
        label: String(label),
        type: tag?.type ?? "custom",
    };
}

function mapTags(rows) {
    if (!Array.isArray(rows)) return [];

    const normalized = rows
        .filter((row) => !isDeleted(row?.B_isDeleted))
        .map(normalizeTag)
        .filter(Boolean);

    // Evita colisiones de `key` en React cuando la API repite etiquetas.
    const seen = new Set();
    return normalized.filter((tag) => {
        const key = tag.id ?? tag.label;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function resolveNumericUserId(userId) {
    const direct = Number(userId);
    if (Number.isInteger(direct) && direct > 0) return direct;

    const fromSession = Number(getSessionNumericUserId());
    if (Number.isInteger(fromSession) && fromSession > 0) return fromSession;

    const userData = await getUserData(userId);
    const currentUser = Array.isArray(userData) ? userData[0] : userData;
    return currentUser?.idUsuario ?? currentUser?.N_idUsuario ?? null;
}

/** Etiquetas del usuario, normalizadas para la UI. */
export async function getTagsByUser(userId) {
    if (!userId) return [];

    const id = await resolveNumericUserId(userId);
    if (!id) return [];

    try {
        const rows = await APIClient.get(`/tags/users/${id}`);
        return mapTags(rows);
    } catch (error) {
        console.error("getTagsByUser failed:", error?.message || error);
        return [];
    }
}

/** Etiquetas asociadas a un recordatorio concreto. */
export async function getTagsByReminder(userId, reminderId) {
    if (!userId || !reminderId) return [];

    try {
        const rows = await APIClient.get(
            `/tags/users/${encodeURIComponent(userId)}/reminders/${encodeURIComponent(reminderId)}`
        );
        return mapTags(rows);
    } catch (error) {
        console.error("getTagsByReminder failed:", error?.message || error);
        return [];
    }
}

/** Elimina (o recupera) una etiqueta. */
export async function deleteTag(tagId, userId) {
    if (!tagId) return null;

    const numericUserId = await resolveNumericUserId(userId);
    if (!numericUserId) {
        throw new Error("No se pudo resolver el usuario para eliminar la etiqueta");
    }

    return APIClient.post("/tags/delete", {
        N_idEtiqueta: Number(tagId),
        P_usuario: numericUserId,
        codUsuario: getSessionCodUsuario(),
    });
}
