const DELETE_COMMENT_ENDPOINT = import.meta.env.VITE_API_DELETE_COMMENT;
import { getSessionCodUsuario } from "./authSession";

/**
 * Delete a comment by its ID.
 * @param {number|string} id - N_idComentarios
 * @param {number|string} courseId - N_idCurso
 */
export default async function deleteComment(id, courseId, codUsuarioInput) {
    const codUsuario = String(codUsuarioInput || getSessionCodUsuario() || "").trim();
    const payload = {
        N_idComentarios: id,
        N_idCurso: courseId,
        codUsuario,
    };

    const res = await fetch(DELETE_COMMENT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`deleteComment failed: ${res.status} ${text}`);
    }

    return res.json();
}
