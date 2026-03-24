import { useEffect, useState } from "react";
import LoadingModal from "./LoadingModal";

const RESET_TOKEN_ENDPOINT = import.meta.env.VITE_API_PASSWORD_RESET_TOKEN;

// Componente para cargar y enviar el token de recuperación de contraseña
// onDataLoaded es una función que se llama cuando el token se envía correctamente
// passwordResetToken es el token único que el usuario recibió en su email
function TokenFetcher({ onDataLoaded, passwordResetToken }) {
    const [loading, setLoading] = useState(false); // Estado para controlar la carga
    const [error, setError] = useState(null); // Estado para guardar errores

    // Solo para debugging local; el manejo principal del error vive en el componente padre.
    useEffect(() => {
        if (error) {
            console.warn("TokenFetcher reporto un error:", error);
        }
    }, [error]);

    useEffect(() => {
        // Validar que el token esté presente
        if (!passwordResetToken) {
            setLoading(false);
            setError(null);
            if (onDataLoaded) {
                onDataLoaded(null);
            }
            return;
        }

        // Función asíncrona para enviar el token
        const fetchToken = async () => {
            setLoading(true); // Mostrar indicador de carga
            setError(null); // Limpiar errores previos

            try {
                if (!RESET_TOKEN_ENDPOINT) {
                    const missingConfig = {
                        success: false,
                        message: "No esta configurado"
                    };
                    if (onDataLoaded) {
                        onDataLoaded(missingConfig);
                    }
                    return;
                }

                // Preparar el body antes de enviarlo
                const requestBody = { token: passwordResetToken };
                console.log("Enviando token:", passwordResetToken); // Log para debugging
                console.log("Request body:", requestBody); // Log del body ANTES de enviar

                const response = await fetch(RESET_TOKEN_ENDPOINT, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(requestBody)
                });

                // AHORA sí, procesar la respuesta
                const contentType = response.headers.get("content-type") || "";
                const responseBody = contentType.includes("application/json")
                    ? await response.json()
                    : await response.text();

                console.log("Response body recibido:", responseBody); // Log de la respuesta
                console.log("Response status:", response.status); // Log del status HTTP

                const normalizedResponse = response.ok
                    ? (typeof responseBody === "string" ? { success: true, message: responseBody } : responseBody)
                    : {
                        success: false,
                        message: typeof responseBody === "string" ? responseBody : (responseBody?.message || `HTTP ${response.status}`)
                    };

                console.log("Response normalizada:", normalizedResponse); // Log final

                // Notificar al padre el resultado normalizado
                if (onDataLoaded) {
                    onDataLoaded(normalizedResponse);
                }
            } catch (err) {
                // Capturar y guardar el error
                console.error("Error en TokenFetcher:", err);
                setError(err.message);

                // Notificar al padre del error
                if (onDataLoaded) {
                    onDataLoaded({ success: false, message: err.message || "Error inesperado" });
                }
            } finally {
                // Desactivar el indicador de carga
                setLoading(false);
            }
        };

        fetchToken(); // Ejecutar la función
    }, [onDataLoaded, passwordResetToken]);

    // Mostrar modal de carga mientras se envía el token
    if (loading) {
        return (
            <LoadingModal
                isOpen={loading}
                title="Validando token de recuperación"
            />
        );
    }

    // No renderizar contenido visible, solo enviar datos al padre
    return null;
}

export default TokenFetcher;