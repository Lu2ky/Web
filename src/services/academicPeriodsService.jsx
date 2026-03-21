const PERIOD_KEYS = [
  "nombre",
  "academicPeriod",
  "academic_period",
  "periodoAcademico",
  "periodo_academico",
  "period",
  "name",
  "label"
];

const normalizePeriodValue = (rawItem) => {
  if (typeof rawItem === "string") return rawItem.trim();
  if (!rawItem || typeof rawItem !== "object") return "";

  for (const key of PERIOD_KEYS) {
    const value = rawItem[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

export const fetchAcademicPeriods = async () => {
  const endpoint = import.meta.env.VITE_API_URL_ACADEMIC_PERIODS;

  if (!endpoint) {
    return [];
  }

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Error fetching academic periods: ${response.status}`);
  }

  const payload = await response.json();
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

  const unique = [...new Set(rawItems.map(normalizePeriodValue).filter(Boolean))];
  return unique;
};
