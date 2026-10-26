// ============================================================================
// Servicio de Períodos Académicos
// ============================================================================
// Contrato real de `apps/api-go`:
//   GET  /academic-periods
//   POST /academic-periods/insert  { idUsuario, nombre, fechaInicio, fechaFinal }
//   POST /academic-periods/update  { idUsuario, idPeriodo, nombre, fechaInicio, fechaFinal }
//   POST /academic-periods/delete  { idUsuario, idPeriodo }
// ============================================================================

import { apiClient } from "./apiClient";
import { getSessionCodUsuario } from "../session/authSession";
import { getUserData } from "./userService";
import { mapAcademicPeriods } from "./academicPeriodMappers";

const logDebug = (...args) => {
  if (import.meta.env.DEV) console.log("[AcademicPeriods]", ...args);
};

/**
 * Resuelve el `N_idUsuario` numérico. `GET /users/:id` solo acepta el id
 * numérico, así que un username se resuelve con la sesión o con la API.
 */
const resolveUserIdInt = async (rawUserId) => {
  const direct = Number(rawUserId);
  if (Number.isInteger(direct) && direct > 0) return direct;

  const safe = String(rawUserId || "").trim();
  if (!safe) return null;

  const fromSession = Number(getSessionCodUsuario());
  if (Number.isInteger(fromSession) && fromSession > 0) return fromSession;

  try {
    const userData = await getUserData(safe);
    const currentUser = Array.isArray(userData) ? userData[0] : userData;
    const candidate = Number(currentUser?.id);
    if (Number.isInteger(candidate) && candidate > 0) return candidate;
  } catch (error) {
    logDebug("resolveUserIdInt lookup failed", error?.message || error);
  }

  return null;
};

const postJson = async ({ path, requestBody, defaultError }) => {
  logDebug("POST request", { path, requestBody });

  try {
    const data = await apiClient.post(path, requestBody);
    logDebug("POST response", { path, data });

    if (data && typeof data.success === "boolean" && !data.success) {
      return {
        success: false,
        message: data?.message || "La operación no se pudo completar",
        data,
      };
    }

    return {
      success: true,
      message: data?.message || "Operación completada correctamente",
      data,
    };
  } catch (error) {
    logDebug("POST failed", { path, error: error?.message || error });
    return {
      success: false,
      message: error?.message || defaultError(error?.status),
    };
  }
};

export const fetchAcademicPeriods = async () => {
  try {
    const payload = await apiClient.get("/academic-periods");
    const rawItems = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    return mapAcademicPeriods(rawItems);
  } catch (error) {
    console.error("Error al cargar períodos académicos:", error?.message || error);
    return [];
  }
};

export const createAcademicPeriod = async ({ idUsuario, nombre, fechaInicio, fechaFinal }) => {
  const safeUserRaw = String(idUsuario || "").trim();
  const safeName = String(nombre || "").trim();
  const safeStart = String(fechaInicio || "").trim();
  const safeEnd = String(fechaFinal || "").trim();

  if (!safeUserRaw || !safeName || !safeStart || !safeEnd) {
    return {
      success: false,
      message: "Faltan campos obligatorios para crear el período",
    };
  }

  const userIdAsInt = Number.parseInt(safeUserRaw, 10);
  if (!Number.isInteger(userIdAsInt)) {
    return {
      success: false,
      message: "El ID del usuario es inválido. Por favor verifica la configuración de sesión.",
    };
  }

  const result = await postJson({
    path: "/academic-periods/insert",
    requestBody: {
      idUsuario: userIdAsInt,
      nombre: safeName,
      fechaInicio: safeStart,
      fechaFinal: safeEnd,
      codUsuario: getSessionCodUsuario(),
    },
    defaultError: (status) => `Error ${status} al crear período académico`,
  });

  if (!result.success) return result;

  return {
    success: true,
    message: result.data?.message || "Período académico creado correctamente",
    data: result.data,
  };
};

export const updateAcademicPeriod = async ({ idUsuario, idPeriodo, nombre, fechaInicio, fechaFinal }) => {
  const safePeriodId = String(idPeriodo || "").trim();
  const safeName = String(nombre || "").trim();
  const safeStart = String(fechaInicio || "").trim();
  const safeEnd = String(fechaFinal || "").trim();

  if (!safePeriodId || !safeName || !safeStart || !safeEnd) {
    return {
      success: false,
      message: "Faltan campos obligatorios para actualizar el período",
    };
  }

  const periodIdAsInt = Number.parseInt(safePeriodId, 10);
  if (!Number.isInteger(periodIdAsInt)) {
    return {
      success: false,
      message: "El ID del período académico es inválido",
    };
  }

  if (safeStart > safeEnd) {
    return {
      success: false,
      message: "La fecha de inicio no puede ser mayor que la fecha final",
    };
  }

  const userIdAsInt = await resolveUserIdInt(idUsuario);

  const result = await postJson({
    path: "/academic-periods/update",
    requestBody: {
      ...(Number.isInteger(userIdAsInt) ? { idUsuario: userIdAsInt } : {}),
      idPeriodo: periodIdAsInt,
      nombre: safeName,
      fechaInicio: safeStart,
      fechaFinal: safeEnd,
    },
    defaultError: (status) => `Error ${status} al actualizar período académico`,
  });

  if (!result.success) return result;

  return {
    success: true,
    message: result.data?.message || "Período académico actualizado correctamente",
    data: result.data,
  };
};

export const deleteAcademicPeriod = async ({ idUsuario, idPeriodo }) => {
  const safePeriodId = String(idPeriodo || "").trim();
  const periodIdAsInt = Number.parseInt(safePeriodId, 10);

  if (!safePeriodId) {
    return {
      success: false,
      message: "Falta el ID del período a eliminar",
    };
  }

  if (!Number.isInteger(periodIdAsInt)) {
    return {
      success: false,
      message: "El ID del período académico es inválido",
    };
  }

  const userIdAsInt = await resolveUserIdInt(idUsuario);

  const result = await postJson({
    path: "/academic-periods/delete",
    requestBody: {
      ...(Number.isInteger(userIdAsInt) ? { idUsuario: userIdAsInt } : {}),
      idPeriodo: periodIdAsInt,
    },
    defaultError: (status) => `Error ${status} al eliminar período académico`,
  });

  if (!result.success) return result;

  return {
    success: true,
    message: result.data?.message || "Período académico eliminado correctamente",
    data: result.data,
  };
};
