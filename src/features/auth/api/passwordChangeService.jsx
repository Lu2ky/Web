// ============================================================================
// Cambio de contraseña en el flujo de recuperación
// ============================================================================
// Contrato real de `apps/api-go`:
//   POST /auth/change-password  { user, pass } -> { message }
// `user` es el nombre de usuario (codUsuario), no el id numérico.
// ============================================================================

import { apiClient } from "../../../shared/api/apiClient";

export function validatePasswordComplexity(password) {
    const value = String(password || "");

    if (value.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (!/[a-z]/.test(value)) return "La contraseña debe incluir al menos una letra minúscula";
    if (!/[A-Z]/.test(value)) return "La contraseña debe incluir al menos una letra mayúscula";
    if (!/\d/.test(value)) return "La contraseña debe incluir al menos un número";
    if (!/[^A-Za-z0-9\s]/.test(value)) return "La contraseña debe incluir al menos un símbolo";

    return null;
}

/**
 * Cambia la contraseña en el flujo de recuperación.
 * @param {string} userId - codUsuario del usuario.
 * @param {string} newPassword
 */
export async function changeRecoveredPassword(userId, newPassword) {
    const safeUser = String(userId || "").trim();

    if (!safeUser || !newPassword) {
        return {
            success: false,
            message: "user y pass son obligatorios",
        };
    }

    const policyError = validatePasswordComplexity(newPassword);
    if (policyError) {
        return {
            success: false,
            message: policyError,
        };
    }

    try {
        const body = await apiClient.post("/auth/change-password", {
            user: safeUser,
            pass: String(newPassword),
        });

        return {
            success: true,
            message: body?.message || "Contraseña cambiada correctamente",
        };
    } catch (error) {
        return {
            success: false,
            message: error?.message || "Error inesperado al cambiar la contraseña",
        };
    }
}
