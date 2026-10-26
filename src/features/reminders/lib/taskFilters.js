/**
 * Filtros y normalización de recordatorios.
 *
 * La API entrega prioridades como 1/2/3 y etiquetas con tipos internos; la UI
 * trabaja con `alta`/`media`/`baja` y con fechas ya interpretadas.
 */

export const initialTasks = [];

export const defaultFilters = {
  status: "all",
  priority: "all",
  tag: "",
};

export const normalizePriority = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "1" || normalized === "high" || normalized === "alta") return "alta";
  if (normalized === "2" || normalized === "medium" || normalized === "media") return "media";
  if (normalized === "3" || normalized === "low" || normalized === "baja") return "baja";
  return "";
};

export const getTaskPriority = (task) => {
  if (task.priority) {
    return normalizePriority(task.priority);
  }

  const priorityTag = task.tags?.find((tag) =>
    ["priority-high", "priority-medium", "priority-low"].includes(tag.type)
  );

  if (!priorityTag) return "";
  if (priorityTag.type === "priority-high") return "alta";
  if (priorityTag.type === "priority-medium") return "media";
  if (priorityTag.type === "priority-low") return "baja";
  return "";
};

export const parseDueDateForFilter = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]) - 1;
    const day = Number(dateOnly[3]);
    return new Date(year, month, day, 23, 59, 59, 999);
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
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export function filterTasks(tasks, activeFilters) {
  const now = new Date();

  return tasks.filter((task) => {
    const dueDate = parseDueDateForFilter(task.dueDate);
    const dueDateMatches = !dueDate || dueDate >= now;

    const statusMatches =
      activeFilters.status === "all" ||
      (activeFilters.status === "completed" && task.completed) ||
      (activeFilters.status === "pending" && !task.completed);

    const taskPriority = getTaskPriority(task);
    const priorityMatches =
      activeFilters.priority === "all" || taskPriority === activeFilters.priority;

    const normalizedTagFilter = activeFilters.tag.trim().toLowerCase();
    const tagMatches =
      !normalizedTagFilter ||
      task.tags?.some((tag) =>
        String(tag.label || "")
          .toLowerCase()
          .includes(normalizedTagFilter)
      );

    return dueDateMatches && statusMatches && priorityMatches && tagMatches;
  });
}

export default filterTasks;
