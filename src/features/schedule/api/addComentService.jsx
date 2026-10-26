import { apiClient } from "../../../shared/api/apiClient";
import { getSessionCodUsuario, getSessionNumericUserId } from "../../../shared/session/authSession";

const normalizeId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : value;
};

function resolveNumericUserId(explicit) {
  const fromArgument = Number(explicit);
  if (Number.isInteger(fromArgument) && fromArgument > 0) return fromArgument;

  const fromSession = Number(getSessionNumericUserId());
  return Number.isInteger(fromSession) && fromSession > 0 ? fromSession : null;
}

/**
 * Agrega un comentario personal para un curso/horario.
 * Contrato: POST /comments/personal
 * @param {object} params
 * @param {number|string} params.scheduleId - N_idHorario
 * @param {number|string} params.userId - N_idUsuario
 * @param {number|string} params.courseId - N_idCurso
 * @param {string} params.courseName - Curso
 * @param {string} params.comment - T_comentario
 */
export default async function addComment({
  scheduleId,
  userId,
  courseId,
  courseName,
  comment,
  codUsuario: codUsuarioInput,
}) {
  const safeScheduleId = normalizeId(scheduleId);
  const safeUserId = resolveNumericUserId(userId);
  const safeCourseId = normalizeId(courseId);
  const safeComment = String(comment ?? "").trim();
  const codUsuario = String(codUsuarioInput || getSessionCodUsuario() || "").trim();

  if (!safeScheduleId || !safeUserId || !safeCourseId || !safeComment) {
    throw new Error(
      `addComment invalid payload: scheduleId=${safeScheduleId}, userId=${safeUserId}, courseId=${safeCourseId}, commentLen=${safeComment.length}`
    );
  }

  return apiClient.post("/comments/personal", {
    N_idHorario: safeScheduleId,
    N_idUsuario: safeUserId,
    N_idCurso: safeCourseId,
    Curso: courseName,
    T_comentario: safeComment,
    codUsuario,
  });
}
