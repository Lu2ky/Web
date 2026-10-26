import { apiClient } from "../../../shared/api/apiClient";
import { getSessionCodUsuario, getSessionNumericUserId } from "../../../shared/session/authSession";

function resolveNumericUserId(explicit) {
  const fromArgument = Number(explicit);
  if (Number.isInteger(fromArgument) && fromArgument > 0) return fromArgument;

  const fromSession = Number(getSessionNumericUserId());
  return Number.isInteger(fromSession) && fromSession > 0 ? fromSession : null;
}

/**
 * Actualiza el texto de un comentario existente.
 * Contrato: POST /comments/personal/update
 * @param {number|string} id - N_idComentarios
 * @param {string} newText - T_comentario
 * @param {number|string} courseId - N_idCurso
 * @param {number|string} [userId] - N_idUsuario (por defecto, el de la sesión)
 */
export default async function updateComment(id, newText, courseId, userId, codUsuarioInput) {
  const safeUserId = resolveNumericUserId(userId);
  const codUsuario = String(codUsuarioInput || getSessionCodUsuario() || "").trim();

  if (!safeUserId) {
    throw new Error("No se pudo resolver el usuario para actualizar el comentario");
  }

  return apiClient.post("/comments/personal/update", {
    N_idComentarios: Number(id),
    N_idUsuario: safeUserId,
    T_comentario: String(newText ?? ""),
    N_idCurso: Number(courseId),
    codUsuario,
  });
}
