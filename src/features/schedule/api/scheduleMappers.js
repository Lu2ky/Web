// ============================================================================
// Mappers de horarios
// ============================================================================
// `apps/api-go` devuelve filas con el modelo de base de datos (`N_idHorario`,
// `Course`, `StartHour`, `Credits:{Float64,Valid}`, ...). La UI del calendario
// trabaja con un modelo estable (`subject_name`, `times`, `start_time`, ...).
//
// Estos mappers viven en la capa API para que los componentes no conozcan el
// contrato del backend ni tengan que defenderse de él. Aceptan tanto la forma
// de Go como la forma legacy que devolvía el proxy anterior.
// ============================================================================

const DAY_NAMES = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

const NORMALIZED_DAY_NAMES = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  miércoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  sábado: "Sábado",
  domingo: "Domingo",
};

/** Extrae el valor real de los tipos `sql.Null*` que serializa Go. */
export function unwrapScalar(value) {
  if (value == null || typeof value !== "object") return value;
  if (value.Valid === false) return null;

  if (value.Int64 != null) return value.Int64;
  if (value.Float64 != null) return value.Float64;
  if (value.String != null) return value.String;
  if (value.Bool != null) return value.Bool;
  if (value.Int32 != null) return value.Int32;

  return value;
}

/** Convierte horas de Go ("07:00:00") al formato de la UI ("07:00"). */
export function normalizeTime(value) {
  const raw = unwrapScalar(value);
  if (raw == null || raw === "") return "";

  const match = String(raw).trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return String(raw);

  const hours = String(Number(match[1])).padStart(2, "0");
  return `${hours}:${match[2]}`;
}

/** Devuelve el nombre del día a partir de un número, nombre o fecha. */
export function normalizeDayName(value, fallbackDate) {
  const raw = unwrapScalar(value);

  if (raw != null && raw !== "") {
    const asNumber = Number(raw);
    if (Number.isInteger(asNumber) && DAY_NAMES[asNumber]) return DAY_NAMES[asNumber];

    const asName = NORMALIZED_DAY_NAMES[String(raw).trim().toLowerCase()];
    if (asName) return asName;
  }

  const date = unwrapScalar(fallbackDate);
  if (date) {
    const parsed = new Date(date);
    if (!Number.isNaN(parsed.getTime())) {
      const jsDay = parsed.getDay();
      return DAY_NAMES[jsDay === 0 ? 7 : jsDay] || "";
    }
  }

  return "";
}

function toDateOnly(value) {
  const raw = unwrapScalar(value);
  if (!raw) return null;
  const match = String(raw).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : String(raw);
}

/**
 * Normaliza una fila de horario oficial a la forma que consume el calendario.
 * @param {object} item fila de `/schedules/official/users/:id`
 */
export function mapOfficialScheduleRow(item = {}) {
  // Forma legacy (ya normalizada): se respeta para no romper consumidores.
  if (item.subject_name && Array.isArray(item.times)) return item;

  const startHour = item.StartHour ?? item.start_hour ?? item.start_time;
  const endHour = item.EndHour ?? item.end_hour ?? item.end_time;
  const dayNumber = item.Day ?? item.day;
  const credits = unwrapScalar(item.Credits ?? item.credits);
  const courseId = item.N_idcourse ?? item.N_idCurso ?? item.id_course ?? item.idCourse;
  const scheduleId = item.N_idHorario ?? item.id_horario ?? item.schedule_id ?? item.idSchedule;
  const userId = item.N_iduser ?? item.N_idUsuario ?? item.id_user ?? item.userId;

  return {
    id_horario: scheduleId,
    id_course: courseId,
    // Identificadores normalizados que consume la UI (nunca las claves N_* de Go).
    course_id: courseId,
    schedule_id: scheduleId,
    user_id: userId,
    subject_name: item.Course ?? item.subject_name ?? item.name ?? "",
    professor_name: item.Teacher ?? item.professor_name ?? "",
    classroom: item.Classroom ?? item.classroom ?? "",
    NRC: item.Nrc ?? item.NRC ?? "",
    times: [startHour, endHour, dayNumber],
    tag: item.Tag ?? item.tag ?? "",
    campus: item.Campus ?? item.campus ?? "",
    credits,
    date_start: toDateOnly(item.FechaInicio ?? item.date_start),
    date_end: toDateOnly(item.FechaFinal ?? item.date_end),
    id_academic_period: item.IdPeriodoAcademico ?? item.id_academic_period,
    academic_period: item.PeriodoAcademico ?? item.academic_period ?? item.academicPeriod,
    // Alias que usa el calendario para filtrar por período.
    academicPeriod: item.PeriodoAcademico ?? item.academic_period ?? item.academicPeriod,
  };
}

/**
 * Normaliza una fila de horario personal a la forma que consume el calendario.
 * @param {object} item fila de `/schedules/personal/users/:id`
 */
export function mapPersonalScheduleRow(item = {}) {
  const startTime = normalizeTime(
    item.StartHour ?? item.start_hour ?? item.start_time ?? item.times?.[0]
  );
  const endTime = normalizeTime(
    item.EndHour ?? item.end_hour ?? item.end_time ?? item.times?.[1]
  );

  const rawDateStart = item.Dt_Start ?? item.date_start ?? item.dateStart;
  const rawDateEnd = item.Dt_End ?? item.date_end ?? item.dateEnd;
  const dateStart = toDateOnly(rawDateStart);
  const dateEnd = toDateOnly(rawDateEnd);

  const day = normalizeDayName(
    item.Day ?? item.day ?? item.day_number ?? item.times?.[2],
    dateStart
  );

  const id = unwrapScalar(
    item.id ??
      item.id_course ??
      item.N_idcourse ??
      item.N_idCourse ??
      item.IdPersonalSchedule ??
      item.id_personal_schedule
  );

  const name = unwrapScalar(
    item.name ??
      item.subject_name ??
      item.activity_name ??
      item.Activity ??
      item.activity
  );

  const description = unwrapScalar(item.description ?? item.Description) || "";
  const userId = unwrapScalar(item.N_iduser ?? item.N_idUsuario ?? item.id_user ?? item.userId);
  const scheduleId = unwrapScalar(
    item.IdPersonalSchedule ?? item.id_personal_schedule ?? item.N_idHorario ?? item.schedule_id
  );

  return {
    id,
    // Identificadores normalizados para la UI.
    course_id: id,
    schedule_id: scheduleId,
    user_id: userId,
    name: name || "",
    subject_name: name || "",
    activity_name: name || "",
    description,
    tag: unwrapScalar(item.tag ?? item.Tag) || "Personal",
    start_time: startTime,
    end_time: endTime,
    day,
    classroom: "",
    location: "",
    date_start: dateStart,
    date_end: dateEnd,
  };
}

export function mapOfficialScheduleList(data) {
  if (!Array.isArray(data)) return [];
  return data.map(mapOfficialScheduleRow);
}

export function mapPersonalScheduleList(data) {
  if (!Array.isArray(data)) return [];
  return data.map(mapPersonalScheduleRow);
}
