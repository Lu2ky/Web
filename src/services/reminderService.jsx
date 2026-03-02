const REMINDERS_API_BASE = "http://209.25.140.25:9242/api/reminders-by-user";

class ReminderService {
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

	static normalizePriority(value) {
		const normalized = String(value ?? "").toLowerCase();
		if (normalized === "high" || normalized === "alta") return "alta";
		if (normalized === "medium" || normalized === "media") return "media";
		if (normalized === "low" || normalized === "baja") return "baja";
		return "";
	}

	static normalizeReminder(reminder, index) {
		const priority = this.normalizePriority(
			this.getNullableString(
				reminder.T_Prioridad ?? reminder.priority ?? reminder.level ?? reminder.importance
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
				label: tag.label ?? tag.name ?? "",
				type: tag.type ?? "custom",
			};
		});

		if (priority) {
			const priorityType =
				priority === "alta"
					? "priority-high"
					: priority === "media"
						? "priority-medium"
						: "priority-low";

			const hasPriorityTag = tags.some(tag => tag.type === priorityType);
			if (!hasPriorityTag) {
				tags.push({ label: priority, type: priorityType });
			}
		}

		const rawCompleted =
			reminder.completed ?? reminder.done ?? reminder.isDone ?? reminder.status ?? reminder.B_completed;

		const completed =
			rawCompleted === true ||
			rawCompleted === 1 ||
			String(rawCompleted).toLowerCase() === "true" ||
			String(rawCompleted).toLowerCase() === "completed";

		return {
			id: reminder.id ?? reminder._id ?? reminder.reminder_id ?? `reminder-${index}`,
			name: this.getNullableString(
				reminder.T_nombre ?? reminder.name ?? reminder.title ?? reminder.reminder ?? "Recordatorio"
			),
			description: this.getNullableString(
				reminder.T_descripcion ?? reminder.description ?? reminder.details ?? ""
			),
			completed,
			dueDate: this.getNullableString(
				reminder.Dt_fechaVencimiento ?? reminder.dueDate ?? reminder.endDay ?? reminder.date ?? ""
			),
			isDeleted: this.getBoolean(reminder.B_isDeleted),
			priority,
			tags,
		};
	}

	static async getByUser(userId) {
		if (!userId) return [];

		const response = await fetch(`${REMINDERS_API_BASE}/${userId}`);
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

		return reminders
			.map((reminder, index) => this.normalizeReminder(reminder, index))
			.filter(reminder => !reminder.isDeleted);
	}
}

export default ReminderService;
