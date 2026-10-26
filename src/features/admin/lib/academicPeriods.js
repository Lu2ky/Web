/** Utilidades de presentación de periodos académicos. */

/** `YYYY-MM-DD...` -> `DD/MM/YYYY`; deja intacto lo que no coincida. */
export function formatAcademicPeriodDate(rawDate) {
  const safeDate = String(rawDate || "").trim();
  if (!safeDate) return "Sin fecha";

  const match = safeDate.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return safeDate;

  return `${match[3]}/${match[2]}/${match[1]}`;
}

const isDebugEnabled = () => Boolean(import.meta.env.DEV);

export const logAcademicPeriodsDebug = (...args) => {
  if (!isDebugEnabled()) return;
  console.log("[AcademicPeriodsUI]", ...args);
};

export const logAcademicPeriodsWarn = (...args) => {
  if (!isDebugEnabled()) return;
  console.warn("[AcademicPeriodsUI]", ...args);
};
