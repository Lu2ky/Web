import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../shared/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiClient } from '../../../shared/api/apiClient';
import ReminderService, {
  toDbPriority,
  toMysqlDateTime,
  toUiPriority,
} from './reminderService';

function seedSession() {
  localStorage.setItem(
    'auth_session',
    JSON.stringify({
      userId: 'testuser',
      numericUserId: 1,
      token: 'token',
      roles: ['ROLE_USUARIOS'],
    })
  );
  localStorage.setItem('token', 'token');
}

describe('reminderService mappers', () => {
  it('convierte fechas al DATETIME de MySQL', () => {
    expect(toMysqlDateTime('2026-02-15')).toBe('2026-02-15 00:00:00');
    expect(toMysqlDateTime('2026-02-15 23:59')).toBe('2026-02-15 23:59:00');
    expect(toMysqlDateTime('2026-02-15T08:05:09.000Z')).toMatch(/^2026-02-15 \d{2}:05:09$/);
    expect(toMysqlDateTime('')).toBeNull();
    expect(toMysqlDateTime('fecha-invalida')).toBeNull();
  });

  it('mapea prioridades entre UI y BD', () => {
    expect(toDbPriority('alta')).toBe(1);
    expect(toDbPriority('Media')).toBe(2);
    expect(toDbPriority('baja')).toBe(3);
    expect(toDbPriority('2')).toBe(2);
    expect(toDbPriority('desconocida')).toBe(2);

    expect(toUiPriority('Alta')).toBe('alta');
    expect(toUiPriority(3)).toBe('baja');
    expect(toUiPriority(null)).toBe('media');
  });

  it('normaliza filas con tipos nullable de Go', () => {
    const reminder = ReminderService.normalizeReminder({
      N_idToDoList: 10,
      N_idRecordatorio: 4,
      N_idUsuario: 1,
      T_nombre: 'Parcial',
      T_descripcion: { String: 'Capítulos 1-3', Valid: true },
      Dt_fechaVencimiento: { String: '2026-03-01 10:00:00', Valid: true },
      T_Prioridad: 'Alta',
      B_estado: false,
    });

    expect(reminder).toMatchObject({
      id: 10,
      idTodo: 10,
      recordatorioId: 4,
      usuarioId: 1,
      name: 'Parcial',
      description: 'Capítulos 1-3',
      dueDate: '2026-03-01 10:00:00',
      priority: 'alta',
      completed: false,
    });
  });

  it('convierte descripciones nullable inválidas en cadena vacía', () => {
    const reminder = ReminderService.normalizeReminder({
      N_idToDoList: 1,
      T_descripcion: { String: '', Valid: false },
    });

    expect(reminder.description).toBe('');
  });
});

describe('reminderService API', () => {
  beforeEach(() => {
    localStorage.clear();
    seedSession();
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
  });

  it('crea recordatorios con el contrato de Go', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ message: 'ok', toDoId: 11, reminderId: 12 });

    const result = await ReminderService.addReminder(
      1,
      '  Entregar taller ',
      'Descripción',
      '2026-03-10 18:30',
      'alta',
      [{ label: 'Universidad' }, 'Estudio']
    );

    expect(result).toMatchObject({ toDoId: 11, reminderId: 12 });
    expect(apiClient.post).toHaveBeenCalledWith('/api/reminders', {
      P_usuario: 1,
      P_nombre: 'Entregar taller',
      P_descripcion: 'Descripción',
      F_fecha: '2026-03-10 18:30:00',
      N_idPrioridad: 1,
      B_estado: false,
      P_tag1: 'Universidad',
      P_tag2: 'Estudio',
      P_tag3: null,
      P_tag4: null,
      P_tag5: null,
      codUsuario: 'testuser',
    });
  });

  it('agrupa etiquetas por recordatorio al listar', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce([
        { N_idToDoList: 1, N_idRecordatorio: 5, T_nombre: 'Tarea', T_Prioridad: 'Alta', B_estado: false },
      ])
      .mockResolvedValueOnce([
        { N_idRecordatorio: 5, T_tag_nombre: 'Universidad', B_tag_isDeleted: false },
        { N_idRecordatorio: 5, T_tag_nombre: 'Universidad', B_tag_isDeleted: false },
        { N_idRecordatorio: 5, T_tag_nombre: 'Borrada', B_tag_isDeleted: true },
        { N_idRecordatorio: 6, T_tag_nombre: 'Otra', B_tag_isDeleted: false },
      ]);

    const reminders = await ReminderService.getByUser(1);

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/reminders/users/1');
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/reminders/users/1/tags');
    expect(reminders).toHaveLength(1);
    expect(reminders[0]).toMatchObject({ id: 1, recordatorioId: 5, tags: ['Universidad'] });
  });

  it('tolera el fallo del endpoint de etiquetas', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce([{ N_idToDoList: 1, N_idRecordatorio: 5, T_nombre: 'Tarea' }])
      .mockRejectedValueOnce(new Error('boom'));

    const reminders = await ReminderService.getByUser(1);
    expect(reminders[0].tags).toEqual([]);
  });

  it('oculta los recordatorios con borrado lógico', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce([
        { N_idToDoList: 1, N_idRecordatorio: 1, T_nombre: 'Activa', B_isDeleted: false },
        { N_idToDoList: 2, N_idRecordatorio: 2, T_nombre: 'Eliminada', B_isDeleted: true },
      ])
      .mockResolvedValueOnce([]);

    const reminders = await ReminderService.getByUser(1);

    expect(reminders).toHaveLength(1);
    expect(reminders[0].name).toBe('Activa');
  });

  it('actualiza el estado reenviando los campos actuales', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ message: 'ok' });

    await ReminderService.updateState(
      9,
      true,
      {
        idTodo: 9,
        usuarioId: 1,
        name: 'Tarea',
        description: 'detalle',
        dueDate: '2026-03-01 09:00:00',
        priority: 'media',
        tags: ['Casa'],
      }
    );

    const [path, payload] = vi.mocked(apiClient.post).mock.calls[0];
    expect(path).toBe('/api/reminders/update');
    expect(payload).toMatchObject({
      P_usuario: 1,
      P_idToDo: 9,
      P_nombre: 'Tarea',
      B_estado: true,
      P_tag1: 'Casa',
      codUsuario: 'testuser',
    });
  });

  it('filtra IDs inválidos en el borrado múltiple', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ message: 'ok' });

    await ReminderService.deleteMultipleReminders(1, [3, '4', 0, -1, 'x', null]);
    expect(apiClient.post).toHaveBeenCalledWith('/api/reminders/delete/multiple', {
      N_idRecordatorios: '3,4',
      P_usuario: 1,
      codUsuario: 'testuser',
    });

    vi.mocked(apiClient.post).mockClear();
    await expect(ReminderService.deleteMultipleReminders(1, [])).resolves.toBeNull();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('borra por N_idRecordatorio', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ message: 'ok' });

    await ReminderService.deleteReminder('7', 1);

    expect(apiClient.post).toHaveBeenCalledWith('/api/reminders/delete-or-recover', {
      N_idRecordatorio: 7,
      P_usuario: 1,
      codUsuario: 'testuser',
    });
  });
});
