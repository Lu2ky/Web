/**
 * Conversión entre el texto de fecha/hora de la UI y el valor que espera la API.
 *
 * La API trabaja con `YYYY-MM-DD HH:mm:ss`; el usuario ve `DD/MM/YYYY` y `HH:mm`.
 */

/** Convierte un valor de la API a `Date` sin desplazamientos de zona. */
export function stringToDate(dateValue) {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;

  const raw = String(dateValue).trim();
  if (!raw) return new Date();

  const yyyyMmDd = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyyMmDd) {
    const year = Number(yyyyMmDd[1]);
    const month = Number(yyyyMmDd[2]) - 1;
    const day = Number(yyyyMmDd[3]);
    return new Date(year, month, day);
  }

  const dateTime = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (dateTime) {
    const year = Number(dateTime[1]);
    const month = Number(dateTime[2]) - 1;
    const day = Number(dateTime[3]);
    const hour = Number(dateTime[4]);
    const minute = Number(dateTime[5]);
    const second = Number(dateTime[6] || 0);
    return new Date(year, month, day, hour, minute, second);
  }

  const parsed = new Date(raw.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function parseDDMMYYYY(str) {
  if (!str) return null;
  const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]);
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/** Extrae `HH:mm` de un valor de la API. */
export function getTimePart(dateValue) {
  if (!dateValue) return "";

  if (typeof dateValue === "string") {
    const raw = dateValue.trim();
    const dateTime = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?$/);
    if (dateTime) return `${dateTime[4]}:${dateTime[5]}`;
  }

  const parsed = stringToDate(dateValue);
  if (Number.isNaN(parsed.getTime())) return "";

  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** Compone `YYYY-MM-DD HH:mm:ss`; sin hora usa medianoche. */
export function buildDueDate(datePart, timePart) {
  if (!datePart) return "";
  if (!timePart) return `${datePart} 00:00:00`;
  return `${datePart} ${timePart}:00`;
}
