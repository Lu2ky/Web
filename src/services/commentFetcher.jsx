import { useEffect, useState } from "react";
import LoadingModal from "./LoadingModal";

// Componente para cargar comentarios de la API y pasarlos al padre
// onDataLoaded se lanza cuando llegan los datos
// userId y courseId se concatenan para formar la ruta de la API

function CommentFetcher({ onDataLoaded, userId, courseId }) {
    const [loading, setLoading] = useState(true); // Indica si la API está cargando
    const [apiData, setApiData] = useState([]); // Almacena los datos de la API

    useEffect(() => {
        // Solo fetch cuando ambos identificadores estén disponibles
        if (!userId || !courseId) {
            setLoading(false);
            setApiData([]);
            if (onDataLoaded) onDataLoaded([]);
            return;
        }

        const baseUrl = import.meta.env.VITE_API_URL_COMMENTS; // URL base de comentarios

        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${baseUrl}${userId}/${courseId}`);
                const json = await response.json();
                if (!json || json.length === 0) {
                    console.log("No hay comentarios");
                    setApiData([]);
                    if (onDataLoaded) onDataLoaded([]);
                } else {
                    console.log("Comentarios cargados:", json);
                    setApiData(json);
                    if (onDataLoaded) onDataLoaded(json);
                }
            } catch (error) {
                console.error("Error al cargar comentarios:", error);
                setApiData([]);
                if (onDataLoaded) onDataLoaded([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [onDataLoaded, userId, courseId]);

    if (loading) {
        return (
            <LoadingModal
                isOpen={loading}
                title="Cargando comentarios"
            />
        );
    }

    return null; // no renderiza contenido propio
}

export default CommentFetcher;
