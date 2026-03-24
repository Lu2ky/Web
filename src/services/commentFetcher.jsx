// ============================================================================
// Servicio de Comentarios
// ============================================================================
// Gestiona la obtención y normalización de comentarios de clases.
// Soporta múltiples formatos de API y filtra por curso/horario.
// Maneja comentarios eliminados lógicamente (B_isDeleted flag).
// ============================================================================

const COMMENTS_ENDPOINT = import.meta.env.VITE_API_URL_COMMENTS;


// Extrae array de datos desde múltiples estructuras API posibles
const normalizeRawArray = (json) => {
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.comments)) return json.comments;
    if (Array.isArray(json?.results)) return json.results;
    if (Array.isArray(json)) return json;
    return [];
};

const joinUserUrl = (base, userId) => {
    const sanitizedBase = String(base ?? "").trim().replace(/\/+$/, "");
    return `${sanitizedBase}/${userId}`;
};

const toComparableId = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : String(value);
};


// Verifica si un comentario está marcado como eliminado (eliminación lógica)
const isDeleted = (comment) => {
    const flag = comment?.B_isDeleted;
    if (typeof flag === "boolean") return flag;
    if (flag && typeof flag === "object" && typeof flag.Bool === "boolean") return flag.Bool;
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

        if (targetCourseId !== null) {
            if (commentCourseId === null) return false;
            return commentCourseId === targetCourseId;
        }

        if (targetScheduleId !== null) {
            if (commentScheduleId === null) return false;
            return commentScheduleId === targetScheduleId;
        }

        return true;
    });
};

const dedupeComments = (comments) => {
    const seen = new Set();

    return comments.filter((comment, index) => {
        const idKey = comment?.N_idComentarios ?? comment?.id ?? comment?.ID;
        const signature = [
            comment?.N_idUsuario ?? comment?.id_user ?? "",
            comment?.N_idCurso ?? comment?.id_course ?? "",
            comment?.N_idHorario ?? comment?.id_schedule ?? "",
            comment?.T_comentario ?? comment?.text ?? comment?.comentario ?? "",
            comment?.Dt_fecha ?? comment?.timestamp ?? comment?.fecha ?? "",
            index,
        ];

        const key = idKey !== undefined && idKey !== null ? `id:${idKey}` : `sig:${signature.slice(0, 5).join("|")}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const fetchJson = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        const text = await response.text();
        const error = new Error(`fetchComments failed: ${response.status} ${text}`);
        error.status = response.status;
        throw error;
    }

    return response.json();
};

export const normalizeComment = (comment, fallbackId) => ({
    id: comment?.N_idComentarios ?? comment?.id ?? comment?.ID ?? fallbackId,
    text: comment?.T_comentario ?? comment?.text ?? comment?.comentario ?? "",
    timestamp: comment?.Dt_fecha ?? comment?.timestamp ?? comment?.fecha ?? "",
});

export const normalizeComments = (comments) => {
    if (!Array.isArray(comments)) return [];
    return comments.map((comment, index) => normalizeComment(comment, `tmp-${index}`));
};

export async function fetchComments({ userId, courseId, scheduleId }) {
    if (!userId) return [];
    if (!COMMENTS_ENDPOINT) {
        throw new Error("COMMENTS_ENDPOINT is not configured (env missing)");
    }

    const json = await fetchJson(joinUserUrl(COMMENTS_ENDPOINT, userId));
    const raw = normalizeRawArray(json);
    const filtered = filterByScope(raw, { courseId, scheduleId });
    const deduped = dedupeComments(filtered);
    return normalizeComments(deduped);
}

export default fetchComments;
