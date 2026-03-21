const AUTH_STORAGE_KEY = "auth_session";

export const ROLE_ADMIN_UPB_PLANNER = "admin_upb_planner";
export const ROLE_USUARIOS = "Usuarios";

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

const normalizeRoles = (roles) => {
    if (!Array.isArray(roles)) return [];
    return roles
        .map((role) => String(role || "").trim())
        .filter(Boolean);
};

export const createAuthSession = ({ userId, token = "", roles = [] }) => {
    const safeUserId = String(userId || "").trim();
    if (!safeUserId) return;

    const session = {
        userId: safeUserId,
        token: String(token || ""),
        roles: normalizeRoles(roles),
        createdAt: Date.now()
    };

    writeSession(session);
    if (session.token) {
        // Mantener compatibilidad con código legado que aún lee este valor.
        localStorage.setItem("token", session.token);
    }
};

export const getAuthSession = () => readSession();

export const isAuthenticated = () => {
    const session = readSession();
    return Boolean(session?.userId);
};

export const clearAuthSession = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("token");
};

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

    if (roles.includes(ROLE_ADMIN_UPB_PLANNER)) {
        return "/AdminView";
    }

    if (roles.includes(ROLE_USUARIOS) && userId) {
        return `/app/${userId}`;
    }

    return "/";
};
