// ============================================================================
// Servicio de Recordatorios (Reminders)
// ============================================================================
// Gestiona operaciones CRUD para recordatorios/tareas pendientes.
// Proporciona normalización de datos desde múltiples formatos de API,
// validación de estados, conversión de fechas y sincronización con API.
// ============================================================================

// Variables de entorno para endpoints API (cargadas dinámicamente)
const REMINDERS_TAGS_API_BASE = import.meta.env.VITE_API_URL_REMINDERS_TAGS_USER;
const ADD_REMINDER_ENDPOINT = import.meta.env.VITE_API_ADD_REMINDER;
const DELETE_REMINDER_ENDPOINT = import.meta.env.VITE_API_DELETE_REMINDER;
const DELETE_MULTIPLE_REMINDERS_ENDPOINT = import.meta.env.VITE_API_DELETE_MULTIPLE_REMINDERS;
const UPDATE_REMINDER_UNIFIED_ENDPOINT = import.meta.env.VITE_API_UPDATE_REMINDER_UNIFIED;
// DEPRECATED: Los siguientes endpoints se reemplazan por UPDATE_REMINDER_UNIFIED_ENDPOINT
const UPDATE_NAME_ENDPOINT = import.meta.env.VITE_API_UPDATE_REMINDER;
const UPDATE_DESC_ENDPOINT = import.meta.env.VITE_API_UPDATE_DESCRIPTION_REMINDER;
const UPDATE_DATE_ENDPOINT = import.meta.env.VITE_API_UPDATE_DATE_REMINDER;
const UPDATE_PRIORITY_ENDPOINT = import.meta.env.VITE_API_UPDATE_PRIORITY_REMINDER;
const UPDATE_STATE_ENDPOINT = import.meta.env.VITE_API_UPDATE_STATE_REMINDER;
const UPDATE_TAGS_ENDPOINT = import.meta.env.VITE_API_UPDATE_TAGS_REMINDER;

class ReminderService {
	static async postUpdate(endpoint, payload, errorContext) {


		const response = await fetch(endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		const responseText = await response.text();

		if (!response.ok) {
			const suffix = responseText ? ` - ${responseText}` : "";
			throw new Error(`${errorContext}: ${response.status}${suffix}`);
		}

		// Parsear y devolver el JSON, no el objeto Response
		try {
			return JSON.parse(responseText);
		} catch (e) {
			console.warn(`[ReminderService] Could not parse JSON response:`, e);
			return { success: response.ok, responseText };
		}
	}

	// Crea una copia de un recordatorio existente con nombre modificado
	static async duplicateReminder(userId, taskToDuplicate, codigoUsuario = null) {
		if (!userId || !taskToDuplicate) return null;

		// extraer solo las etiquetas relevantes (ignorando tags sintéticos de prioridad)
		const tagLabels = Array.isArray(taskToDuplicate.tags)
			? taskToDuplicate.tags
				.map(t => typeof t === 'string' ? t : t.label || "")
				.filter(Boolean)
			: [];

		return this.addReminder(
			userId,
			`${taskToDuplicate.name} (copia)`,
			taskToDuplicate.description,
			taskToDuplicate.dueDate,
			taskToDuplicate.priority,
			tagLabels,
			codigoUsuario
		);
	}


	// Extrae string seguro de valores nulos o estructuras complejas de API
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

	// Convierte valor a booleano desde múltiples formatos (bool, número, string, objeto)
	static getBoolean(value) {
		if (typeof value === "boolean") return value;
		if (typeof value === "number") return value === 1;
		if (typeof value === "string") {
			const normalized = value.toLowerCase();
			return normalized === "true" || normalized === "1";
		}
		if (value && typeof value === "object") {
			if ("Valid" in value && value.Valid === false) return false;
			if ("Bool" in value) return Boolean(value.Bool);
		}
		return false;
	}

	// Normaliza prioridad a formato estándar (alta, media, baja)
	// Acepta números, texto en español e inglés
	static normalizePriority(value) {
		const normalized = String(value ?? "").trim().toLowerCase();
		if (normalized === "1" || normalized === "high" || normalized === "alta") return "alta";
		if (normalized === "2" || normalized === "medium" || normalized === "media") return "media";
		if (normalized === "3" || normalized === "low" || normalized === "baja") return "baja";
		return "";
	}

	static priorityToNumber(value) {
		const normalized = this.normalizePriority(value);
		if (normalized === "alta") return 1;
		if (normalized === "media") return 2;
		if (normalized === "baja") return 3;
		return null;
	}

	// Normaliza un recordatorio desde formato API al formato estándar interno
	// Maneja múltiples variantes de nombres de campo de diferentes endpoints
	static normalizeReminder(reminder, index) {
		const priority = this.normalizePriority(
			this.getNullableString(
				reminder.T_Prioridad ?? 
				reminder.P_prioridad ?? 
				reminder.priority ?? 
				reminder.level ?? 
				reminder.importance
			)
		);

		const sourceTags = Array.isArray(reminder.tags)
			? reminder.tags
			: Array.isArray(reminder.tag)
				? reminder.tag
				: [];

		const tags = sourceTags.map(tag => {
			if (typeof tag === "string") {
				return { label: tag, type: "custom" };
			}
			return {
				label: tag.tag_nombre ?? tag.label ?? tag.name ?? "",
				type: tag.type ?? "custom",
				...(tag.tag_id != null ? { id: tag.tag_id } : {}),
			};
		});

		if (priority) {
			const priorityType =
				priority === "alta"
					? "priority-high"
					: priority === "media"
						? "priority-medium"
						: "priority-low";

			// Evitar duplicados: omitir si la API ya envió una etiqueta con esta etiqueta
			const hasPriorityTag = tags.some(
				tag => tag.type === priorityType || tag.label?.toLowerCase() === priority
			);
			if (!hasPriorityTag) {
				tags.push({ label: priority, type: priorityType });
			}
		}

		// Sólo leer campos explícitamente relacionados con el estado de completado.
		// Se excluye reminder.status deliberadamente: ese campo suele contener
		// códigos numéricos de tipo/estado (ej. 1 = activo) que no indican
		// "completado" y provocan falsos positivos al comparar rawCompleted === 1.
		// B_estado es la bandera canónica de completado para este endpoint
		const rawCompleted =
			reminder.B_estado ??
			reminder.B_completed ??
			reminder.completed ??
			reminder.done ??
			reminder.isDone;

		const completed =
			rawCompleted === true ||
			rawCompleted === 1 ||
			String(rawCompleted).toLowerCase() === "true" ||
			String(rawCompleted).toLowerCase() === "completed";

		return {
			id:
				reminder.N_idToDoList ??
				reminder.idToDoList ??
				reminder.P_idToDo ??
				reminder.idToDo ??
				reminder.N_idToDo ??
				reminder.N_idRecordatorio ??
				reminder.id ??
				reminder._id ??
				reminder.reminder_id ??
				`reminder-${index}`,
			// N_idRecordatorio es la PK que espera el endpoint de eliminación
			recordatorioId: reminder.N_idRecordatorio ?? null,
			name: this.getNullableString(
				reminder.T_nombre ?? 
				reminder.P_nombre ?? 
				reminder.name ?? 
				reminder.title ?? 
				reminder.reminder ?? 
				"Recordatorio"
			),
			description: this.getNullableString(
				reminder.T_descripcion ?? 
				reminder.P_descripcion ?? 
				reminder.description ?? 
				reminder.details ?? 
				""
			),
			completed,
			dueDate: this.getNullableString(
				reminder.Dt_fechaVencimiento ?? 
				reminder.P_fecha ?? 
				reminder.dueDate ?? 
				reminder.endDay ?? 
				reminder.date ?? 
				""
			),
			isDeleted: this.getBoolean(reminder.B_isDeleted),
			priority,
			tags,
		};
	}

	// Obtiene y normaliza todos los recordatorios de un usuario
	// Maneja múltiples estructuras de respuesta API
	static async getByUser(userId) {
		if (!userId) return [];

		const url = `${REMINDERS_TAGS_API_BASE}/${userId}`;
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Error al cargar recordatorios: ${response.status}`);
		}

		const payload = await response.json();
		
		const reminders = Array.isArray(payload)
			? payload
			: Array.isArray(payload?.data)
				? payload.data
				: Array.isArray(payload?.reminders)
					? payload.reminders
					: Array.isArray(payload?.data?.reminders)
						? payload.data.reminders
						: payload?.T_nombre
							? [payload]
							: payload?.data?.T_nombre
								? [payload.data]
								: [];

		

		const normalized = reminders
			.map((reminder, index) => {
				const norm = this.normalizeReminder(reminder, index);
				return norm;
			})
			.filter((reminder, index, arr) => {
				// Filtrar duplicados: mantener solo el primero de cada ID
				const firstIndex = arr.findIndex(r => r.id === reminder.id);
				if (firstIndex !== index) {
					console.warn(`[ReminderService] Duplicate reminder ID detected: ${reminder.id}, skipping`, reminder);
					return false;
				}
				return !reminder.isDeleted;
			});
		
		
		return normalized;
	}

	static async updateName(reminderId, name) {
		if (!reminderId) return;

		const P_nombre = name;
		const P_idToDo = reminderId;

		return this.postUpdate(
			UPDATE_NAME_ENDPOINT,
			{
				P_idToDo,
				P_nombre,
			},
			"Error al actualizar nombre de recordatorio"
		);
	}

	static async updateDescription(reminderId, description) {
		if (!reminderId) return;

		const P_descripcion = description;
		const P_idToDo = reminderId;

		return this.postUpdate(
			UPDATE_DESC_ENDPOINT,
			{
				P_idToDo,
				P_descripcion,
			},
			"Error al actualizar descripción de recordatorio"
		);
	}

	// Convierte cualquier formato de fecha a "YYYY-MM-DD HH:mm:ss"
	// Soporta múltiples formatos: Date object, ISO 8601, DD-MM-YYYY, YYYY-MM-DD, etc.
	static toDateTimeString(dateValue) {
		if (!dateValue) return "";

		// Si ya es un objeto Date, formatearlo directamente
		if (dateValue instanceof Date) {
			if (Number.isNaN(dateValue.getTime())) {
				console.warn("[ReminderService] toDateTimeString: invalid Date object");
				return "";
			}
			const yr = dateValue.getFullYear();
			const mo = String(dateValue.getMonth() + 1).padStart(2, "0");
			const dy = String(dateValue.getDate()).padStart(2, "0");
			const hh = String(dateValue.getHours()).padStart(2, "0");
			const mm = String(dateValue.getMinutes()).padStart(2, "0");
			const ss = String(dateValue.getSeconds()).padStart(2, "0");
			return `${yr}-${mo}-${dy} ${hh}:${mm}:${ss}`;
		}

		const raw = String(dateValue).trim();

		const fmt = (yr, mo, dy, hh, mm, ss) =>
			`${yr}-${mo}-${dy} ${hh}:${mm}:${ss ?? "00"}`;

		// Ya está en formato "YYYY-MM-DD HH:mm:ss"
		const already = raw.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
		if (already) return raw;

		// "YYYY-MM-DD HH:mm" → add seconds
		const yyyymmHHmm = raw.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
		if (yyyymmHHmm) return `${raw}:00`;

		// "DD-MM-YYYY HH:mm:ss" o "DD-MM-YYYY HH:mm" (formato antiguo)
		const ddmmHHmm = raw.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})(?::(\d{2}))?$/);
		if (ddmmHHmm) {
			return fmt(
				ddmmHHmm[3], ddmmHHmm[2], ddmmHHmm[1],
				ddmmHHmm[4], ddmmHHmm[5], ddmmHHmm[6] ?? "00"
			);
		}

		// "YYYY-MM-DDThh:mm:ss[Z]" (formato ISO)
		const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
		if (iso) {
			return fmt(
				iso[1], iso[2], iso[3],
				iso[4], iso[5], iso[6] ?? "00"
			);
		}

		// Solo "YYYY-MM-DD" → medianoche
		const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		if (dateOnly) return fmt(dateOnly[1], dateOnly[2], dateOnly[3], "00", "00", "00");

		// Alternativa: dejar que JS lo interprete
		const d = new Date(raw.replace(" ", "T"));
		if (!Number.isNaN(d.getTime())) {
			const yr = d.getFullYear();
			const mo = String(d.getMonth() + 1).padStart(2, "0");
			const dy = String(d.getDate()).padStart(2, "0");
			const hh = String(d.getHours()).padStart(2, "0");
			const mm = String(d.getMinutes()).padStart(2, "0");
			const ss = String(d.getSeconds()).padStart(2, "0");
			return `${yr}-${mo}-${dy} ${hh}:${mm}:${ss}`;
		}

		console.warn("[ReminderService] toDateTimeString: unrecognized date format:", raw);
		return raw;
	}

	static async updateDueDate(reminderId, dueDate) {
		if (!reminderId) return;

		const P_fecha = this.toDateTimeString(dueDate);
		const P_idToDo = reminderId;

		

		return this.postUpdate(
			UPDATE_DATE_ENDPOINT,
			{
				P_idToDo,
				P_fecha,
			},
			"Error al actualizar fecha de recordatorio"
		);
	}

	static async updatePriority(reminderId, priority) {
		if (!reminderId) return;
		const priorityNumber = this.priorityToNumber(priority);

		const P_prioridad = priorityNumber;
		const P_idToDo = reminderId;

		return this.postUpdate(
			UPDATE_PRIORITY_ENDPOINT,
			{
				P_idToDo,
				P_prioridad,
			},
			"Error al actualizar prioridad de recordatorio"
		);
	}

	// Constructor de payload para el endpoint unificado de actualización
	// Extrae todos los campos relevantes de un recordatorio normalizado
	static _buildUnifiedUpdatePayload(reminder) {
		if (!reminder?.id) {
			console.warn("[ReminderService] _buildUnifiedUpdatePayload: missing reminder id");
			return null;
		}

		// Extraer etiquetas custom (filtrar tags sintéticos de prioridad)
		const tags = Array.isArray(reminder.tags)
			? reminder.tags
				.filter(t => typeof t !== "string" ? !String(t?.type ?? "").startsWith("priority-") : true)
				.map(t => typeof t === "string" ? t : (t?.label ?? t?.name ?? ""))
				.filter(Boolean)
			: [];

		const priorityNumber = this.priorityToNumber(reminder.priority);

		return {
			P_idToDo: reminder.id,
			P_nombre: String(reminder.name ?? ""),
			P_descripcion: String(reminder.description ?? ""),
			P_fecha: this.toDateTimeString(reminder.dueDate ?? ""),
			P_prioridad: priorityNumber ?? 2,
			P_estado: reminder.completed === true,
			P_tag1: tags[0] ?? null,
			P_tag2: tags[1] ?? null,
			P_tag3: tags[2] ?? null,
			P_tag4: tags[3] ?? null,
			P_tag5: tags[4] ?? null,
		};
	}

	static async updateFromEdit(previousReminder, updatedReminder) {
		

		if (!previousReminder?.id || !updatedReminder) {
			console.warn("[ReminderService] updateFromEdit aborted — missing id or updatedReminder", { id: previousReminder?.id });
			return;
		}

		// Advertir si el ID parece sintético (generado de respaldo, no un ID real del servidor)
		if (String(previousReminder.id).startsWith("reminder-")) {
			console.warn("[ReminderService] ID looks synthetic (reminder-N), backend may reject it:", previousReminder.id);
		}

		// Construir payload único con todos los campos usando el recordatorio actualizado
		const payload = this._buildUnifiedUpdatePayload(updatedReminder);
		if (!payload) {
			console.warn("[ReminderService] updateFromEdit — failed to build payload");
			return;
		}

		

		try {
			await this.postUpdate(
				UPDATE_REMINDER_UNIFIED_ENDPOINT,
				payload,
				"Error al actualizar recordatorio"
			);
			
		} catch (error) {
			console.error("[ReminderService] updateFromEdit — error:", error);
			throw error;
		}
	}

	/* Agrega un nuevo recordatorio mediante POST */
	static async addReminder(userId, name, description, dueDate, priority, tags = [], codigoUsuario = null) {
		if (!userId) return;
		const priorityNumber = this.priorityToNumber(priority);

		const payload = {
			P_usuario: userId,
			P_codigo_usuario: codigoUsuario ?? null,
			P_nombre: name || "",
			P_descripcion: description || "",
			P_fecha: this.toDateTimeString(dueDate),
			P_prioridad: priorityNumber ?? 2,
			P_tag1: null,
			P_tag2: null,
			P_tag3: null,
			P_tag4: null,
			P_tag5: null
		};

		// incluir hasta 5 etiquetas, null para espacios vacíos
		if (Array.isArray(tags)) {
			tags.slice(0, 5).forEach((t, ix) => {
				payload[`P_tag${ix + 1}`] = t || null;
			});
		}

		return this.postUpdate(
			ADD_REMINDER_ENDPOINT,
			payload,
			"Error al agregar recordatorio"
		);
	}

	/* Elimina un recordatorio por ID */
	static async deleteReminder(reminderId) {
		if (!reminderId) return;
		return this.postUpdate(
			DELETE_REMINDER_ENDPOINT,
			{ N_idRecordatorio: reminderId },
			"Error al eliminar recordatorio"
		);
	}

	/* Elimina múltiples recordatorios por ID en una sola llamada */
	static async deleteMultipleReminders(userId, reminderIds) {
		console.log("[deleteMultipleReminders] userId:", userId, "reminderIds:", reminderIds);
		
		if (!userId) {
			console.error("[deleteMultipleReminders] ERROR: userId is required but got:", userId);
			throw new Error("userId is required for bulk delete");
		}
		
		if (!reminderIds || reminderIds.length === 0) {
			console.warn("[deleteMultipleReminders] No reminder IDs to delete");
			return;
		}
		
		const ids = Array.isArray(reminderIds) 
			? reminderIds 
			: [reminderIds];
		
		// Filtrar undefined/null IDs para evitar errores en el servidor
		const validIds = ids.filter(id => id != null);
		
		if (validIds.length === 0) {
			console.warn("[deleteMultipleReminders] No valid reminder IDs after filtering");
			return;
		}
		
		console.log("[deleteMultipleReminders] Sending payload:", { idRecordatorios: validIds, idUsuario: userId });
		
		return this.postUpdate(
			DELETE_MULTIPLE_REMINDERS_ENDPOINT,
			{ 
				idRecordatorios: validIds,
				idUsuario: userId
			},
			"Error al eliminar recordatorios múltiples"
		);
	}

	/* Actualiza el estado (completado/no completado) de un recordatorio */
	/* Si se proporciona el objeto task completo, usa el nuevo endpoint unificado.
	   Si solo se proporciona el ID, usa el endpoint antiguo (fallback). */
	static async updateState(reminderId, state, taskComplete = null) {
		if (!reminderId) return;
		
		// Convertir booleano al formato apropiado
		const stateValue = typeof state === 'boolean' ? state : Boolean(state);
		
		// Si se proporciona el task completo, usar el nuevo endpoint unificado
		if (taskComplete && taskComplete.id) {
		
			
			// Crear un nuevo objeto task con el estado actualizado
			const updatedTask = {
				...taskComplete,
				completed: stateValue
			};
			
			// Construir payload usando el método auxiliar
			const payload = this._buildUnifiedUpdatePayload(updatedTask);
			if (!payload) {
				console.warn("[ReminderService] updateState — failed to build payload, falling back to legacy endpoint");
				// Fallback al endpoint antiguo
				return this.postUpdate(
					UPDATE_STATE_ENDPOINT,
					{ P_idToDo: reminderId, P_estado: stateValue },
					"Error al actualizar estado de recordatorio"
				);
			}
			
			try {
				await this.postUpdate(
					UPDATE_REMINDER_UNIFIED_ENDPOINT,
					payload,
					"Error al actualizar estado de recordatorio"
				);
				
			} catch (error) {
				console.error("[ReminderService] updateState — error with unified endpoint:", error);
				throw error;
			}
		} else {
			// Fallback: usar el endpoint antiguo (si el backend aún lo soporta)
			
			return this.postUpdate(
				UPDATE_STATE_ENDPOINT,
				{ P_idToDo: reminderId, P_estado: stateValue },
				"Error al actualizar estado de recordatorio"
			);
		}
	}

	/* Actualiza etiquetas de un recordatorio */
	static async updateTags(reminderId, tags = []) {
		

		if (!reminderId) {
			console.warn("[ReminderService] updateTags aborted — no reminderId");
			return;
		}

		const payload = {
			P_idToDo: reminderId,
			P_tag1: null,
			P_tag2: null,
			P_tag3: null,
			P_tag4: null,
			P_tag5: null
		};

		if (Array.isArray(tags)) {
			tags.slice(0, 5).forEach((t, ix) => {
				payload[`P_tag${ix + 1}`] = t || null;
			});
		} else {
			console.warn("[ReminderService] updateTags — tags is not an array:", tags);
		}

		

		return this.postUpdate(
			UPDATE_TAGS_ENDPOINT,
			payload,
			"Error al actualizar etiquetas de recordatorio"
		);
	}
}



export default ReminderService;