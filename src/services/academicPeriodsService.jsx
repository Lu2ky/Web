
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
  "id",
  "idPeriodo",
  "periodo_id",
  "academicPeriodId",
  "academic_period_id",
  "periodId"
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
 * Obtiene y normaliza períodos académicos desde la API
 * @returns {Promise<Array>} Array de objetos { id, nombre } para filtrado
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

    // Normalizar cada período a { id, nombre }
    const periods = rawItems
      .map((item) => {
        const nombre = getPeriodName(item);
        const id = getPeriodId(item);
        
        if (!nombre) return null;
        
        return {
          id: id || nombre, // Usar ID si existe, sino usar nombre como fallback
          nombre: nombre
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