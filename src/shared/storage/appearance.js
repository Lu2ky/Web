/**
 * Persistencia y aplicación de las preferencias de apariencia.
 *
 * Es la única puerta de entrada a `localStorage` para tema y tamaño de letra.
 * El script anti-FOUC de `index.html` replica esta misma clave y formato para
 * aplicar los valores antes del primer pintado.
 */

export const APPEARANCE_STORAGE_KEY = "upb:appearance";

export const THEME_MODES = ["light", "dark", "auto"];
export const FONT_SIZES = ["sm", "md", "lg"];

export const DEFAULT_APPEARANCE = Object.freeze({
  theme: "auto",
  fontSize: "md",
});

const DARK_QUERY = "(prefers-color-scheme: dark)";

function isThemeMode(value) {
  return THEME_MODES.includes(value);
}

function isFontSize(value) {
  return FONT_SIZES.includes(value);
}

/** Normaliza cualquier entrada a una preferencia válida. */
export function normalizeAppearance(value) {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_APPEARANCE };
  }

  return {
    theme: isThemeMode(value.theme) ? value.theme : DEFAULT_APPEARANCE.theme,
    fontSize: isFontSize(value.fontSize) ? value.fontSize : DEFAULT_APPEARANCE.fontSize,
  };
}

/** Lee la preferencia guardada. Nunca lanza. */
export function readAppearance() {
  try {
    const raw = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_APPEARANCE };
    return normalizeAppearance(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}

/** Guarda la preferencia. Nunca lanza. */
export function writeAppearance(appearance) {
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(normalizeAppearance(appearance)));
  } catch {
    // Almacenamiento no disponible (modo privado, cuota): se ignora.
  }
}

export function getSystemTheme() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function resolveTheme(themeMode, systemTheme = getSystemTheme()) {
  return themeMode === "auto" ? systemTheme : themeMode;
}

/** Escribe el tema resuelto y la escala de letra en `<html>`. */
export function applyAppearance(appearance, systemTheme) {
  if (typeof document === "undefined") return;
  const normalized = normalizeAppearance(appearance);
  const resolved = resolveTheme(normalized.theme, systemTheme);
  const root = document.documentElement;

  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-font-size", normalized.fontSize);
  root.style.colorScheme = resolved;
}

/** Suscripción a cambios del tema del sistema (para `useSyncExternalStore`). */
export function subscribeToSystemTheme(callback) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }

  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
