import { useEffect, useRef, useState } from "react";
import LoadingModal from "../../../shared/ui/LoadingModal";
import { apiClient } from "../../../shared/api/apiClient";

// Valida el token de recuperación de contraseña contra la API.
// Contrato: POST /tokens/get { userId, token } -> { userId } | 401
// `onDataLoaded` recibe { success, message } y el padre decide la navegación.
function TokenFetcher({ onDataLoaded, passwordResetToken, userId }) {
    const [loading, setLoading] = useState(false);
    const callbackRef = useRef(onDataLoaded);

    useEffect(() => {
        callbackRef.current = onDataLoaded;
    }, [onDataLoaded]);

    useEffect(() => {
        const notify = (result) => {
            if (callbackRef.current) callbackRef.current(result);
        };

        if (!passwordResetToken || !userId) {
            setLoading(false);
            notify(null);
            return;
        }

        let cancelled = false;
        setLoading(true);

        const validateToken = async () => {
            try {
                await apiClient.post("/tokens/get", {
                    userId: String(userId),
                    token: String(passwordResetToken),
                });

                if (!cancelled) {
                    notify({ success: true, message: "Token válido" });
                }
            } catch (error) {
                const message = error?.status === 401
                    ? "El código es inválido o expiró. Solicita uno nuevo."
                    : (error?.message || "No se pudo validar el código");

                if (!cancelled) {
                    notify({ success: false, message });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        validateToken();

        return () => {
            cancelled = true;
        };
    }, [passwordResetToken, userId]);

    if (loading) {
        return (
            <LoadingModal
                isOpen={loading}
                title="Validando token de recuperación"
            />
        );
    }

    return null;
}

export default TokenFetcher;
