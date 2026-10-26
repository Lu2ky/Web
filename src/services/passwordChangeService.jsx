const PASSWORD_CHANGE_ENDPOINT = import.meta.env.VITE_API_PASSWORD_CHANGE || import.meta.env.VITE_API_CHANGE_PASSWORD;

function buildPasswordEndpointCandidates(rawEndpoint) {
    const normalized = String(rawEndpoint || "").trim();
    if (!normalized) return [];

    const variants = new Set();
    variants.add(normalized);
    variants.add(normalized.endsWith("/") ? normalized.slice(0, -1) : `${normalized}/`);

    if (/\/api\/change-password\/?$/i.test(normalized)) {
        const modern = normalized.replace(/\/api\/change-password\/?$/i, "/api/auth/changepassword");
        variants.add(modern);
        variants.add(modern.endsWith("/") ? modern.slice(0, -1) : `${modern}/`);
    }

    return Array.from(variants);
}

function validatePasswordComplexity(password) {
    const value = String(password || "");

    if (value.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (!/[a-z]/.test(value)) return "La contraseña debe incluir al menos una letra minúscula";
    if (!/[A-Z]/.test(value)) return "La contraseña debe incluir al menos una letra mayúscula";
    if (!/\d/.test(value)) return "La contraseña debe incluir al menos un número";
    if (!/[^A-Za-z0-9\s]/.test(value)) return "La contraseña debe incluir al menos un símbolo";

    return null;
}

/**
 * Cambia la contraseña en flujo de recuperacion.
 * Backend espera payload exacto: { user, pass }
 */
export async function changeRecoveredPassword(userId, newPassword) {
    if (!userId || !newPassword) {
        return {
            success: false,
            message: "user y pass son obligatorios"
        };
    }

    if (!PASSWORD_CHANGE_ENDPOINT) {
        return {
            success: false,
            message: "No esta configurado VITE_API_PASSWORD_CHANGE ni VITE_API_CHANGE_PASSWORD"
        };
    }

    const policyError = validatePasswordComplexity(newPassword);
    if (policyError) {
        return {
            success: false,
            message: policyError
        };
    }

    try {
        const endpointCandidates = buildPasswordEndpointCandidates(PASSWORD_CHANGE_ENDPOINT);
        const methodCandidates = ["POST", "PUT"];

        for (const endpoint of endpointCandidates) {
            for (const method of methodCandidates) {
                const response = await fetch(endpoint, {
                    method,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        user: String(userId),
                        pass: String(newPassword)
                    })
                });

                const contentType = response.headers.get("content-type") || "";
                const body = contentType.includes("application/json")
                    ? await response.json()
                    : await response.text();

                if (response.ok) {
                    if (typeof body === "string") {
                        return {
                            success: true,
                            message: body
                        };
                    }

                    return body;
                }

                if (response.status === 404 || response.status === 405) {
                    continue;
                }

                const message = typeof body === "string"
                    ? body
                    : (body?.message || body?.error || `HTTP ${response.status}`);

                return {
                    success: false,
                    message
                };
            }
        }

        return {
            success: false,
            message: "No se encontro endpoint de cambio de contrasena (404/405 en variantes conocidas)."
        };
    } catch (error) {
        console.error("Error al cambiar contrasena (recuperacion):", error);
        return {
            success: false,
            message: error?.message || "Error inesperado"
        };
    }
}
