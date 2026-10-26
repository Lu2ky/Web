import { apiClient } from "../../../shared/api/apiClient";

// Respaldo estático: el selector de categorías debe seguir funcionando aunque
// el endpoint falle. Se registra el error para no ocultarlo por completo.
const FALLBACK_CATEGORIES = [
  "Teoría",
  "Laboratorio",
  "Cultural",
  "Deportiva",
  "Centro de lenguas",
  "Pastoral",
  "Personal",
];

let cachedCategories = null;

function mapCourseTypes(payload) {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

  const names = rows
    .filter((row) => row?.B_isDeleted !== true)
    .map((row) => row?.T_nombre ?? row?.nombre ?? row?.name ?? row)
    .map((name) => String(name ?? "").trim())
    .filter(Boolean);

  return names.length > 0 ? names : FALLBACK_CATEGORIES;
}

/** Tipos de curso (`GET /course-types`) como lista de nombres. */
export async function getCategories() {
  if (cachedCategories) {
    return cachedCategories;
  }

  try {
    const payload = await apiClient.get("/course-types");
    cachedCategories = mapCourseTypes(payload);
    return cachedCategories;
  } catch (error) {
    console.error("Error al cargar categorías:", error?.message || error);
    cachedCategories = FALLBACK_CATEGORIES;
    return cachedCategories;
  }
}

/** Limpia la caché en memoria (útil en tests o al cerrar sesión). */
export function clearCategoriesCache() {
  cachedCategories = null;
}
