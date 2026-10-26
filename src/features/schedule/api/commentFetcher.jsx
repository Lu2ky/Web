// ============================================================================
// Servicio de Comentarios
// ============================================================================
// Obtiene y normaliza los comentarios personales del usuario.
// Contrato: GET /comments/personal/users/:id
// Filtra por curso/horario y descarta comentarios borrados lógicamente.
// ============================================================================

import { apiClient } from "../../../shared/api/apiClient";

// Extrae array de datos desde múltiples estructuras API posibles
const normalizeRawArray = (json) => {
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.comments)) return json.comments;
    if (Array.isArray(json?.results)) return json.results;
    if (Array.isArray(json)) return json;
    return [];
};

const unwrapDbValue = (value) => {
    if (value === null || value === undefined) return value;
    if (typeof value !== "object") return value;

    if ("Int64" in value) return value.Int64;
    if ("Float64" in value) return value.Float64;
    if ("String" in value) return value.String;
    if ("Bool" in value) return value.Bool;

    return value;
};

const toComparableId = (value) => {
    const unwrapped = unwrapDbValue(value);
    if (unwrapped === null || unwrapped === undefined || unwrapped === "") return null;

    const sanitized = typeof unwrapped === "string" ? unwrapped.trim() : unwrapped;
    const numeric = Number(sanitized);
    return Number.isFinite(numeric) ? numeric : String(sanitized);
};

// Verifica si un comentario está marcado como eliminado (eliminación lógica)
const isDeleted = (comment) => {
    const flag = unwrapDbValue(comment?.B_isDeleted);
    if (typeof flag === "boolean") return flag;
    return false;
};

// Filtra comentarios por curso y/u horario, excluyendo eliminados
const filterByScope = (comments, { courseId, scheduleId }) => {
    const targetCourseId = toComparableId(courseId);
    const targetScheduleId = toComparableId(scheduleId);

    return comments.filter((comment) => {
        if (isDeleted(comment)) return false;

        const commentCourseId = toComparableId(comment?.N_idCurso ?? comment?.id_course ?? comment?.courseId ?? comment?.ID_CURSO);
        const commentScheduleId = toComparableId(comment?.N_idHorario ?? comment?.id_schedule ?? comment?.scheduleId ?? comment?.ID_HORARIO);

        const matchesCourse = targetCourseId !== null
            && commentCourseId !== null
            && commentCourseId === targetCourseId;

        const matchesSchedule = targetScheduleId !== null
            && commentScheduleId !== null
            && commentScheduleId === targetScheduleId;

        // Cuando tenemos ambos IDs, aceptar coincidencia por cualquiera.
        // Esto evita perder comentarios cuando backend asocia mejor por horario.
        if (targetCourseId !== null && targetScheduleId !== null) {
            return matchesCourse || matchesSchedule;
        }

        if (targetCourseId !== null) {
            return matchesCourse;
        }

        if (targetScheduleId !== null) {
            return matchesSchedule;
        }

        return true;
    });
};

const dedupeComments = (comments) => {
    const seen = new Set();

    return comments.filter((comment) => {
        const idKey = comment?.N_idComentarios ?? comment?.id ?? comment?.ID;
        const signature = [
            comment?.N_idUsuario ?? comment?.id_user ?? "",
            comment?.N_idCurso ?? comment?.id_course ?? "",
            comment?.N_idHorario ?? comment?.id_schedule ?? "",
            comment?.T_comentario ?? comment?.text ?? comment?.comentario ?? "",
            comment?.Dt_fecha ?? comment?.timestamp ?? comment?.fecha ?? "",
        ];

        const key = idKey !== undefined && idKey !== null ? `id:${idKey}` : `sig:${signature.join("|")}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

export const normalizeComment = (comment, fallbackId) => ({
    id: unwrapDbValue(comment?.N_idComentarios) ?? unwrapDbValue(comment?.id) ?? unwrapDbValue(comment?.ID) ?? fallbackId,
    text: unwrapDbValue(comment?.T_comentario) ?? unwrapDbValue(comment?.text) ?? unwrapDbValue(comment?.comentario) ?? "",
    timestamp: unwrapDbValue(comment?.Dt_fecha) ?? unwrapDbValue(comment?.timestamp) ?? unwrapDbValue(comment?.fecha) ?? "",
});

export const normalizeComments = (comments) => {
    if (!Array.isArray(comments)) return [];
    return comments.map((comment, index) => normalizeComment(comment, `tmp-${index}`));
};

export async function fetchComments({ userId, courseId, scheduleId }) {
    if (!userId) return [];

    const json = await apiClient.get(`/comments/personal/users/${encodeURIComponent(userId)}`);
    const raw = normalizeRawArray(json);
    const filtered = filterByScope(raw, { courseId, scheduleId });
    const deduped = dedupeComments(filtered);
    return normalizeComments(deduped);
}

export default fetchComments;
