/**
 * Extracción del identificador de una notificación.
 *
 * El backend y los mocks históricos usan nombres distintos; la UI necesita un
 * id estable para keys, borrado y marcado como leída.
 */

export function getNotificationId(notification) {
  if (!notification || typeof notification !== "object") return "";

  const directCandidates = [
    notification.id,
    notification._id,
    notification.notificationId,
    notification.IdNotificacion,
  ];

  for (const candidate of directCandidates) {
    if (candidate !== null && candidate !== undefined && String(candidate).trim() !== "") {
      return String(candidate).trim();
    }
  }

  for (const [key, value] of Object.entries(notification)) {
    if (
      value !== null &&
      value !== undefined &&
      /id/i.test(key) &&
      /(noti|notif|notification)/i.test(key) &&
      String(value).trim() !== ""
    ) {
      return String(value).trim();
    }
  }

  return "";
}

export default getNotificationId;
