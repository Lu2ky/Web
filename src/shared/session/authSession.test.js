import { beforeEach, describe, expect, it } from 'vitest';
import {
  ROLE_ADMIN,
  ROLE_USUARIOS,
  clearAuthSession,
  createAuthSession,
  getAuthSession,
  getHomeRouteByRole,
  getSessionCodUsuario,
  getSessionNumericUserId,
  hasAnyRole,
  isAuthenticated,
} from './authSession';

const AUTH_STORAGE_KEY = 'auth_session';

function base64Url(value) {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function makeToken(payload) {
  return `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url(payload)}.firma`;
}

describe('authSession', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('crea la sesión con roles normalizados y token global', () => {
    createAuthSession({
      userId: 'testuser',
      token: 'token-123',
      roles: [' admin_upb_planner ', 'usuarios_upb_planner'],
      numericUserId: 1,
    });

    const session = getAuthSession();
    expect(session).toMatchObject({
      userId: 'testuser',
      numericUserId: 1,
      token: 'token-123',
      roles: [ROLE_ADMIN, ROLE_USUARIOS],
    });
    expect(localStorage.getItem('token')).toBe('token-123');
    expect(isAuthenticated()).toBe(true);
  });

  it('ignora la creación de sesión sin userId', () => {
    createAuthSession({ userId: '   ', token: 'x' });
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('lee codUsuario desde el sub del JWT', () => {
    createAuthSession({ userId: 'testuser', token: makeToken({ sub: '1' }), roles: [ROLE_USUARIOS] });
    expect(getSessionCodUsuario()).toBe('1');
  });

  it('usa el username como codUsuario si el token no es válido', () => {
    createAuthSession({ userId: 'testuser', token: 'no-es-un-jwt', roles: [ROLE_USUARIOS] });
    expect(getSessionCodUsuario()).toBe('testuser');
  });

  it('expone el id numérico de la sesión', () => {
    createAuthSession({ userId: 'testuser', numericUserId: 7, roles: [ROLE_USUARIOS] });
    expect(getSessionNumericUserId()).toBe(7);

    localStorage.clear();
    createAuthSession({ userId: 'testuser', roles: [ROLE_USUARIOS] });
    expect(getSessionNumericUserId()).toBe('testuser');
  });

  it('evalúa roles con alias de LDAP', () => {
    createAuthSession({ userId: 'admin', roles: ['admin_upb_planner'] });

    expect(hasAnyRole([ROLE_ADMIN])).toBe(true);
    expect(hasAnyRole([ROLE_USUARIOS])).toBe(false);
    expect(hasAnyRole([])).toBe(true);
  });

  it('resuelve la ruta inicial según el rol', () => {
    createAuthSession({ userId: 'admin', roles: [ROLE_ADMIN] });
    expect(getHomeRouteByRole()).toBe('/Admin');

    createAuthSession({ userId: 'testuser', roles: [ROLE_USUARIOS] });
    expect(getHomeRouteByRole()).toBe('/Estudiante/testuser');

    createAuthSession({ userId: 'sin-rol', roles: ['OTRO'] });
    expect(getHomeRouteByRole()).toBe('/');
  });

  it('limpia la sesión y el token global', () => {
    createAuthSession({ userId: 'testuser', token: 'abc', roles: [ROLE_USUARIOS] });
    clearAuthSession();

    expect(getAuthSession()).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });
});
