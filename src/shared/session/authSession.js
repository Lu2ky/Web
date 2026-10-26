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

// Roles canónicos del frontend. El backend puede devolver los nombres de grupo
// de LDAP; normalizeRoles los traduce a estos valores.
export const ROLE_ADMIN = "ROLE_ADMIN";
export const ROLE_USUARIOS = "ROLE_USUARIOS";

const ROLE_ALIASES = {
    admin_upb_planner: ROLE_ADMIN,
    usuarios_upb_planner: ROLE_USUARIOS,
};

/**
 * Decodifica el `sub` del JWT sin verificar la firma (la firma la valida el
 * backend). `AuthorityCheck` en Go compara `codUsuario` con este `sub`.
 */
const getTokenSubject = (token) => {
    if (!token || typeof token !== "string") return "";
    const parts = token.split(".");
    if (parts.length !== 3) return "";

    try {
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
        const payload = JSON.parse(atob(padded));
        return typeof payload?.sub === "string" ? payload.sub.trim() : String(payload?.sub ?? "").trim();
    } catch {
        return "";
    }
};

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

// Normaliza roles: convierte a array, limpia espacios, traduce alias de LDAP y
// filtra valores vacíos.
const normalizeRoles = (roles) => {
    if (!Array.isArray(roles)) return [];
    return roles
        .map((role) => String(role || "").trim())
        .filter(Boolean)
        .map((role) => ROLE_ALIASES[role] || role);
};

export const createAuthSession = ({ userId, token = "", roles = [], numericUserId = null }) => {
    const safeUserId = String(userId || "").trim();
    if (!safeUserId) return;
    const safeToken = String(token || "").trim();

    const session = {
        userId: safeUserId,                    // username for URL routing
        numericUserId: numericUserId ?? safeUserId,  // numeric ID for API calls
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
    // En producción el sub es el username; en DEV es el id numérico. Ambos
    // deben coincidir con lo que espera AuthorityCheck en el backend.
    const tokenSubject = getTokenSubject(session?.token);
    if (tokenSubject) return tokenSubject;
    return String(session?.userId || "").trim();
};

export const getSessionNumericUserId = () => {
    const session = readSession();
    return session?.numericUserId ?? session?.userId ?? "";
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
