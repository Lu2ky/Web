// ============================================================================
// Servicio de Períodos Académicos
// ============================================================================
// Obtiene, crea, actualiza y elimina períodos académicos.
// ============================================================================
import { getSessionCodUsuario } from "./authSession";

const PERIOD_NAME_KEYS = [
  "nombre",
  "academicPeriod",
  "academic_period",
  "periodoAcademico",
  "periodo_academico",
  "period",
  "name",
  "label",
  "descripcion",
  "description"
];

const PERIOD_ID_KEYS = [
  "idPeriodoAcademico",
  "id",
  "idPeriodo",
  "periodo_id",
  "academicPeriodId",
  "academic_period_id",
  "periodId"
];

const PERIOD_START_DATE_KEYS = [
  "fechaInicio",
  "start_date",
  "startDate",
  "Dt_Start",
  "dt_start",
  "fecha_inicio",
  "fecha_inicio_vigencia",
  "start",
  "begin_date"
];

const PERIOD_END_DATE_KEYS = [
  "fechaFinal",
  "end_date",
  "endDate",
  "Dt_End",
  "dt_end",
  "fecha_fin",
  "fechaFin",
  "fecha_fin_vigencia",
  "end",
  "close_date"
];

const isAcademicPeriodsDebugEnabled = () => {
  const rawValue = String(import.meta.env.VITE_DEBUG_ACADEMIC_PERIODS || "").trim().toLowerCase();
  return import.meta.env.DEV || rawValue === "1" || rawValue === "true";
};

const logAcademicPeriodsDebug = (...args) => {
  if (!isAcademicPeriodsDebugEnabled()) return;
  console.log("[AcademicPeriods]", ...args);
};

const logAcademicPeriodsWarn = (...args) => {
  if (!isAcademicPeriodsDebugEnabled()) return;
  console.warn("[AcademicPeriods]", ...args);
};

const logAcademicPeriodsError = (...args) => {
  if (!isAcademicPeriodsDebugEnabled()) return;
  console.error("[AcademicPeriods]", ...args);
};

const getPeriodName = (rawItem) => {
  if (typeof rawItem === "string") return rawItem.trim();
  if (!rawItem || typeof rawItem !== "object") return "";

  for (const key of PERIOD_NAME_KEYS) {
    const value = rawItem[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const getPeriodId = (rawItem) => {
  if (!rawItem || typeof rawItem !== "object") return null;

  for (const key of PERIOD_ID_KEYS) {
    const value = rawItem[key];
    if (value !== null && value !== undefined && value !== "") {
      return String(value).trim();
    }
  }

  return null;
};

const getNormalizedObject = (rawItem) => {
  const normalizedObj = {};
  for (const [key, value] of Object.entries(rawItem)) {
    normalizedObj[key.trim()] = value;
  }
  return normalizedObj;
};

const extractDate = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;
  const dateMatch = value.match(/(\d{4}-\d{2}-\d{2})/);
  return dateMatch ? dateMatch[1] : value.trim();
};

const getPeriodStartDate = (rawItem) => {
  if (!rawItem || typeof rawItem !== "object") return null;

  const normalizedObj = getNormalizedObject(rawItem);
  for (const key of PERIOD_START_DATE_KEYS) {
    const value = normalizedObj[key] || normalizedObj[key.trim()];
    const extracted = extractDate(value);
    if (extracted) return extracted;
  }

  return null;
};

const getPeriodEndDate = (rawItem) => {
  if (!rawItem || typeof rawItem !== "object") return null;

  const normalizedObj = getNormalizedObject(rawItem);
  for (const key of PERIOD_END_DATE_KEYS) {
    const value = normalizedObj[key] || normalizedObj[key.trim()];
    const extracted = extractDate(value);
    if (extracted) return extracted;
  }

  return null;
};

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

// Intentar resolver el idUsuario real a partir del valor provisto.
// Si se pasa un id numérico se usa tal cual, si no, intentamos obtenerlo
// desde `getUserData` (para preferir el `idUsuario` real de la BD).
import { getUserData } from "./userService";

const resolveUserIdInt = async (rawUserId) => {
  // Si ya es un número, devolverlo
  if (Number.isInteger(rawUserId)) {
    logAcademicPeriodsDebug("resolveUserIdInt: already a number", { rawUserId });
    return rawUserId;
  }
  
  // Si es un string, intentar parsearlo
  const safe = String(rawUserId || "").trim();
  if (!safe) return null;
  
  const parsed = Number.parseInt(safe, 10);
  if (Number.isInteger(parsed)) {
    logAcademicPeriodsDebug("resolveUserIdInt: parsed from string", { rawUserId: safe, parsed });
    return parsed;
  }
  
  // Si es un nombre de usuario (string que no es número), intentar resolver via getUserData
  try {
    logAcademicPeriodsDebug("resolveUserIdInt: attempting getUserData lookup", { rawUserId: safe });
    const userData = await getUserData(safe);
    const currentUser = Array.isArray(userData) ? userData[0] : userData;
    const candidate = 
      currentUser?.idUsuario ?? 
      currentUser?.N_idUsuario ?? 
      currentUser?.id_user ?? 
      currentUser?.ID_USER ?? 
      currentUser?.id ?? 
      null;
    
    if (candidate !== null) {
      const candidateInt = Number.parseInt(String(candidate).trim(), 10);
      if (Number.isInteger(candidateInt)) {
        logAcademicPeriodsDebug("resolveUserIdInt: resolved via getUserData", { rawUserId: safe, resolvedId: candidateInt });
        return candidateInt;
      }
    }
  } catch (e) {
    logAcademicPeriodsWarn("resolveUserIdInt: getUserData lookup failed", { rawUserId: safe, error: e?.message || e });
  }
  
  logAcademicPeriodsError("resolveUserIdInt: could not resolve to integer", { rawUserId });
  return null;
};

const postJson = async ({ endpoint, requestBody, defaultError }) => {
  logAcademicPeriodsDebug("POST request", { endpoint, requestBody });

  try {
    const tokenLocalStore = localStorage.getItem("token") || "";
    const token = `Bearer ${tokenLocalStore}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      },
      body: JSON.stringify(requestBody)
    });

    const parsedBody = await parseJsonSafe(response);
    logAcademicPeriodsDebug("POST response", {
      endpoint,
      status: response.status,
      ok: response.ok,
      body: parsedBody
    });

    if (!response.ok) {
      logAcademicPeriodsWarn("POST response not OK", {
        endpoint,
        status: response.status,
        body: parsedBody
      });
      return {
        success: false,
        message: parsedBody?.message || parsedBody?.error || defaultError(response.status),
        data: parsedBody
      };
    }

    if (parsedBody && typeof parsedBody.success === "boolean" && !parsedBody.success) {
      logAcademicPeriodsWarn("Backend reported success=false", {
        endpoint,
        body: parsedBody
      });
      return {
        success: false,
        message: parsedBody?.message || "La operacion no se pudo completar",
        data: parsedBody
      };
    }

    return {
      success: true,
      message: parsedBody?.message || "Operación completada correctamente",
      data: parsedBody
    };
  } catch (error) {
    logAcademicPeriodsError("POST exception", {
      endpoint,
      error: error?.message || error
    });
    return {
      success: false,
      message: error?.message || "No se pudo conectar con el servicio de períodos"
    };
  }
};

export const fetchAcademicPeriods = async () => {
  const endpoint = import.meta.env.VITE_API_URL_ACADEMIC_PERIODS;
  logAcademicPeriodsDebug("fetchAcademicPeriods called", { endpoint });

  if (!endpoint) {
    console.warn("VITE_API_URL_ACADEMIC_PERIODS no configurado");
    return [];
  }

  try {
    const tokenLocalStore = localStorage.getItem("token") || "";
    const token = `Bearer ${tokenLocalStore}`;

    const response = await fetch(endpoint, {
      headers: {
        "Authorization": token
      }
    });
    if (!response.ok) {
      console.error(`Error fetching academic periods: ${response.status}`);
      return [];
    }

    const payload = await response.json();
    const rawItems = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    const periods = rawItems
      .map((item) => {
        const nombre = getPeriodName(item);
        const id = getPeriodId(item);
        const start_date = getPeriodStartDate(item);
        const end_date = getPeriodEndDate(item);

        if (!nombre) return null;

        return {
          id: id || nombre,
          nombre,
          start_date,
          end_date
        };
      })
      .filter(Boolean)
      .filter((period, index, self) => index === self.findIndex((p) => p.id === period.id));

    return periods;
  } catch (error) {
    logAcademicPeriodsError("Error al cargar períodos académicos", error);
    return [];
  }
};

export const createAcademicPeriod = async ({ idUsuario, nombre, fechaInicio, fechaFinal }) => {
  const endpoint = import.meta.env.VITE_API_ADD_ACADEMIC_PERIOD;
  const codUsuario = getSessionCodUsuario();

  if (!endpoint) {
    return {
      success: false,
      message: "VITE_API_ADD_ACADEMIC_PERIOD no configurado"
    };
  }

  const safeUserRaw = String(idUsuario || "").trim();
  const safeName = String(nombre || "").trim();
  const safeStart = String(fechaInicio || "").trim();
  const safeEnd = String(fechaFinal || "").trim();
  const userIdAsInt = Number.parseInt(safeUserRaw, 10);

  if (!safeUserRaw || !safeName || !safeStart || !safeEnd) {
    return {
      success: false,
      message: "Faltan campos obligatorios para crear el período"
    };
  }

  if (!Number.isInteger(userIdAsInt)) {
    logAcademicPeriodsError("createAcademicPeriod: invalid user ID", { 
      original: safeUserRaw, 
      resolved: userIdAsInt 
    });
    return {
      success: false,
      message: "El ID del usuario es inválido. Por favor verifica la configuración de sesión."
    };
  }

  const result = await postJson({
    endpoint,
    requestBody: {
      idUsuario: userIdAsInt,
      nombre: safeName,
      fechaInicio: safeStart,
      fechaFinal: safeEnd,
      codUsuario
    },
    defaultError: (status) => `Error ${status} al crear período académico`
  });

  if (!result.success) return result;

  return {
    success: true,
    message: result.data?.message || "Período académico creado correctamente",
    data: result.data
  };
};

export const updateAcademicPeriod = async ({ idUsuario, idPeriodo, nombre, fechaInicio, fechaFinal }) => {
  const endpoint = import.meta.env.VITE_API_UPDATE_ACADEMIC_PERIOD;

  if (!endpoint) {
    return {
      success: false,
      message: "VITE_API_UPDATE_ACADEMIC_PERIOD no configurado"
    };
  }

  const safePeriodId = String(idPeriodo || "").trim();
  const safeUserRaw = String(idUsuario || "").trim();
  const periodIdAsInt = Number.parseInt(safePeriodId, 10);
  const safeName = String(nombre || "").trim();
  const safeStart = String(fechaInicio || "").trim();
  const safeEnd = String(fechaFinal || "").trim();

  if (!safePeriodId || !safeName || !safeStart || !safeEnd) {
    return {
      success: false,
      message: "Faltan campos obligatorios para actualizar el período"
    };
  }

  if (!Number.isInteger(periodIdAsInt)) {
    return {
      success: false,
      message: "El ID del período académico es inválido"
    };
  }

  if (safeStart > safeEnd) {
    return {
      success: false,
      message: "La fecha de inicio no puede ser mayor que la fecha final"
    };
  }

  const userIdAsInt = await resolveUserIdInt(safeUserRaw);

  const result = await postJson({
    endpoint,
    requestBody: {
      ...(Number.isInteger(userIdAsInt) ? { idUsuario: userIdAsInt } : {}),
      idPeriodoAcademico: periodIdAsInt,
      nombre: safeName,
      fechaInicio: safeStart,
      fechaFinal: safeEnd
    },
    defaultError: (status) => `Error ${status} al actualizar período académico`
  });

  if (!result.success) return result;

  return {
    success: true,
    message: result.data?.message || "Período académico actualizado correctamente",
    data: result.data
  };
};

export const deleteAcademicPeriod = async ({ idUsuario, idPeriodo }) => {
  const endpoint = import.meta.env.VITE_API_DELETE_ACADEMIC_PERIOD;

  if (!endpoint) {
    return {
      success: false,
      message: "VITE_API_DELETE_ACADEMIC_PERIOD no configurado"
    };
  }

  const safePeriodId = String(idPeriodo || "").trim();
  const safeUserRaw = String(idUsuario || "").trim();
  const periodIdAsInt = Number.parseInt(safePeriodId, 10);
  const userIdAsInt = await resolveUserIdInt(safeUserRaw);

  if (!safePeriodId) {
    return {
      success: false,
      message: "Falta el ID del período a eliminar"
    };
  }

  if (!Number.isInteger(periodIdAsInt)) {
    return {
      success: false,
      message: "El ID del período académico es inválido"
    };
  }

  const result = await postJson({
    endpoint,
    requestBody: {
      ...(Number.isInteger(userIdAsInt) ? { idUsuario: userIdAsInt } : {}),
      idPeriodoAcademico: periodIdAsInt
    },
    defaultError: (status) => `Error ${status} al eliminar período académico`
  });

  if (!result.success) return result;

  return {
    success: true,
    message: result.data?.message || "Período académico eliminado correctamente",
    data: result.data
  };
};