const baseUrl = import.meta.env.VITE_API_URL_LDPA;

async function LDAPservice(userId, password) {
    try {
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
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const result = await response.json(); // Respuesta del servidor
        console.log("Actividad creada:", result);
        return result;
    } catch (error) {
        console.error("Error al crear actividad:", error);
        return null;
    }
}

export default LDAPservice;