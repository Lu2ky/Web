import env from '../env.js';

const ADD_COMMENT_ENDPOINT = env('VITE_API_ADD_COMMENT');

/**
 * Add a personal comment for a course/session.
 * @param {object} params
 * @param {number|string} params.scheduleId - N_idHorario
 * @param {number|string} params.userId - N_idUsuario
 * @param {number|string} params.courseId - N_idCurso
 * @param {string} params.courseName - Curso
 * @param {string} params.comment - T_comentario
 */
export default async function addComment({ scheduleId, userId, courseId, courseName, comment }) {
    const payload = {
        N_idHorario: scheduleId,
        N_idUsuario: userId,
        N_idCurso: courseId,
        Curso: courseName,
        T_comentario: comment,
    };

    const res = await fetch(ADD_COMMENT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`addComment failed: ${res.status} ${text}`);
    }

    return res.json();
}
