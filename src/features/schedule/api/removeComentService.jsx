import { apiClient } from "../../../shared/api/apiClient";
import { getSessionCodUsuario, getSessionNumericUserId } from "../../../shared/session/authSession";

function resolveNumericUserId(explicit) {
  const fromArgument = Number(explicit);
  if (Number.isInteger(fromArgument) && fromArgument > 0) return fromArgument;

  const fromSession = Number(getSessionNumericUserId());
  return Number.isInteger(fromSession) && fromSession > 0 ? fromSession : null;
}

/**
 * Elimina (borrado lógico) un comentario.
 * Contrato: POST /comments/personal/delete
 * @param {number|string} id - N_idComentarios
 * @param {number|string} courseId - N_idCurso
 * @param {number|string} [userId] - N_idUsuario (por defecto, el de la sesión)
 */
export default async function deleteComment(id, courseId, userId, codUsuarioInput) {
  const safeUserId = resolveNumericUserId(userId);
  const codUsuario = String(codUsuarioInput || getSessionCodUsuario() || "").trim();

  if (!safeUserId) {
    throw new Error("No se pudo resolver el usuario para eliminar el comentario");
  }

  return apiClient.post("/comments/personal/delete", {
    N_idComentarios: Number(id),
    N_idUsuario: safeUserId,
    N_idCurso: Number(courseId),
    codUsuario,
  });
}
