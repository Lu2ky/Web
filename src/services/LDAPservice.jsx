const baseUrl = import.meta.env.VITE_API_URL_LDAP; // URL para validar usuario
const createUserUrl = import.meta.env.VITE_API_CREATE_USER; // URL para crear usuario

/**
 * Validate user credentials via LDAP
 * @param {string} userId - Username
 * @param {string} password - Password
 * @returns {Promise<object|null>} Authentication result or null
 */
async function LDAPservice(userId, password) {
    try {
        if (!baseUrl) {
            console.error("LDAP endpoint no configurado");
            return null;
        }
        
        const response = await fetch(`${baseUrl}`, {
            method: "POST", 
            headers: {
                "Content-Type": "application/json", // Indicar que envía JSON
            },
            body: JSON.stringify({
                user: userId,
                pass: password
            }), // Convierte el objeto a JSON
        });

        const contentType = response.headers.get("content-type") || "";
        const rawBody = contentType.includes("application/json")
            ? await response.json()
            : await response.text();

        console.log("[LDAP] Raw response body:", rawBody);

        const normalizedBody = typeof rawBody === "object" && rawBody !== null
            ? {
                keys: Object.keys(rawBody),
                hasSuccess: Object.prototype.hasOwnProperty.call(rawBody, "success"),
                hasToken: Object.prototype.hasOwnProperty.call(rawBody, "token")
                    || Object.prototype.hasOwnProperty.call(rawBody, "jwt_token"),
                hasRole: Object.prototype.hasOwnProperty.call(rawBody, "role")
                    || Object.prototype.hasOwnProperty.call(rawBody, "roles")
            }
            : {
                type: typeof rawBody,
                length: String(rawBody || "").length
            };

        console.log("[LDAP] Normalized response shape:", normalizedBody);

        if (response.ok) {
            return rawBody;
        }

        // Para credenciales inválidas, devolver respuesta controlada y evitar mensaje de "fallo servidor".
        if ([400, 401, 403].includes(response.status)) {
            const backendMessage = typeof rawBody === "object"
                ? rawBody?.message
                : String(rawBody || "").trim();

            console.warn("[LDAP] Auth rejected by backend:", {
                status: response.status,
                message: backendMessage || "Usuario o contraseña incorrectos"
            });

            return {
                success: false,
                message: backendMessage || "Usuario o contraseña incorrectos"
            };
        }

        console.error("[LDAP] Unexpected HTTP error:", response.status);
        throw new Error(`Error HTTP: ${response.status}`);
    } catch (error) {
        console.error("Error al validar usuario:", error);
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
    if (!createUserUrl) {
        console.warn("VITE_API_CREATE_USER not configured");
        return null;
    }

    try {
        const response = await fetch(createUserUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user: userId,
                pass: password
            }),
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error al crear usuario:", error);
        return null;
    }
}

export default LDAPservice;
