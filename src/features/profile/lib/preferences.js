/** Utilidades de preferencias del usuario. */

/** Convierte `antelacionNotis`/`tiempoMute` a minutos. */
export function parseAnticipationMinutes(userData) {
  const rawValue =
    userData?.antelacionNotis ?? userData?.tiempoMute ?? userData?.anticipationTime;

  if (!rawValue) return 0;

  if (typeof rawValue === "string" && rawValue.includes(":")) {
    const parts = rawValue.split(":");
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }

  if (typeof rawValue === "object") {
    const hours = parseInt(rawValue.hours ?? rawValue.horas ?? 0, 10) || 0;
    const minutes = parseInt(rawValue.minutes ?? rawValue.minutos ?? 0, 10) || 0;
    return hours * 60 + minutes;
  }

  if (typeof rawValue === "number") return rawValue;

  return 0;
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getCurrentEmail(userData) {
  return userData?.email || userData?.correo || "";
}

export function formatAnticipation(hours, minutes) {
  if (!hours && !minutes) return "Sin recordatorio";
  return `${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m ` : ""}`.trim();
}
