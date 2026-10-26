import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiClient } from './apiClient';
import NotificationService from './notificationService';

describe('NotificationService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      'auth_session',
      JSON.stringify({ userId: 'testuser', numericUserId: 1, token: 'token', roles: ['ROLE_USUARIOS'] })
    );
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
  });

  it('normaliza notificaciones con estado string del backend', () => {
    const unread = NotificationService.normalizeNotification({
      idNotificacion: 2,
      idUsuario: 1,
      idRecordatorio: 5,
      nombre: 'Recordatorio: Examen',
      descripcion: 'El examen es el 1 de marzo',
      fechaEmision: '2026-02-28 09:00:00',
      estado: '0',
    });

    expect(unread).toMatchObject({
      id: 2,
      name: 'Recordatorio: Examen',
      fechaEmision: '2026-02-28 09:00:00',
      estado: '0',
      read: false,
      recordatorioId: 5,
      usuarioId: 1,
    });

    const read = NotificationService.normalizeNotification({ id: 3, estado: '1' });
    expect(read).toMatchObject({ estado: '1', read: true });
  });

  it('acepta booleanos y números para el estado leído', () => {
    expect(NotificationService.normalizeNotification({ estado: true }).read).toBe(true);
    expect(NotificationService.normalizeNotification({ estado: 1 }).read).toBe(true);
    expect(NotificationService.normalizeNotification({ estado: 0 }).read).toBe(false);
    expect(NotificationService.normalizeNotification({}).read).toBe(false);
  });

  it('lista notificaciones del usuario', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([{ idNotificacion: 1, estado: '0' }]);

    const result = await NotificationService.getNotifications('abc/1');

    expect(apiClient.get).toHaveBeenCalledWith('/notifications/users/abc%2F1');
    expect(result).toHaveLength(1);
  });

  it('no llama a la API sin usuario', async () => {
    await expect(NotificationService.getNotifications(null)).resolves.toEqual([]);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('marca leídas uniendo los IDs', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ message: 'ok' });

    await NotificationService.acknowledgeNotifications([1, '2', '', null], 1);

    expect(apiClient.post).toHaveBeenCalledWith('/notifications/delete', {
      ids: '1,2',
      N_idUsuario: 1,
      codUsuario: 'testuser',
    });
  });

  it('no envía nada si no hay IDs válidos', async () => {
    await expect(NotificationService.acknowledgeNotifications(['', null], 1)).resolves.toBeNull();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('crea notificaciones con el contrato de Go', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ message: 'ok' });

    await NotificationService.addNotification({
      todoId: 9,
      userId: 1,
      name: 'Recordatorio: Tarea',
      description: 'detalle',
      issueDate: '2026-03-01T10:00:00.000Z',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/notifications', {
      nombre: 'Recordatorio: Tarea',
      descripcion: 'detalle',
      // DATETIME de MySQL, no ISO con `T`/`Z`.
      fechaEmision: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
      idToDoList: 9,
      N_idUsuario: 1,
      codUsuario: 'testuser',
    });
  });

  it('usa la hora actual en formato MySQL cuando no se envía fecha', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ message: 'ok' });

    await NotificationService.addNotification({ todoId: 9, userId: 1, name: 'Sin fecha' });

    const payload = vi.mocked(apiClient.post).mock.calls[0][1];
    expect(payload.fechaEmision).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('envía correo y antelación a /notifications/mute', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ message: 'ok' });

    await NotificationService.muteNotifications({
      idUsuario: 1,
      correo: 'nuevo@upb.edu.co',
      antelacionNotis: '00:30:00',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/notifications/mute', {
      idUsuario: 1,
      correo: 'nuevo@upb.edu.co',
      antelacionNotis: '00:30:00',
      codUsuario: 'testuser',
    });
  });
});
