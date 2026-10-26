// ============================================================================
// NotificationService
// ============================================================================
// API plana (sin hooks) para notificaciones. Contrato real de `apps/api-go`:
//   GET  /notifications/users/:id
//   POST /notifications          { nombre, descripcion, fechaEmision, idToDoList, N_idUsuario, codUsuario }
//   POST /notifications/delete   { ids: "1,2", N_idUsuario, codUsuario }
//   POST /notifications/mute     { idUsuario, correo?, antelacionNotis?, codUsuario }
// ============================================================================

import { apiClient } from "./apiClient";
import { toMysqlDateTime } from "../lib/dates";
import { getSessionCodUsuario } from "../session/authSession";

const isRead = (estado) => estado === true || estado === 1 || estado === "1";

export class NotificationService {
  static normalizeNotification(notification = {}) {
    const id = notification.idNotificacion
      ?? notification.N_idNotificacion
      ?? notification.id
      ?? notification.notificationId;

    const name = notification.nombre ?? notification.T_nombre ?? "";
    const description = notification.descripcion ?? notification.T_descripcion ?? "";
    const emittedAt = notification.fechaEmision ?? notification.Dt_fechaEmision ?? "";
    const read = isRead(notification.estado ?? notification.B_estado ?? notification.read);

    return {
      id,
      N_idNotificacion: id,
      name,
      nombre: name,
      description,
      descripcion: description,
      fechaEmision: emittedAt,
      dueDate: emittedAt,
      estado: read ? "1" : "0",
      read,
      recordatorioId: notification.idRecordatorio ?? notification.N_idRecordatorio ?? null,
      usuarioId: notification.idUsuario ?? notification.N_idUsuario ?? null,
      raw: notification,
    };
  }

  static normalizeNotifications(notifications) {
    if (!Array.isArray(notifications)) return [];
    return notifications.map((notification) => this.normalizeNotification(notification));
  }

  static async getNotifications(userId) {
    if (!userId) return [];
    const data = await apiClient.get(`/notifications/users/${encodeURIComponent(userId)}`);
    return this.normalizeNotifications(data);
  }

  /** Marca como leídas las notificaciones indicadas (las elimina de la campana). */
  static async acknowledgeNotifications(notificationIds, userId) {
    const ids = (Array.isArray(notificationIds) ? notificationIds : [notificationIds])
      .map((id) => String(id ?? "").trim())
      .filter(Boolean);

    if (ids.length === 0) return null;

    return apiClient.post("/notifications/delete", {
      ids: ids.join(","),
      N_idUsuario: Number(userId),
      codUsuario: getSessionCodUsuario(),
    });
  }

  /** Crea una notificación asociada a un recordatorio. */
  static async addNotification(data = {}) {
    const emittedAt = data.fechaEmision ?? data.issueDate ?? new Date();
    return apiClient.post("/notifications", {
      nombre: data.nombre ?? data.name ?? "",
      descripcion: data.descripcion ?? data.description ?? "",
      // Go inserta el valor tal cual en una columna DATETIME: el ISO con `T`/`Z`
      // provoca `Incorrect datetime value`.
      fechaEmision: toMysqlDateTime(emittedAt) ?? toMysqlDateTime(new Date()),
      idToDoList: Number(data.idToDoList ?? data.todoId),
      N_idUsuario: Number(data.N_idUsuario ?? data.userId),
      codUsuario: data.codUsuario ?? getSessionCodUsuario(),
    });
  }

  /** Actualiza correo y/o antelación de notificaciones. */
  static async muteNotifications({ idUsuario, correo = null, antelacionNotis = null }) {
    return apiClient.post("/notifications/mute", {
      idUsuario: Number(idUsuario),
      correo,
      antelacionNotis,
      codUsuario: getSessionCodUsuario(),
    });
  }
}

export const getNotifications = (userId) => NotificationService.getNotifications(userId);
export const acknowledgeNotifications = (notificationIds, userId) =>
  NotificationService.acknowledgeNotifications(notificationIds, userId);
export const addNotification = (data) => NotificationService.addNotification(data);

export default NotificationService;
