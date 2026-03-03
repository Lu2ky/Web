const UPDATE_COMMENT_ENDPOINT = import.meta.env.VITE_API_UPDATE_COMMENT;

/**
 * Update an existing comment text.
 * @param {number|string} id - N_idComentarios
 * @param {string} newText - T_comentario
 */
export default async function updateComment(id, newText) {
    const payload = {
        N_idComentarios: id,
        T_comentario: newText,
    };

    const res = await fetch(UPDATE_COMMENT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`updateComment failed: ${res.status} ${text}`);
    }

    return res.json();
}
