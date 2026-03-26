const API_URL = import.meta.env.VITE_API_IMPORT_SCHEDULE;

// Mapeo flexible de encabezados del Excel a los campos de la API.
// Agrega variantes si los nombres de columna del Excel difieren.
const HEADER_MAP = {
  nombre:           ['nombre', 'name', 'estudiante'],
  semestre:         ['semestre', 'semester', 'semestre/actual', 'semestreactual'],
  programa:         ['programa', 'program', 'carrera'],
  codUsuario:       ['codusuario', 'cod_usuario', 'codigo usuario', 'código usuario', 'codigo_usuario'],
  nrc:              ['nrc'],
  nombreCurso:      ['nombrecurso', 'nombre curso', 'nombre_curso', 'asignatura', 'curso', 'materia'],
  docente:          ['docente', 'profesor', 'teacher'],
  creditos:         ['creditos', 'créditos', 'credits'],
  modoCalificar:    ['modocalificar', 'modo calificar', 'modo_calificar', 'modo de calificación'],
  campus:           ['campus'],
  tipoCurso:        ['tipocurso', 'tipo curso', 'tipo_curso', 'tipo'],
  dia:              ['dia', 'día', 'day', 'iddia'],
  horaInicio:       ['horainicio', 'hora inicio', 'hora_inicio', 'inicio'],
  horaFin:          ['horafin', 'hora fin', 'hora_fin', 'fin'],
  salon:            ['salon', 'salón', 'aula', 'classroom'],
  periodoAcademico: ['periodoacademico', 'periodoacadémico', 'periodo academico', 'período académico', 'periodo_academico', 'periodo'],
};

// Mapeo de nombres de días en español a números
const DAYS_MAP = {
  'lunes': 1,
  'martes': 2,
  'miércoles': 3,
  'miercoles': 3,
  'jueves': 4,
  'viernes': 5,
  'sábado': 6,
  'sabado': 6,
  'domingo': 7,
};

/**
 * Convierte el nombre del día a número (1-7)
 */
function convertDayToNumber(dayValue) {
  if (typeof dayValue === 'number') return dayValue;
  if (!dayValue) return 0;
  
  const normalized = String(dayValue).trim().toLowerCase();
  return DAYS_MAP[normalized] || 0;
}

/**
 * Normaliza las filas crudas del Excel (array de arrays con header en fila 0)
 * al formato que espera la API.
 */
function normalizeRows(rawRows) {
  if (!rawRows?.length) return [];

  const [headerRow, ...dataRows] = rawRows;
  const headers = headerRow.map((h) => String(h ?? '').trim().toLowerCase());

  console.log('Headers detectados:', headers);

  // Construye un índice: campo API -> índice de columna en el Excel
  const colIndex = {};
  for (const [field, variants] of Object.entries(HEADER_MAP)) {
    const idx = headers.findIndex((h) => variants.includes(h));
    colIndex[field] = idx; // -1 si no se encontró
    if (idx === -1) {
      console.warn(`⚠️ Campo "${field}" no encontrado. Variantes esperadas:`, variants);
    }
  }
  console.log('Column Index:', colIndex);

  return dataRows
    .filter((row) => row.some((cell) => cell !== undefined && cell !== ''))
    .map((row) => ({
      nombre:           String(row[colIndex.nombre] ?? ''),
      semestre:         Number(row[colIndex.semestre]) || 0,
      programa:         String(row[colIndex.programa] ?? ''),
      codUsuario:       String(row[colIndex.codUsuario] ?? ''),
      nrc:              String(row[colIndex.nrc] ?? ''),
      nombreCurso:      String(row[colIndex.nombreCurso] ?? ''),
      docente:          String(row[colIndex.docente] ?? ''),
      creditos:         Number(row[colIndex.creditos]) || 0,
      modoCalificar:    String(row[colIndex.modoCalificar] ?? ''),
      campus:           String(row[colIndex.campus] ?? ''),
      tipoCurso:        String(row[colIndex.tipoCurso] ?? ''),
      dia:              convertDayToNumber(row[colIndex.dia]),
      horaInicio:       String(row[colIndex.horaInicio] ?? ''),
      horaFin:          String(row[colIndex.horaFin] ?? ''),
      salon:            String(row[colIndex.salon] ?? ''),
      periodoAcademico: String(row[colIndex.periodoAcademico] ?? ''),
    }));
}

/**
 * Envía el horario parseado a la API, fila por fila.
 * @param {Array} rawRows - Resultado de parseExcelFile (array de arrays).
 */
export async function importSchedule(rawRows) {
  const rows = normalizeRows(rawRows);

  console.log('Filas a importar:', rows.length);

  const results = [];
  for (const row of rows) {
    console.log('Enviando fila:', JSON.stringify(row, null, 2));

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Error ${response.status} en fila (${row.nrc} - ${row.nombreCurso}): ${text}`);
    }

    const data = await response.json().catch(() => ({}));
    results.push(data);
  }

  return results;
}

