/**
 * Caché local del tema elegido por usuario.
 *
 * Es solo una copia para pintar antes de que responda la API; la fuente de
 * verdad sigue siendo el backend. Los errores de almacenamiento se ignoran.
 */

const THEME_CACHE_PREFIX = "theme-palette-cache";

function getCacheKey(userId) {
  return `${THEME_CACHE_PREFIX}:${userId || "anonymous"}`;
}

/** Devuelve el valor crudo cacheado o `null` si no hay nada usable. */
export function readThemeCache(userId) {
  try {
    return localStorage.getItem(getCacheKey(userId));
  } catch {
    return null;
  }
}

export function writeThemeCache(userId, themeId) {
  if (!themeId) return;
  try {
    localStorage.setItem(getCacheKey(userId), themeId);
  } catch {
    // Ignorar errores de almacenamiento local.
  }
}
