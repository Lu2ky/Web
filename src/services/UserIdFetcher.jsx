import { useEffect, useState } from "react";
import LoadingModal from "./LoadingModal";

const RESET_USER_ID_ENDPOINT = import.meta.env.VITE_API_PASSWORD_RESET_ID;

function UserIdFetcher({ onDataLoaded, userCode }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (error) {
            console.warn("UserIdFetcher reporto un error:", error);
        }
    }, [error]);

    useEffect(() => {
        if (!userCode) {
            setLoading(false);
            setError(null);
            if (onDataLoaded) {
                onDataLoaded(null);
            }
            return;
        }

        const fetchUserId = async () => {
            setLoading(true);
            setError(null);

            try {
                if (!RESET_USER_ID_ENDPOINT) {
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
                const requestBody = { "codUsuario": userCode };
                console.log("Enviando codUsuario:", userCode); // Log para debugging
                console.log("Request body:", requestBody); // Log del body ANTES de enviar

                const response = await fetch(RESET_USER_ID_ENDPOINT, {
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

                if (onDataLoaded) {
                    onDataLoaded(normalizedResponse);
                }
            } catch (err) {
                console.error("Error en UserIdFetcher:", err);
                setError(err.message);

                if (onDataLoaded) {
                    onDataLoaded({ success: false, message: err.message || "Error inesperado" });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUserId();
    }, [onDataLoaded, userCode]);

    if (loading) {
        return (
            <LoadingModal
                isOpen={loading}
                title="Validando código de usuario"
            />
        );
    }

    return null;
}

export default UserIdFetcher;