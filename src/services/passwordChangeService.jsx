const PASSWORD_CHANGE_ENDPOINT = import.meta.env.VITE_API_PASSWORD_CHANGE;

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
            message: "No esta configurado VITE_API_PASSWORD_CHANGE"
        };
    }

    try {
        const response = await fetch(PASSWORD_CHANGE_ENDPOINT, {
            method: "POST",
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

        if (!response.ok) {
            const message = typeof body === "string" ? body : (body?.message || `HTTP ${response.status}`);
            return {
                success: false,
                message
            };
        }

        if (typeof body === "string") {
            return {
                success: true,
                message: body
            };
        }

        return body;
    } catch (error) {
        console.error("Error al cambiar contrasena (recuperacion):", error);
        return {
            success: false,
            message: error?.message || "Error inesperado"
        };
    }
}
