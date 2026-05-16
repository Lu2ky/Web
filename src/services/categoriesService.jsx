let cachedCategories = null; // Declaración de caché para categorías

export async function getCategories() {
    // Si ya están en caché, las devuelve
    if (cachedCategories) { 
        return cachedCategories;
    }

    try { // Llama a la API 
        const baseUrl = import.meta.env.VITE_API_URL_COURSE_TYPES;
        const tokenLocalStore = localStorage.getItem("token") || "";
        const token = `Bearer ${tokenLocalStore}`;

        const response = await fetch(baseUrl, {
            headers: {
                "Authorization": token,
            },
        });

        if (!response.ok) {
            //console.error(`Error al cargar categorías: ${response.statusText}`); // Log del error específico
            throw new Error(`Error HTTP: ${response.status}`);
        } // Error si la respuesta no es exitosa

        const data = await response.json(); // Convierte la respuesta a JSON

        // Guardar en caché
        cachedCategories = data;
        return data; // Devuelve las categorías obtenidas de la API
    } catch (error) {
        //console.error(`Error al cargar categorías: ${error.message}`); // Manejo de errores, muestra el error en consola

        // Respaldo: devolver lista estática si falla la API
        const fallback = [
            "Teoría",
            "Laboratorio",
            "Cultural",
            "Deportiva",
            "Centro de lenguas",
            "Pastoral",
            "Personal",
        ];
        cachedCategories = fallback; // Guarda el respaldo en caché para futuros llamados
        return fallback; // Lo devuelve solo si la API falla
    }
}

