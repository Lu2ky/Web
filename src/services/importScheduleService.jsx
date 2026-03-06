const API_URL = import.meta.env.VITE_API_IMPORT_SCHEDULE;

// Mapeo flexible de encabezados del Excel a los campos de la API.
// Agrega variantes si los nombres de columna del Excel difieren.
const HEADER_MAP = {
  nombre:           ['nombre', 'name', 'estudiante'],
  semestre:         ['semestre', 'semester'],
  programa:         ['programa', 'program', 'carrera'],
  codUsuario:       ['codusuario', 'cod_usuario', 'codigo usuario', 'código usuario', 'codigo_usuario'],
  nrc:              ['nrc'],
  nombreCurso:      ['nombrecurso', 'nombre curso', 'nombre_curso', 'asignatura', 'curso', 'materia'],
  docente:          ['docente', 'profesor', 'teacher'],
  creditos:         ['creditos', 'créditos', 'credits'],
  modoCalificar:    ['modocalificar', 'modo calificar', 'modo_calificar', 'modo de calificación'],
  campus:           ['campus'],
  tipoCurso:        ['tipocurso', 'tipo curso', 'tipo_curso', 'tipo'],
  dia:              ['dia', 'día', 'day'],
  horaInicio:       ['horainicio', 'hora inicio', 'hora_inicio', 'inicio'],
  horaFin:          ['horafin', 'hora fin', 'hora_fin', 'fin'],
  salon:            ['salon', 'salón', 'aula', 'classroom'],
  periodoAcademico: ['periodoacademico', 'periodo academico', 'período académico', 'periodo_academico', 'periodo'],
};

/**
 * Normaliza las filas crudas del Excel (array de arrays con header en fila 0)
 * al formato que espera la API.
 */
function normalizeRows(rawRows) {
  if (!rawRows?.length) return [];

  const [headerRow, ...dataRows] = rawRows;
  const headers = headerRow.map((h) => String(h ?? '').trim().toLowerCase());

  // Construye un índice: campo API -> índice de columna en el Excel
  const colIndex = {};
  for (const [field, variants] of Object.entries(HEADER_MAP)) {
    const idx = headers.findIndex((h) => variants.includes(h));
    colIndex[field] = idx; // -1 si no se encontró
  }

  return dataRows
    .filter((row) => row.some((cell) => cell !== undefined && cell !== ''))
    .map((row) => ({
      nombre:           row[colIndex.nombre]          ?? '',
      semestre:         Number(row[colIndex.semestre]) || 0,
      programa:         row[colIndex.programa]         ?? '',
      codUsuario:       String(row[colIndex.codUsuario] ?? ''),
      nrc:              String(row[colIndex.nrc]        ?? ''),
      nombreCurso:      row[colIndex.nombreCurso]       ?? '',
      docente:          row[colIndex.docente]           ?? '',
      creditos:         Number(row[colIndex.creditos])  || 0,
      modoCalificar:    row[colIndex.modoCalificar]     ?? '',
      campus:           row[colIndex.campus]            ?? '',
      tipoCurso:        row[colIndex.tipoCurso]         ?? '',
      dia:              Number(row[colIndex.dia])       || 0,
      horaInicio:       row[colIndex.horaInicio]        ?? '',
      horaFin:          row[colIndex.horaFin]           ?? '',
      salon:            row[colIndex.salon]             ?? '',
      periodoAcademico: row[colIndex.periodoAcademico]  ?? '',
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

