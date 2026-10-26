import { useEffect, useRef, useState } from "react";
import LoadingModal from "../../../shared/ui/LoadingModal";

// La recuperación de contraseña quedó incompleta en el backend: no existe un
// endpoint que busque al usuario por `codUsuario`, genere el token y lo envíe
// por correo (las rutas legacy `/api/send-code` y `/api/validate-token` ya no
// existen). En lugar de simular un éxito, este componente reporta el bloqueo
// de forma explícita para que la UI no navegue a una pantalla inutilizable.
const UNAVAILABLE_MESSAGE =
    "La recuperación de contraseña no está disponible por ahora. Contacta a soporte para restablecer tu acceso.";

function UserIdFetcher({ onDataLoaded, userCode }) {
    const [loading, setLoading] = useState(false);
    const callbackRef = useRef(onDataLoaded);

    useEffect(() => {
        callbackRef.current = onDataLoaded;
    }, [onDataLoaded]);

    useEffect(() => {
        if (!userCode) {
            setLoading(false);
            if (callbackRef.current) callbackRef.current(null);
            return;
        }

        setLoading(false);
        if (callbackRef.current) {
            callbackRef.current({ success: false, message: UNAVAILABLE_MESSAGE });
        }
    }, [userCode]);

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

export { UNAVAILABLE_MESSAGE };
export default UserIdFetcher;
