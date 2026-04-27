// ============================================================================
// Servicio de Autenticación y Gestión de Sesiones
// ============================================================================
// Gestiona la sesión de usuario en localStorage, incluyendo:
// - Creación y validación de sesiones autenticadas
// - Gestión de roles y permisos de usuario
// - Determinar ruta de inicio según rol del usuario
//
// Los datos se almacenan en localStorage bajo la clave 'auth_session'.
// ============================================================================

const AUTH_STORAGE_KEY = "auth_session";

export const ROLE_ADMIN = import.meta.env.VITE_ROLE_ADMIN;
export const ROLE_USUARIOS = import.meta.env.VITE_ROLE_USUARIOS;

const readSession = () => {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return null;
        return parsed;
    } catch {
        return null;
    }
};

const writeSession = (session) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

// Normaliza roles: convierte a array, limpia espacios y filtra valores vacíos
const normalizeRoles = (roles) => {
    if (!Array.isArray(roles)) return [];
    return roles
        .map((role) => String(role || "").trim())
        .filter(Boolean);
};

export const createAuthSession = ({ userId, token = "", roles = [] }) => {
    const safeUserId = String(userId || "").trim();
    if (!safeUserId) return;
    const safeToken = String(token || "").trim();

    const session = {
        userId: safeUserId,
        token: safeToken,
        roles: normalizeRoles(roles),
        createdAt: Date.now()
    };

    writeSession(session);
    // Mantener compatibilidad con código legado que aún lee este valor global.
    localStorage.setItem("token", safeToken);
};

export const getAuthSession = () => readSession();

export const getSessionCodUsuario = () => {
    const session = readSession();
    return String(session?.userId || "").trim();
};

export const isAuthenticated = () => {
    const session = readSession();
    return Boolean(session?.userId);
};

export const clearAuthSession = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("token");
};

// Verifica si el usuario actual tiene al menos uno de los roles requeridos
// Si no hay roles requeridos, retorna true (acceso permitido por defecto)
export const hasAnyRole = (requiredRoles = []) => {
    const normalizedRequired = normalizeRoles(requiredRoles);
    if (normalizedRequired.length === 0) return true;

    const session = readSession();
    const currentRoles = normalizeRoles(session?.roles || []);
    return normalizedRequired.some((role) => currentRoles.includes(role));
};

export const getHomeRouteByRole = () => {
    const session = readSession();
    const roles = normalizeRoles(session?.roles || []);
    const userId = String(session?.userId || "").trim();

    if (roles.includes(ROLE_ADMIN)) {
        return "/Admin";
    }

    if (roles.includes(ROLE_USUARIOS) && userId) {
        return `/Estudiante/${userId}`;
    }

    return "/";
};
