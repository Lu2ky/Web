import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHttpClient, HttpError } from './apiClient';

function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name) => {
        const key = String(name).toLowerCase();
        if (key === 'content-type') return headers['content-type'] ?? 'application/json';
        return headers[key] ?? null;
      },
    },
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

describe('createHttpClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('usa el baseUrl normalizado y no duplica barras', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const client = createHttpClient({ baseUrl: '/api/v1///', getToken: () => null });
    await client.get('/users/1');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/users/1');
  });

  it('adjunta Authorization cuando hay token y no envía X-API-Key', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    const client = createHttpClient({ baseUrl: '/api/v1', getToken: () => 'jwt-token' });
    await client.get('/reminders/users/1');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer jwt-token');
    expect(options.headers['X-API-Key']).toBeUndefined();
  });

  it('serializa el body JSON y fija el Content-Type', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: 'ok' }));
    vi.stubGlobal('fetch', fetchMock);

    const client = createHttpClient({ baseUrl: '/api/v1', getToken: () => null });
    await client.post('/reminders', { P_nombre: 'Parcial' });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body)).toEqual({ P_nombre: 'Parcial' });
  });

  it('no fija Content-Type cuando el body es FormData', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const client = createHttpClient({ baseUrl: '/api/v1', getToken: () => null });
    const form = new FormData();
    form.append('file', 'contenido');

    await client.post('/schedules/import', form);

    const [, options] = fetchMock.mock.calls[0];
    expect(options.body).toBe(form);
    expect(options.headers['Content-Type']).toBeUndefined();
  });

  it('devuelve null en respuestas 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse('', { status: 204 })));

    const client = createHttpClient({ baseUrl: '/api/v1', getToken: () => null });
    await expect(client.delete('/reminders/1')).resolves.toBeNull();
  });

  it('devuelve texto plano cuando el content-type no es JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse('ok', { headers: { 'content-type': 'text/plain' } }))
    );

    const client = createHttpClient({ baseUrl: '/api/v1', getToken: () => null });
    await expect(client.get('/health')).resolves.toBe('ok');
  });

  it('parsea JSON aunque el proxy lo sirva como text/html', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse([{ idUsuario: 1, nombre: 'Test User' }], { headers: { 'content-type': 'text/html' } })
      )
    );

    const client = createHttpClient({ baseUrl: '/api/v1', getToken: () => null });
    await expect(client.get('/users/1')).resolves.toEqual([{ idUsuario: 1, nombre: 'Test User' }]);
  });

  it('lanza HttpError con status y body cuando la respuesta no es ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: 'API Key necesaria para uso' }, { status: 401 }))
    );

    const client = createHttpClient({ baseUrl: '/api/v1', getToken: () => null });

    await expect(client.get('/tags/users/1')).rejects.toMatchObject({
      name: 'HttpError',
      status: 401,
      message: 'API Key necesaria para uso',
      body: { error: 'API Key necesaria para uso' },
    });
  });

  it('normaliza errores de red como HttpError status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const client = createHttpClient({ baseUrl: '/api/v1', getToken: () => null });

    await expect(client.get('/users/1')).rejects.toMatchObject({
      name: 'HttpError',
      status: 0,
      message: 'Failed to fetch',
    });
  });

  it('convierte el timeout en HttpError status 0', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url, { signal }) => new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      }))
    );

    const client = createHttpClient({ baseUrl: '/api/v1', timeout: 10, getToken: () => null });

    const error = await client.get('/slow').catch((err) => err);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(0);
    expect(error.message).toContain('cancelada');
  });

  it('respeta la señal externa ya abortada', async () => {
    const controller = new AbortController();
    controller.abort();

    const fetchMock = vi.fn().mockImplementation((_url, { signal }) => {
      expect(signal.aborted).toBe(true);
      return Promise.reject(new DOMException('abortada', 'AbortError'));
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = createHttpClient({ baseUrl: '/api/v1', getToken: () => null });
    await expect(client.get('/users/1', { signal: controller.signal })).rejects.toBeInstanceOf(HttpError);
  });
});
