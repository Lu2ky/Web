// ============================================================================
// Utilidades de fecha
// ============================================================================
// MySQL `DATETIME` no acepta el formato ISO completo (`2026-10-26T02:00:06Z`)
// que genera `Date#toISOString`. Estas funciones convierten cualquier entrada
// razonable a `YYYY-MM-DD HH:mm:ss` en hora local.
// ============================================================================

const pad = (value) => String(value).padStart(2, "0");

/**
 * Convierte Date | ISO | "YYYY-MM-DD HH:mm:ss" al DATETIME de MySQL.
 * @param {Date|string|number|null|undefined} value
 * @returns {string|null}
 */
export function toMysqlDateTime(value) {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }

  const raw = String(value).trim();
  const mysql = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (mysql) {
    const [, year, month, day, hour = "00", minute = "00", second = "00"] = mysql;
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return toMysqlDateTime(parsed);
}

export default toMysqlDateTime;
