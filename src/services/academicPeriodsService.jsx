
// ============================================================================
// Servicio de Períodos Académicos
// ============================================================================
// Obtiene períodos académicos desde la API.
// Devuelve objetos con ID y nombre para filtrado y display.
// ============================================================================

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

/**
 * Extrae el nombre del período desde un objeto con múltiples claves posibles
 * @param {object} rawItem - Objeto del período desde la API
 * @returns {string} Nombre del período normalizado
 */
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

/**
 * Extrae el ID del período desde un objeto con múltiples claves posibles
 * @param {object} rawItem - Objeto del período desde la API
 * @returns {string|number|null} ID del período normalizado
 */
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

/**
 * Extrae la fecha de inicio del período desde un objeto con múltiples claves posibles
 * Normaliza el formato a YYYY-MM-DD (elimina timestamp si existe)
 * NOTA: Las API pueden devolver claves con espacios ("fechaInicio " vs "fechaInicio")
 * @param {object} rawItem - Objeto del período desde la API
 * @returns {string|null} Fecha de inicio (YYYY-MM-DD) o null
 */
const getPeriodStartDate = (rawItem) => {
  if (!rawItem || typeof rawItem !== "object") return null;

  // Normalizar objetos: eliminar espacios de las claves para buscar más robustamente
  const normalizedObj = {};
  for (const [key, value] of Object.entries(rawItem)) {
    normalizedObj[key.trim()] = value;
  }

  for (const key of PERIOD_START_DATE_KEYS) {
    const value = normalizedObj[key] || normalizedObj[key.trim()];
    if (typeof value === "string" && value.trim()) {
      // Extraer solo la parte de la fecha (YYYY-MM-DD) si vienen con timestamp
      const dateMatch = value.match(/(\d{4}-\d{2}-\d{2})/);
      const result = dateMatch ? dateMatch[1] : value.trim();
      return result;
    }
  }

  return null;
};

/**
 * Extrae la fecha de fin del período desde un objeto con múltiples claves posibles
 * Normaliza el formato a YYYY-MM-DD (elimina timestamp si existe)
 * @param {object} rawItem - Objeto del período desde la API
 * @returns {string|null} Fecha de fin (YYYY-MM-DD) o null
 */
/**
 * Extrae la fecha de fin del período desde un objeto con múltiples claves posibles
 * Normaliza el formato a YYYY-MM-DD (elimina timestamp si existe)
 * NOTA: Las API pueden devolver claves con espacios ("fechaFinal " vs "fechaFinal")
 * @param {object} rawItem - Objeto del período desde la API
 * @returns {string|null} Fecha de fin (YYYY-MM-DD) o null
 */
const getPeriodEndDate = (rawItem) => {
  if (!rawItem || typeof rawItem !== "object") return null;

  // Normalizar objetos: eliminar espacios de las claves para buscar más robustamente
  const normalizedObj = {};
  for (const [key, value] of Object.entries(rawItem)) {
    normalizedObj[key.trim()] = value;
  }

  for (const key of PERIOD_END_DATE_KEYS) {
    const value = normalizedObj[key] || normalizedObj[key.trim()];
    if (typeof value === "string" && value.trim()) {
      // Extraer solo la parte de la fecha (YYYY-MM-DD) si vienen con timestamp
      const dateMatch = value.match(/(\d{4}-\d{2}-\d{2})/);
      const result = dateMatch ? dateMatch[1] : value.trim();
      return result;
    }
  }

  return null;
};

/**
 * Obtiene y normaliza períodos académicos desde la API
 * @returns {Promise<Array>} Array de objetos { id, nombre, start_date, end_date } para filtrado e información de rangos
 */
export const fetchAcademicPeriods = async () => {
  const endpoint = import.meta.env.VITE_API_URL_ACADEMIC_PERIODS;

  if (!endpoint) {
    console.warn("VITE_API_URL_ACADEMIC_PERIODS no configurado");
    return [];
  }

  try {
    const response = await fetch(endpoint);
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

    // Normalizar cada período a { id, nombre, start_date, end_date }
    const periods = rawItems
      .map((item) => {
        const nombre = getPeriodName(item);
        const id = getPeriodId(item);
        const start_date = getPeriodStartDate(item);
        const end_date = getPeriodEndDate(item);
        
        if (!nombre) return null;
        
        return {
          id: id || nombre, // Usar ID si existe, sino usar nombre como fallback
          nombre: nombre,
          start_date: start_date, // Fecha de inicio del período (YYYY-MM-DD)
          end_date: end_date      // Fecha de fin del período (YYYY-MM-DD)
        };
      })
      .filter(Boolean)
      // Eliminar duplicados por ID
      .filter((period, index, self) => 
        index === self.findIndex(p => p.id === period.id)
      );

    console.log("Períodos académicos cargados:", periods);
    return periods;
  } catch (error) {
    console.error("Error al cargar períodos académicos:", error);
    return [];
  }
};