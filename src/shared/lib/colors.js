/** Utilidades de color compartidas por calendario y controles. */

/** Devuelve negro o blanco según el contraste con el fondo indicado. */
export function getContrastColor(hex) {
  if (!hex) return '#000000';
  const normalized = String(hex).trim();
  const match = normalized.match(/^#([0-9a-f]{6})$/i);
  if (!match) return '#000000';

  const value = match[1];
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export default getContrastColor;
