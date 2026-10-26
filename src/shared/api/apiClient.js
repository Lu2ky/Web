/**
 * Cliente HTTP único de la aplicación (patrón Singleton).
 *
 * Reglas:
 * - Una sola URL base: `VITE_API_BASE_URL` (por defecto `/api/v1`, resuelta por
 *   el proxy de Vite en desarrollo y por nginx en producción).
 * - Nunca se envía `X-API-Key` desde el navegador: la inyecta api-express.
 * - `fetch` solo vive aquí; el resto de la app usa este cliente o TanStack Query.
 */

const DEFAULT_BASE_URL = '/api/v1';
const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Error HTTP normalizado.
 * @property {number} status
 * @property {unknown} body
 * @property {string} url
 */
export class HttpError extends Error {
  constructor(message, { status = 0, body = null, url = '' } = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
    this.url = url;
  }
}

function isFormData(body) {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function isRawBody(body) {
  if (typeof Blob !== 'undefined' && body instanceof Blob) return true;
  if (typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer) return true;
  return typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(body);
}

async function parseResponseBody(response) {
  if (response.status === 204 || response.status === 205) return null;

  const text = await response.text();
  if (!text) return null;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  // Algunos proxies devuelven JSON con `text/html`. Si el cuerpo parece JSON,
  // se parsea igualmente para no romper los servicios que esperan arrays.
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return text;
    }
  }

  return text;
}

function extractMessage(body, status) {
  if (body && typeof body === 'object') {
    if (typeof body.message === 'string' && body.message) return body.message;
    if (typeof body.error === 'string' && body.error) return body.error;
  }
  if (typeof body === 'string' && body.trim()) return body;
  return `HTTP ${status}`;
}

function buildSignal(externalSignal, timeoutMs) {
  const controller = new AbortController();

  const timer = timeoutMs > 0
    ? setTimeout(() => {
        controller.abort(new DOMException('La petición excedió el tiempo de espera', 'TimeoutError'));
      }, timeoutMs)
    : null;

  const onExternalAbort = () => controller.abort(externalSignal.reason);
  if (externalSignal) {
    if (externalSignal.aborted) onExternalAbort();
    else externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  return {
    signal: controller.signal,
    cleanup() {
      if (timer) clearTimeout(timer);
      if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
    },
  };
}

/**
 * Crea un cliente HTTP. Solo la instancia exportada al final es Singleton;
 * la fábrica existe para poder inyectar dependencias en tests.
 */
export function createHttpClient({
  baseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL,
  timeout = DEFAULT_TIMEOUT_MS,
  getToken = () => localStorage.getItem('token'),
} = {}) {
  const normalizedBaseUrl = String(baseUrl).replace(/\/+$/, '');

  async function request(method, path, { body, headers: extraHeaders, signal: externalSignal, timeout: requestTimeout = timeout, ...rest } = {}) {
    const url = `${normalizedBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    const token = getToken();
    const headers = {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    };

    let payload;
    if (body !== undefined && body !== null) {
      if (isFormData(body) || isRawBody(body)) {
        // El navegador debe fijar el Content-Type (incluido el boundary).
        payload = body;
      } else {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        payload = JSON.stringify(body);
      }
    }

    const { signal, cleanup } = buildSignal(externalSignal, requestTimeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: payload,
        signal,
        ...rest,
      });

      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new HttpError(extractMessage(data, response.status), {
          status: response.status,
          body: data,
          url,
        });
      }

      return data;
    } catch (error) {
      if (error instanceof HttpError) throw error;
      if (error?.name === 'AbortError' || error?.name === 'TimeoutError') {
        throw new HttpError('La petición fue cancelada o excedió el tiempo de espera', {
          status: 0,
          body: null,
          url,
        });
      }
      throw new HttpError(error?.message || 'Error de red', { status: 0, body: null, url });
    } finally {
      cleanup();
    }
  }

  return {
    request,
    get: (path, options) => request('GET', path, options),
    post: (path, body, options = {}) => request('POST', path, { ...options, body }),
    put: (path, body, options = {}) => request('PUT', path, { ...options, body }),
    patch: (path, body, options = {}) => request('PATCH', path, { ...options, body }),
    delete: (path, options) => request('DELETE', path, options),
  };
}

/** Instancia única usada por toda la aplicación. */
export const httpClient = createHttpClient();

/** Alias histórico: mismos métodos, misma instancia. */
export const apiClient = httpClient;

/**
 * Claves de caché de TanStack Query.
 */
export const queryKeys = {
  auth: {
    login: () => ['auth', 'login'],
    validate: (token) => ['auth', 'validate', token],
    user: (userId) => ['auth', 'user', userId],
  },

  schedules: {
    official: (userId, periodId) => ['schedules', 'official', userId, periodId],
    personal: (userId, periodId) => ['schedules', 'personal', userId, periodId],
  },

  reminders: {
    list: (userId) => ['reminders', 'list', userId],
    tags: (userId) => ['reminders', 'tags', userId],
    detail: (id) => ['reminders', 'detail', id],
  },

  notifications: {
    list: (userId) => ['notifications', 'list', userId],
    silence: (userId) => ['notifications', 'silence', userId],
  },

  comments: {
    list: (params) => ['comments', 'list', params],
  },

  academicPeriods: {
    list: () => ['academicPeriods', 'list'],
    detail: (id) => ['academicPeriods', 'detail', id],
  },

  colors: {
    list: () => ['colors', 'list'],
  },

  user: {
    data: (userId) => ['user', 'data', userId],
    onboarding: (userId) => ['user', 'onboarding', userId],
  },

  emails: {
    list: (params) => ['emails', 'list', params],
  },

  tags: {
    list: (userId) => ['tags', 'list', userId],
  },
};

/**
 * Opciones de consulta reutilizables.
 */
export const queryOptions = {
  list: (key, path, enabled = true) => ({
    queryKey: key,
    queryFn: () => apiClient.get(path),
    enabled,
    staleTime: 1000 * 60 * 5,
  }),

  detail: (key, path, enabled = true) => ({
    queryKey: key,
    queryFn: () => apiClient.get(path),
    enabled,
    staleTime: 1000 * 60 * 5,
  }),
};

export default apiClient;
