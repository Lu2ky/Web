import { apiClient } from './apiClient';

/**
 * Validate user credentials via LDAP
 * Uses centralized apiClient with path-only endpoint
 * @param {string} userId - Username
 * @param {string} password - Password
 * @returns {Promise<object|null>} Authentication result or null
 */
export async function LDAPservice(userId, password) {
    try {
        const result = await apiClient.post('/auth/validate-user', {
            user: userId,
            pass: password
        });
        return result;
    } catch (error) {
        console.error("Error al validar usuario:", error);
        
        // Handle 401/403/400 errors gracefully
        if (error.status && [400, 401, 403].includes(error.status)) {
            return {
                success: false,
                message: error.message || "Usuario o contraseña incorrectos"
            };
        }
        
        return null;
    }
}

/**
 * Create a new user via LDAP
 * @param {string} userId - Username
 * @param {string} password - Password
 * @returns {Promise<object|null>} Creation result or null
 */
export async function createUser(userId, password) {
    try {
        const result = await apiClient.post('/auth/users', {
            username: userId,
            passwordHash: password, // backend expects passwordHash
            role: 'ROLE_USUARIOS'
        });
        return result;
    } catch (error) {
        console.error("Error al crear usuario:", error);
        return null;
    }
}

export default LDAPservice;