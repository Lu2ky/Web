// ============================================================================
// Servicio de Gestión de Colores y Paletas
// ============================================================================
// Contrato real de `apps/api-go`:
//   POST /palette/get  { userId }  -> { userId, palette } | 401 si no hay paleta
//   POST /palette      { userId, palette }
// `Palette.userId` es string en el backend: se envía siempre como cadena.
// ============================================================================

import { apiClient } from "../../../shared/api/apiClient";

function unwrapPalette(data) {
  if (data === null || data === undefined) return null;
  if (typeof data === "string") return data;

  const fromBody = data?.palette ?? data?.data?.palette;
  if (fromBody !== undefined && fromBody !== null) return fromBody;

  return null;
}

/**
 * Obtiene la paleta guardada del usuario.
 * @returns {Promise<string|object|null>} null si no hay paleta o la API falla.
 */
export async function getColorPalette(userId) {
  if (!userId) return null;

  try {
    const data = await apiClient.post("/palette/get", { userId: String(userId) });
    return unwrapPalette(data) ?? data;
  } catch (error) {
    // 401 = el usuario aún no tiene paleta guardada (clave ausente en Redis).
    if (error?.status !== 401) {
      console.error("Error fetching color palette:", error?.message || error);
    }
    return null;
  }
}

/**
 * Guarda la paleta del usuario.
 * @returns {Promise<object|null>}
 */
export async function saveColorPalette(userId, paletteName) {
  if (!userId || !paletteName) return null;

  try {
    return await apiClient.post("/palette", {
      userId: String(userId),
      palette: String(paletteName),
    });
  } catch (error) {
    console.error("Error saving color palette:", error?.message || error);
    return null;
  }
}
