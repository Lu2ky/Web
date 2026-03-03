import { useEffect } from "react";
async function fetchTagsByUser(userId) {
    const baseUrl = import.meta.env.VITE_API_URL_TAGS_USER || '';

    if (!baseUrl) {
        throw new Error('VITE_API_URL_TAGS_USER no está definida en las variables de entorno');
    }

    // Si no hay userId, no intentamos llamar a la API (consistente con otros fetchers)
    if (!userId) return [];

    // Muchas rutas en este proyecto usan la forma baseUrl + userId
    const url = `${baseUrl}${userId}`;

    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error al obtener tags: ${res.status} ${text}`);
    }

    const json = await res.json();
    const data = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json)
        ? json
        : [];

    return data;
}

function normalizeTag(tag, index) {
    console.log("Normalizando tag:", tag);
    
    if (typeof tag === "string") {
        return { id: `tag-${index}`, label: tag, type: "custom" };
    }

    // Intentar obtener label de diferentes propiedades posibles
    const label = tag?.label || tag?.name || tag?.nombre || tag?.tag || tag?.etiqueta || tag?.LABEL || tag?.NAME || tag?.NOMBRE || null;
    const id = tag?.id || tag?.ID || tag?.Id || `tag-${index}`;
    const type = tag?.type || tag?.tipo || tag?.TYPE || "custom";

    if (label) {
        return { id, label, type };
    }

    // Backend sends { id, nombre }
    if (tag?.nombre) {
        return {
            id: tag.id || `tag-${index}`,
            label: tag.nombre,
            type: tag.type || "custom"
        };
    }

    return null;
}

<<<<<<< Updated upstream
function ToDoListTagFetcher({ onDataLoaded, userId }) {
=======
function ToDoListTagFetcher({ onDataLoaded, userId }) { 
>>>>>>> Stashed changes
    useEffect(() => {
        const fetchTags = async () => {
            if (!userId) {
                if (onDataLoaded) onDataLoaded([]);
                return;
            }

            try {
<<<<<<< Updated upstream
                const baseUrl = import.meta.env.VITE_API_URL_TAGS_USER;
                const response = await fetch(`${baseUrl}${userId}`);
                const json = await response.json();
                const rawData = Array.isArray(json?.data)
                    ? json.data
                    : Array.isArray(json)
                    ? json
                    : [];
=======
                // fetchTagsByUser ya devuelve el array de tags directamente
                const rawData = await fetchTagsByUser(userId);
                console.log("Tags recibidos de la API:", rawData);
>>>>>>> Stashed changes
                const normalizedTags = rawData.map(normalizeTag).filter(Boolean);
                console.log("Tags normalizados:", normalizedTags);

                if (onDataLoaded) {
                    onDataLoaded(normalizedTags);
                }
            } catch (error) {
                console.error("Error al cargar tags del To-Do:", error);
                if (onDataLoaded) {
                    onDataLoaded([]);
                }
            }
        };

<<<<<<< Updated upstream
        fetchTags();
=======
        if (userId) {
            fetchTags();
        }
>>>>>>> Stashed changes
    }, [onDataLoaded, userId]);

    return null;
}

export default ToDoListTagFetcher;
