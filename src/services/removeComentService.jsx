const DELETE_COMMENT_ENDPOINT = import.meta.env.VITE_API_DELETE_COMMENT;

/**
 * Delete a comment by its ID.
 * @param {number|string} id - N_idComentarios
 */
export default async function deleteComment(id) {
    const payload = {
        N_idComentarios: id,
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
