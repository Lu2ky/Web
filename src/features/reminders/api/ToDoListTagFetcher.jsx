// ============================================================================
// Componente ToDoListTagFetcher
// ============================================================================
// Carga las etiquetas de tareas personales del usuario desde la API.
// Normaliza etiquetas desde múltiples formatos API al formato estándar.
// No renderiza elemento visual, solo carga y notifica datos al padre.
// ============================================================================

import { useEffect } from "react";
import { useReminderTags } from "./useReminders";

// Normaliza una etiqueta desde múltiples formatos de API
// Retorna objeto con id y label estandarizado
function normalizeTag(tag, index) {
    if (typeof tag === "string") {
        return { id: `tag-${index}`, label: tag, type: "custom" };
    }

    if (tag?.B_isDeleted === true || tag?.B_tag_isDeleted === true) {
        return null;
    }

    // Formato de `GET /reminders/users/:id/tags`.
    if (tag?.T_tag_nombre) {
        return {
            id: tag.N_idEtiqueta ?? tag.N_idRecordatorio ?? `tag-${index}`,
            label: String(tag.T_tag_nombre),
            type: "custom",
        };
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

    // Formato de `GET /tags/users/:id`.
    if (tag?.T_nombre) {
        return {
            id: tag.N_idEtiqueta ?? tag.id ?? `tag-${index}`,
            label: String(tag.T_nombre),
            type: tag.type || "custom",
        };
    }

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
    const { data, isLoading, error } = useReminderTags(userId);

    useEffect(() => {
        if (!isLoading && data !== undefined) {
            if (error) {
                console.error("Error al cargar tags del To-Do:", error);
                onDataLoaded?.([]);
                return;
            }
            
            const rawData = Array.isArray(data?.data)
                ? data.data
                : Array.isArray(data)
                ? data
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
        }
    }, [data, isLoading, error, onDataLoaded]);

    return null;
}


export default ToDoListTagFetcher;
