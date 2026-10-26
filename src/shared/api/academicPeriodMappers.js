/**
 * Normalización de las filas de períodos académicos.
 *
 * La API ha devuelto históricamente distintas claves para el mismo dato; aquí
 * se concentra ese conocimiento para que el servicio y la UI solo vean
 * `{ id, nombre, start_date, end_date }`.
 */

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
  "description",
];

const PERIOD_ID_KEYS = [
  "idPeriodoAcademico",
  "id",
  "idPeriodo",
  "periodo_id",
  "academicPeriodId",
  "academic_period_id",
  "periodId",
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
  "begin_date",
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
  "close_date",
];

const getPeriodName = (rawItem) => {
  if (typeof rawItem === "string") return rawItem.trim();
  if (!rawItem || typeof rawItem !== "object") return "";

  for (const key of PERIOD_NAME_KEYS) {
    const value = rawItem[key];
    if (typeof value === "string" && value.trim()) return value.trim();
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

const getPeriodDate = (rawItem, keys) => {
  if (!rawItem || typeof rawItem !== "object") return null;

  const normalizedObj = getNormalizedObject(rawItem);
  for (const key of keys) {
    const value = normalizedObj[key] || normalizedObj[key.trim()];
    const extracted = extractDate(value);
    if (extracted) return extracted;
  }

  return null;
};

export const getPeriodStartDate = (rawItem) =>
  getPeriodDate(rawItem, PERIOD_START_DATE_KEYS);

export const getPeriodEndDate = (rawItem) =>
  getPeriodDate(rawItem, PERIOD_END_DATE_KEYS);

const isDeletedPeriod = (item) => {
  const value = item?.isDeleted;
  if (value === true || value === 1 || value === "1") return true;
  if (value && typeof value === "object") return value.Bool === true;
  return false;
};

/** Convierte una fila cruda a `{ id, nombre, start_date, end_date }`. */
export function mapAcademicPeriodRow(rawItem) {
  if (isDeletedPeriod(rawItem)) return null;

  const nombre = getPeriodName(rawItem);
  if (!nombre) return null;

  return {
    id: getPeriodId(rawItem) || nombre,
    nombre,
    start_date: getPeriodStartDate(rawItem),
    end_date: getPeriodEndDate(rawItem),
  };
}

/** Normaliza la lista y elimina duplicados por id. */
export function mapAcademicPeriods(rawItems) {
  const items = Array.isArray(rawItems) ? rawItems : [];

  return items
    .map(mapAcademicPeriodRow)
    .filter(Boolean)
    .filter((period, index, self) => index === self.findIndex((p) => p.id === period.id));
}
