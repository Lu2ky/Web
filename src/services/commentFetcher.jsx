import { useEffect, useState, useRef } from "react";

// Componente para cargar comentarios de la API y pasarlos al padre
// onDataLoaded se lanza cuando llegan los datos
// userId y courseId se concatenan para formar la ruta de la API

function CommentFetcher({ onDataLoaded, userId, courseId }) {
    const onDataLoadedRef = useRef(onDataLoaded);
    onDataLoadedRef.current = onDataLoaded;

    useEffect(() => {
        // Solo fetch cuando ambos identificadores estén disponibles
        if (!userId || !courseId) {
            if (onDataLoadedRef.current) onDataLoadedRef.current([]);
            return;
        }

        const baseUrl = import.meta.env.VITE_API_URL_COMMENTS; // URL base de comentarios

        const fetchData = async () => {
            try {
                const response = await fetch(`${baseUrl}${userId}/${courseId}`);
                const json = await response.json();
                // Backend returns { success, data: [...] }
                const comments = Array.isArray(json?.data)
                    ? json.data
                    : Array.isArray(json)
                        ? json
                        : [];
                if (onDataLoadedRef.current) onDataLoadedRef.current(comments);
            } catch (error) {
                console.error("Error al cargar comentarios:", error);
                if (onDataLoadedRef.current) onDataLoadedRef.current([]);
            }
        };

        fetchData();
    }, [userId, courseId]);

    return null; // no renderiza contenido propio
}

export default CommentFetcher;
