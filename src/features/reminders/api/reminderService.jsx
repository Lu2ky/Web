// ============================================================================
// ReminderService
// ============================================================================
// API plana (sin hooks) para recordatorios. Traduce el modelo de la UI al
// contrato real de `apps/api-go` y normaliza las respuestas.
//
// Contrato:
//   POST /reminders                  -> { message, toDoId, reminderId }
//   POST /reminders/update           -> { message, reminderId }
//   POST /reminders/delete-or-recover-> { message, rowsAffected }
//   POST /reminders/delete/multiple  -> { message, rowsAffected }
//   GET  /reminders/users/:id
//   GET  /reminders/users/:id/tags
// ============================================================================

import { apiClient } from "../../../shared/api/apiClient";
import { getSessionCodUsuario } from "../../../shared/session/authSession";
import { toMysqlDateTime } from "../../../shared/lib/dates";

const PRIORITY_TO_DB = { alta: 1, media: 2, baja: 3 };
const PRIORITY_FROM_DB = { 1: "alta", 2: "media", 3: "baja" };

// Se mantiene el re-export: los consumidores y tests importan el helper desde
// este módulo desde F1.
export { toMysqlDateTime };

/** Prioridad de UI/API ("alta", 1, "Alta") al id de la tabla Prioridad. */
export function toDbPriority(priority) {
  const normalized = String(priority ?? "").trim().toLowerCase();
  if (PRIORITY_TO_DB[normalized]) return PRIORITY_TO_DB[normalized];

  const numeric = Number(normalized);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 3) return numeric;

  return PRIORITY_TO_DB.media;
}

/** Prioridad de la API ("Alta", 1) al valor de UI ("alta"). */
export function toUiPriority(priority) {
  const normalized = String(priority ?? "").trim().toLowerCase();
  if (PRIORITY_FROM_DB[normalized]) return PRIORITY_FROM_DB[normalized];
  if (["alta", "media", "baja"].includes(normalized)) return normalized;
  return "media";
}

function tagLabelsFrom(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => (typeof tag === "string" ? tag : tag?.label ?? tag?.nombre ?? tag?.name ?? ""))
    .map((label) => String(label).trim())
    .filter(Boolean)
    .slice(0, 5);
}

function tagsPayload(labels) {
  return {
    P_tag1: labels[0] ?? null,
    P_tag2: labels[1] ?? null,
    P_tag3: labels[2] ?? null,
    P_tag4: labels[3] ?? null,
    P_tag5: labels[4] ?? null,
  };
}

function groupTagsByReminder(rows) {
  const map = new Map();
  if (!Array.isArray(rows)) return map;

  for (const row of rows) {
    if (!row || row.T_tag_nombre == null) continue;
    if (row.B_tag_isDeleted === true || row.B_tag_isDeleted === 1) continue;

    const key = row.N_idRecordatorio;
    if (!map.has(key)) map.set(key, []);
    const label = String(row.T_tag_nombre).trim();
    if (label && !map.get(key).includes(label)) map.get(key).push(label);
  }

  return map;
}

/**
 * Wrapper del recordatorio normalizado que consumen los componentes.
 */
export class ReminderService {
  static getNullableString(value) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      if ("Valid" in value && value.Valid === false) return "";
      if (typeof value.String === "string") return value.String;
      if (typeof value.value === "string") return value.value;
    }
    return String(value);
  }

  /** Normaliza una fila de `RecordatoriosUsuarios`/`RecordatoriosCompletos`. */
  static normalizeReminder(reminder = {}) {
    const idTodo = reminder.N_idToDoList ?? reminder.idTodo ?? reminder.id ?? null;
    const recordatorioId = reminder.N_idRecordatorio ?? reminder.recordatorioId ?? null;

    return {
      id: idTodo ?? recordatorioId,
      idTodo,
      recordatorioId,
      usuarioId: reminder.N_idUsuario ?? reminder.usuarioId ?? null,
      name: this.getNullableString(reminder.T_nombre ?? reminder.name),
      description: this.getNullableString(reminder.T_descripcion ?? reminder.T_descripción ?? reminder.description),
      dueDate: this.getNullableString(reminder.Dt_fechaVencimiento ?? reminder.dueDate),
      priority: toUiPriority(reminder.T_Prioridad ?? reminder.priority),
      state: Boolean(reminder.B_estado ?? reminder.state ?? false),
      completed: Boolean(reminder.B_estado ?? reminder.completed ?? false),
      tags: Array.isArray(reminder.tags) ? reminder.tags : [],
      isDeleted: Boolean(reminder.B_isDeleted ?? reminder.isDeleted ?? false),
      raw: reminder,
    };
  }

  static normalizeReminders(reminders) {
    if (!Array.isArray(reminders)) return [];
    return reminders.map((reminder) => this.normalizeReminder(reminder));
  }

  static validateReminderPayload({ name, dueDate, priority }) {
    const errors = [];
    if (!name || !String(name).trim()) errors.push("El nombre es obligatorio");
    if (!dueDate) errors.push("La fecha de vencimiento es obligatoria");
    if (!priority) errors.push("La prioridad es obligatoria");
    return { valid: errors.length === 0, errors };
  }

  /** Carga recordatorios + etiquetas y las agrupa por `recordatorioId`. */
  static async getByUser(userId) {
    if (!userId) return [];

    const path = `/reminders/users/${encodeURIComponent(userId)}`;
    const [reminders, tagRows] = await Promise.all([
      apiClient.get(path),
      apiClient.get(`${path}/tags`).catch(() => []),
    ]);

    const tagsByReminder = groupTagsByReminder(tagRows);

    // El backend hace borrado lógico (`B_isDeleted`). La vista sigue devolviendo
    // esas filas, así que el filtro debe aplicarse aquí para que un recordatorio
    // eliminado no reaparezca al recargar.
    return this.normalizeReminders(reminders)
      .filter((reminder) => !reminder.isDeleted)
      .map((reminder) => ({
        ...reminder,
        tags: tagsByReminder.get(reminder.recordatorioId) ?? [],
      }));
  }

  /**
   * Crea un recordatorio.
   * @param {number|string} userId id numérico interno (P_usuario)
   * @param {string} name
   * @param {string} description
   * @param {Date|string} dueDate
   * @param {string|number} priority
   * @param {Array} tags
   * @param {string} [codigoUsuario] código que valida AuthorityCheck
   */
  static async addReminder(userId, name, description, dueDate, priority, tags = [], codigoUsuario = null) {
    const labels = tagLabelsFrom(tags);
    const estado = false; // false = pendiente, true = completado

    return apiClient.post("/api/reminders", {
      P_usuario: Number(userId),
      P_nombre: String(name ?? "").trim(),
      P_descripcion: String(description ?? ""),
      F_fecha: toMysqlDateTime(dueDate),
      N_idPrioridad: toDbPriority(priority),
      B_estado: estado,
      ...tagsPayload(labels),
      codUsuario: codigoUsuario || getSessionCodUsuario(),
    });
  }

  static buildUpdatePayload(userId, task = {}, overrides = {}) {
    const merged = { ...task, ...overrides };
    const labels = tagLabelsFrom(merged.tags);

    return {
      P_usuario: Number(userId ?? merged.usuarioId ?? 0),
      P_idToDo: Number(merged.idTodo ?? merged.id),
      P_nombre: String(merged.name ?? "").trim(),
      P_descripcion: String(merged.description ?? ""),
      F_fecha: toMysqlDateTime(merged.dueDate),
      N_idPrioridad: toDbPriority(merged.priority),
      B_estado: Boolean(merged.state ?? merged.completed ?? false),
      ...tagsPayload(labels),
      codUsuario: getSessionCodUsuario(),
    };
  }

  /** Actualiza un recordatorio completo (el backend reemplaza todos los campos). */
  static async updateFromEdit(taskToEdit, updatedTask) {
    const userId = taskToEdit?.usuarioId ?? updatedTask?.usuarioId;
    return apiClient.post("/api/reminders/update", this.buildUpdatePayload(userId, taskToEdit, updatedTask));
  }

  /** Cambia solo el estado, reenviando el resto del recordatorio sin cambios. */
  static async updateState(reminderIdOrTask, completed, task = null) {
    const taskData = task && typeof task === "object" ? task : {};
    const idTodo = taskData.idTodo
      ?? taskData.id
      ?? (typeof reminderIdOrTask === "object" ? reminderIdOrTask?.idTodo ?? reminderIdOrTask?.id : reminderIdOrTask);

    return apiClient.post(
      "/api/reminders/update",
      this.buildUpdatePayload(taskData.usuarioId, taskData, { idTodo, completed, state: completed })
    );
  }

  /** Envía a la papelera un recordatorio por `N_idRecordatorio`. */
  static async deleteReminder(recordatorioId, userId) {
    return apiClient.post("/api/reminders/delete-or-recover", {
      N_idRecordatorio: Number(recordatorioId),
      P_usuario: Number(userId),
      codUsuario: getSessionCodUsuario(),
    });
  }

  /** Elimina varios recordatorios por sus `N_idRecordatorio`. */
  static async deleteMultipleReminders(userId, recordatorioIds = []) {
    const ids = recordatorioIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (ids.length === 0) return null;

    return apiClient.post("/api/reminders/delete/multiple", {
      N_idRecordatorios: ids.join(","),
      P_usuario: Number(userId),
      codUsuario: getSessionCodUsuario(),
    });
  }

  /** Duplica un recordatorio existente. */
  static async duplicateReminder(userId, taskToDuplicate, codigoUsuario = null) {
    if (!userId || !taskToDuplicate) return null;

    return this.addReminder(
      userId,
      `${taskToDuplicate.name ?? ""} (copia)`,
      taskToDuplicate.description,
      taskToDuplicate.dueDate,
      taskToDuplicate.priority,
      taskToDuplicate.tags,
      codigoUsuario
    );
  }
}

export default ReminderService;
