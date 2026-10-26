// ============================================================================
// Componente ToDoListTagFetcher
// ============================================================================
// Carga las etiquetas de tareas personales del usuario desde la API.
// Normaliza etiquetas desde múltiples formatos API al formato estándar.
// No renderiza elemento visual, solo carga y notifica datos al padre.
// ============================================================================

import { useEffect } from "react";

// Normaliza una etiqueta desde múltiples formatos de API
// Retorna objeto con id y label estandarizado
function normalizeTag(tag, index) {
    if (typeof tag === "string") {
        return { id: `tag-${index}`, label: tag };
    }

    if (tag?.label) {
        return {
            id: tag.id || `tag-${index}`,
            label: tag.label,
            type: tag.type || "custom"
        };
    }

    if (tag?.name) {
        return {
            id: tag.id || `tag-${index}`,
            label: tag.name,
            type: tag.type || "custom"
        };
    }

    // El backend envía { id, nombre }
    if (tag?.nombre) {
        return {
            id: tag.id || `tag-${index}`,
            label: tag.nombre,
            type: tag.type || "custom"
        };
    }

    return null;
}

function ToDoListTagFetcher({ onDataLoaded, userId }) {
    useEffect(() => {
        const fetchTags = async () => {
            if (!userId) {
                if (onDataLoaded) onDataLoaded([]);
                return;
            }

            try {
                const baseUrl = import.meta.env.VITE_API_URL_TAGS_USER;
                // Cabecera Authorization.
                const tokenLocalStore = localStorage.getItem("token") || "";
                const token = `Bearer ${tokenLocalStore}`;

                const response = await fetch(`${baseUrl}${userId}`, {
                    method: "GET",
                    headers: {
                        "Authorization": token,
                    },
                });
                const json = await response.json();
                const rawData = Array.isArray(json?.data)
                    ? json.data
                    : Array.isArray(json)
                    ? json
                    : [];
                const normalizedTags = rawData.map(normalizeTag).filter(Boolean);
                // Quitar duplicados por id para evitar colisiones de key en React
                const seen = new Set();
                const dedupedTags = normalizedTags.filter(t => {
                    if (seen.has(t.id)) return false;
                    seen.add(t.id);
                    return true;
                });

                if (onDataLoaded) {
                    onDataLoaded(dedupedTags);
                }
            } catch (error) {
                console.error("Error al cargar tags del To-Do:", error);
                if (onDataLoaded) {
                    onDataLoaded([]);
                }
            }
        };

        fetchTags();
    }, [onDataLoaded, userId]);

    return null;
}


export default ToDoListTagFetcher;
