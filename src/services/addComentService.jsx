const ADD_COMMENT_ENDPOINT = import.meta.env.VITE_API_ADD_COMMENT;

const normalizeId = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : value;
};

/**
 * Agrega un comentario personal para un curso/horario.
 * @param {object} params
 * @param {number|string} params.scheduleId - N_idHorario
 * @param {number|string} params.userId - N_idUsuario
 * @param {number|string} params.courseId - N_idCurso
 * @param {string} params.courseName - Curso
 * @param {string} params.comment - T_comentario
 */
export default async function addComment({ scheduleId, userId, courseId, courseName, comment }) {
    const safeScheduleId = normalizeId(scheduleId);
    const safeUserId = normalizeId(userId);
    const safeCourseId = normalizeId(courseId);
    const safeComment = String(comment ?? "").trim();

    if (!safeScheduleId || !safeUserId || !safeCourseId || !safeComment) {
        throw new Error(`addComment invalid payload: scheduleId=${safeScheduleId}, userId=${safeUserId}, courseId=${safeCourseId}, commentLen=${safeComment.length}`);
    }

    const payload = {
        N_idHorario: safeScheduleId,
        N_idUsuario: safeUserId,
        N_idCurso: safeCourseId,
        Curso: courseName,
        T_comentario: safeComment,
    };

    if (!ADD_COMMENT_ENDPOINT) {
        throw new Error("ADD_COMMENT_ENDPOINT is not configured (env missing)");
    }

    try {
        // depuración: ayuda a rastrear solicitudes fallidas en logs del navegador/servidor
        console.debug("addComment POST", ADD_COMMENT_ENDPOINT, payload);

        const res = await fetch(ADD_COMMENT_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`addComment failed: ${res.status} ${text}`);
        }

        const json = await res.json();
        return json;
    } catch (err) {
        console.error("addComment error:", err);
        throw err;
    }
}
