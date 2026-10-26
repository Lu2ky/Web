/**
 * Utilidades de presentación del calendario.
 *
 * Los eventos llegan ya normalizados por `scheduleMappers` (capa API). Aquí
 * solo se adaptan al modelo visual del calendario y se resuelven los filtros
 * por período, semana y etiqueta.
 */

const DAY_NAMES = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

const toHhMm = (value) => {
  if (value == null || value === "") return "";
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return String(value);
  return `${String(Number(match[1])).padStart(2, "0")}:${match[2]}`;
};

const toDateOnly = (value) => {
  if (!value) return null;
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : String(value).split(" ")[0];
};

/** Convierte filas oficiales normalizadas en eventos del calendario. */
export function toCalendarEvents(apiData) {
  if (!Array.isArray(apiData)) {
    console.error("Datos de la API no son un array:", apiData);
    return [];
  }

  return apiData
    .map((item, index) => {
      const [rawStart, rawEnd, rawDay] = item.times ?? [];
      const startTime = item.start_time ?? toHhMm(rawStart);
      const endTime = item.end_time ?? toHhMm(rawEnd);
      const day = item.day ?? DAY_NAMES[rawDay] ?? "";
      if (!startTime || !endTime || !day) return null;

      return {
        id: `materiaOficial-${item.NRC ?? item.course_id ?? index}-${index}`,
        subject_name: item.subject_name,
        professor_name: item.professor_name,
        classroom: item.classroom,
        NRC: item.NRC,
        start_time: startTime,
        end_time: endTime,
        day,
        etiqueta: item.tag,
        academicPeriod: item.academicPeriod ?? item.academic_period ?? "Desconocido",
        campus: item.campus,
        credits: item.credits,
        // Identificadores normalizados (sin claves N_* del backend).
        course_id: item.course_id ?? item.id_course,
        schedule_id: item.schedule_id ?? item.id_horario,
        user_id: item.user_id,
      };
    })
    .filter(Boolean);
}

/** Descarta actividades personales incompletas. */
export function toPersonalEvents(eventsList) {
  if (!Array.isArray(eventsList)) return [];
  return eventsList.filter((event) => event.start_time && event.end_time && event.day);
}

/** Rango [lunes 00:00, domingo 23:59] de la semana desplazada. */
export function getWeekDateRange(weekOffset = 0) {
  const today = new Date();
  const currentDay = today.getDay();
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - daysFromMonday + weekOffset * 7);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startDate: startOfWeek, endDate: endOfWeek };
}

/** Indica si la semana cae dentro del rango del período académico. */
export function isWeekInPeriod(weekOffset, period) {
  if (!period || (!period.start_date && !period.end_date)) return true;

  const { startDate, endDate } = getWeekDateRange(weekOffset);
  const periodStart = period.start_date ? new Date(period.start_date) : null;
  const periodEnd = period.end_date ? new Date(`${period.end_date}T23:59:59`) : null;

  if (!periodStart && !periodEnd) return true;
  if (periodStart && endDate < periodStart) return false;
  if (periodEnd && startDate > periodEnd) return false;
  return true;
}

/** Indica si una actividad personal se superpone con la semana. */
export function isActiveLaterallyInWeek(activity, weekOffset) {
  if (!activity) return false;
  if (!activity.date_start && !activity.date_end) return false;

  const { startDate: weekStart, endDate: weekEnd } = getWeekDateRange(weekOffset);
  const start = toDateOnly(activity.date_start);
  const end = toDateOnly(activity.date_end);

  const activityStart = start ? new Date(`${start}T00:00:00`) : null;
  const activityEnd = end ? new Date(`${end}T23:59:59`) : null;

  if (!activityStart && !activityEnd) return false;
  if (activityEnd && weekStart > activityEnd) return false;
  if (activityStart && weekEnd < activityStart) return false;
  return true;
}

export function getInitialView() {
  return window.innerWidth <= 425 ? "Diario" : "Semanal";
}

/** Desplazamiento en semanas entre la semana actual y la fecha dada. */
export function calculateWeekOffsetForDate(dateString) {
  if (!dateString) return 0;

  const targetDate = new Date(dateString);
  if (Number.isNaN(targetDate.getTime())) return 0;

  const startOfWeek = (date) => {
    const day = date.getDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(date);
    monday.setDate(date.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const timeDiff = startOfWeek(targetDate) - startOfWeek(new Date());
  return Math.round(timeDiff / (7 * 24 * 60 * 60 * 1000));
}
