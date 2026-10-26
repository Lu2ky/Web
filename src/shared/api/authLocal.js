import { apiClient } from './apiClient';

/**
 * Servicio de autenticación local
 * Reemplaza LDAPservice - usa endpoints locales de autenticación
 */

/**
 * @typedef {Object} AuthResult
 * @property {boolean} success
 * @property {string} [message]
 * @property {string} [token]
 * @property {Object} [user]
 * @property {string} user.username
 * @property {string[]} user.roles
 */

/**
 * @typedef {Object} UserInfo
 * @property {string} username
 * @property {string[]} roles
 */

/**
 * Inicia sesión con credenciales locales
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña
 * @returns {Promise<AuthResult>} Resultado de la autenticación
 */
export async function loginLocal(username, password) {
    try {
        const result = await apiClient.post('/auth/login', {
            username,
            password
        });
        return {
            success: true,
            token: result.Token,
            user: result.UserAuth
        };
    } catch (error) {
        if (error.status && [400, 401, 403].includes(error.status)) {
            return {
                success: false,
                message: error.message || "Usuario o contraseña incorrectos"
            };
        }
        return { success: false, message: "Error de conexión" };
    }
}

/**
 * Registra un nuevo usuario
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña
 * @param {string} fullName - Nombre completo
 * @param {string} email - Email
 * @returns {Promise<AuthResult>} Resultado del registro
 */
export async function registerLocal(username, password, fullName, email) {
    try {
        const result = await apiClient.post('/auth/register', {
            username,
            password,
            full_name: fullName,
            email
        });
        return {
            success: true,
            token: result.Token,
            user: result.UserAuth
        };
    } catch (error) {
        if (error.status && [400, 401, 403, 409].includes(error.status)) {
            return {
                success: false,
                message: error.message || "Error en el registro"
            };
        }
        return { success: false, message: "Error de conexión" };
    }
}

/**
 * Valida credenciales sin iniciar sesión (para formularios)
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function validateCredentials(username, password) {
    try {
        const result = await apiClient.post('/auth/validate-user', {
            username,
            password
        });
        return { success: result.success, message: result.message };
    } catch (error) {
        if (error.status === 401) {
            return { success: false, message: "Usuario o contraseña incorrectos" };
        }
        return { success: false, message: "Error de validación" };
    }
}

/**
 * Cambia la contraseña del usuario autenticado
 * @param {string} currentPassword - Contraseña actual
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function changePasswordLocal(currentPassword, newPassword) {
    try {
        await apiClient.post('/auth/change-password', {
            current_password: currentPassword,
            new_password: newPassword
        });
        return { success: true, message: "Contraseña cambiada correctamente" };
    } catch (error) {
        if (error.status && [400, 401, 403].includes(error.status)) {
            return {
                success: false,
                message: error.message || "Error cambiando contraseña"
            };
        }
        return { success: false, message: "Error de conexión" };
    }
}

/**
 * Solicita restablecimiento de contraseña por email
 * @param {string} email - Email del usuario
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function requestPasswordReset(email) {
    try {
        await apiClient.post('/auth/forgot-password', { email });
        return { success: true, message: "Si el email existe, recibirás instrucciones" };
    } catch (error) {
        return { success: false, message: error.message || "Error solicitando reset" };
    }
}

/**
 * Restablece la contraseña con token
 * @param {string} token - Token de restablecimiento
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function resetPassword(token, newPassword) {
    try {
        await apiClient.post('/auth/reset-password', {
            token,
            new_password: newPassword
        });
        return { success: true, message: "Contraseña restablecida correctamente" };
    } catch (error) {
        if (error.status && [400, 401].includes(error.status)) {
            return {
                success: false,
                message: error.message || "Token inválido o expirado"
            };
        }
        return { success: false, message: "Error de conexión" };
    }
}

/**
 * Valida el token JWT actual
 * @returns {Promise<boolean>}
 */
export async function validateToken() {
    try {
        const result = await apiClient.get('/auth/validate-token');
        return result.status === true;
    } catch {
        return false;
    }
}

/**
 * Obtiene información del usuario actual
 * @returns {Promise<UserInfo | null>}
 */
export async function getCurrentUser() {
    try {
        // The user info is in the JWT token, we can decode it client-side
        const token = localStorage.getItem('token');
        if (!token) return null;
        
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
            username: payload.UserID || payload.sub,
            roles: payload.Roles || []
        };
    } catch {
        return null;
    }
}

export default {
    login: loginLocal,
    register: registerLocal,
    validate: validateCredentials,
    changePassword: changePasswordLocal,
    requestPasswordReset,
    resetPassword,
    validateToken,
    getCurrentUser
};