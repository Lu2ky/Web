import { describe, expect, it } from 'vitest';
import {
  mapOfficialScheduleList,
  mapOfficialScheduleRow,
  mapPersonalScheduleList,
  mapPersonalScheduleRow,
  normalizeTime,
  unwrapScalar,
} from './scheduleMappers';

describe('scheduleMappers', () => {
  describe('unwrapScalar', () => {
    it('extrae el valor de los tipos Null* de Go', () => {
      expect(unwrapScalar({ String: '2026-02-01', Valid: true })).toBe('2026-02-01');
      expect(unwrapScalar({ Float64: 4, Valid: true })).toBe(4);
      expect(unwrapScalar({ Bool: false, Valid: true })).toBe(false);
    });

    it('devuelve null cuando Valid es false', () => {
      expect(unwrapScalar({ String: '', Valid: false })).toBeNull();
    });

    it('deja intactos los valores primitivos', () => {
      expect(unwrapScalar('texto')).toBe('texto');
      expect(unwrapScalar(7)).toBe(7);
      expect(unwrapScalar(null)).toBeNull();
    });
  });

  describe('normalizeTime', () => {
    it('recorta los segundos', () => {
      expect(normalizeTime('07:00:00')).toBe('07:00');
      expect(normalizeTime('14:05:59')).toBe('14:05');
    });

    it('respeta formatos ya normalizados o desconocidos', () => {
      expect(normalizeTime('08:30')).toBe('08:30');
      expect(normalizeTime('')).toBe('');
    });
  });

  describe('mapOfficialScheduleRow', () => {
    const goRow = {
      N_idHorario: 1,
      N_idcourse: 10,
      N_iduser: 1,
      Nrc: 'CALC101',
      Course: 'Cálculo Diferencial',
      Tag: 'Teoría',
      Teacher: 'Prof. García',
      Day: 1,
      StartHour: '07:00:00',
      EndHour: '09:00:00',
      Classroom: 'A-101',
      Credits: { Float64: 4, Valid: true },
      Campus: 'Laureles',
      IdPeriodoAcademico: 1,
      PeriodoAcademico: '2026 semestre 1 - pregrado',
      FechaInicio: '2026-01-19 00:00:00',
      FechaFinal: '2026-05-24 00:00:00',
    };

    it('traduce el modelo de Go al modelo del calendario', () => {
      const mapped = mapOfficialScheduleRow(goRow);

      expect(mapped).toMatchObject({
        id_horario: 1,
        id_course: 10,
        subject_name: 'Cálculo Diferencial',
        professor_name: 'Prof. García',
        classroom: 'A-101',
        NRC: 'CALC101',
        tag: 'Teoría',
        campus: 'Laureles',
        credits: 4,
        date_start: '2026-01-19',
        date_end: '2026-05-24',
        academicPeriod: '2026 semestre 1 - pregrado',
        course_id: 10,
        schedule_id: 1,
        user_id: 1,
      });
      expect(mapped.times).toEqual(['07:00:00', '09:00:00', 1]);
    });

    it('respeta filas que ya vienen normalizadas', () => {
      const legacy = { subject_name: 'Física', times: ['09:00:00', '11:00:00', 2] };
      expect(mapOfficialScheduleRow(legacy)).toBe(legacy);
    });
  });

  describe('mapPersonalScheduleRow', () => {
    const goRow = {
      N_iduser: 1,
      N_idcourse: 3,
      Activity: 'Estudio personal',
      Description: { String: 'Repaso de cálculo', Valid: true },
      Dt_Start: { String: '2026-02-01', Valid: true },
      Dt_End: { String: '2026-05-24', Valid: true },
      Day: 4,
      StartHour: '14:00:00',
      EndHour: '16:00:00',
      IsDeleted: { Bool: false, Valid: true },
    };

    it('traduce el modelo de Go al modelo del calendario', () => {
      const mapped = mapPersonalScheduleRow(goRow);

      expect(mapped).toMatchObject({
        id: 3,
        name: 'Estudio personal',
        subject_name: 'Estudio personal',
        description: 'Repaso de cálculo',
        tag: 'Personal',
        start_time: '14:00',
        end_time: '16:00',
        day: 'Jueves',
        date_start: '2026-02-01',
        date_end: '2026-05-24',
      });
    });

    it('usa valores por defecto cuando los Null* vienen inválidos', () => {
      const mapped = mapPersonalScheduleRow({
        N_idcourse: 9,
        Activity: 'Deportes',
        Description: { String: '', Valid: false },
        Day: 6,
        StartHour: '10:00:00',
        EndHour: '12:00:00',
      });

      expect(mapped.description).toBe('');
      expect(mapped.day).toBe('Sábado');
    });
  });

  describe('listas', () => {
    it('devuelve [] para entradas que no son array', () => {
      expect(mapOfficialScheduleList(null)).toEqual([]);
      expect(mapPersonalScheduleList(undefined)).toEqual([]);
    });

    it('mapea todos los elementos', () => {
      const list = mapOfficialScheduleList([
        { Course: 'A', StartHour: '07:00:00', EndHour: '08:00:00', Day: 1 },
        { Course: 'B', StartHour: '08:00:00', EndHour: '09:00:00', Day: 2 },
      ]);

      expect(list.map((row) => row.subject_name)).toEqual(['A', 'B']);
    });
  });
});
