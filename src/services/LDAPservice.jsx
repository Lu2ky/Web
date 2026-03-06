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
        console.log("[LDAPservice] Validating user:", userId);
        console.log("[LDAPservice] URL:", baseUrl);
        console.log(baseUrl)
        if (!baseUrl) {
            console.error("[LDAPservice] baseUrl is undefined - VITE_API_URL_LDPA not configured");
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

        if (!response.ok) {
            console.error("[LDAPservice] HTTP Error:", response.status);
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const result = await response.json(); // Respuesta del servidor
        console.log("[LDAPservice] Authentication result:", result); // GUARDAR LA KEY NO MOSTRARLA EN CONSOLA
        return result;
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
        console.log("Usuario creado:", result);
        return result;
    } catch (error) {
        console.error("Error al crear usuario:", error);
        return null;
    }
}

export default LDAPservice;
