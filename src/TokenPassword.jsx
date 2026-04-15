// Componente para la verificación del token de recuperación de contraseña

import { useEffect, useRef, useState } from "react";
import Logo from './assets/logo.png';
import Image from './assets/ImageRecover.webp';
import './TokenPassword.css';
import { useLocation, useNavigate } from 'react-router-dom';
import TokenFetcher from './services/TokenFetcher';
import { getUserData } from './services/userService';

// Componente para la verificación del token de recuperación de contraseña
const TokenPassword = () => {
    // Utilidad para navegar entre rutas
    const navigate = useNavigate();
    const location = useLocation();
    // Estado para almacenar los dígitos del token, inicializado con 6 campos vacíos
    const [token, setToken] = useState(["", "", "", "", "", ""]);
    const [submittedToken, setSubmittedToken] = useState('');
    const [feedback, setFeedback] = useState('');
    const [dbUserId, setDbUserId] = useState('');
    // Referencia para manejar el enfoque de los inputs (es decir el lugar donde se digita el número)
    const inputsRef = useRef([]);

    useEffect(() => {
        let isMounted = true;

        const resolveDbUserId = async () => {
            const recoveryUserCode = location.state?.userCode || '';
            if (!recoveryUserCode) {
                if (isMounted) {
                    setDbUserId('');
                }
                return;
            }

            try {
                // Se usa userService para obtener el idUsuario real de BD.
                const currentData = await getUserData(recoveryUserCode);

                const currentUser = Array.isArray(currentData) ? currentData[0] : currentData;
                const actualUserId = currentUser?.idUsuario || currentUser?.id || Number(recoveryUserCode);

                if (isMounted) {
                    setDbUserId(actualUserId ? String(actualUserId) : '');
                }
            } catch (error) {
                console.error('Error resolving DB user ID in TokenPassword:', error);
                if (isMounted) {
                    setDbUserId('');
                }
            }
        };

        resolveDbUserId();

        return () => {
            isMounted = false;
        };
    }, [location.state?.userCode]);
    // Función para manejar el cambio en los inputs del token
    const handleChange = (value, index) => {
        // Solo permite dígitos numéricos
        if (!/^\d?$/.test(value)) return;
        // Actualiza el estado del token con el nuevo valor
        const newToken = [...token];
        // Reemplaza el valor en la posición correspondiente
        newToken[index] = value;
        // Actualiza el estado del token
        setToken(newToken);
        // Si el valor es válido y no es el último campo, mueve el enfoque al siguiente input
        if (value && index < 5) {
            // Mueve el enfoque al siguiente input
            inputsRef.current[index + 1].focus();
        }
    };
    // Función para manejar la tecla "eliminar" y mover el enfoque al campo anterior si el campo actual está vacío
    const handleKeyDown = (e, index) => {
        // Si se presiona "Backspace", el campo actual está vacío y no es el primer campo, mueve el enfoque al campo anterior
        if (e.key === "Backspace" && !token[index] && index > 0) {
            // Mueve el enfoque al campo anterior
            inputsRef.current[index - 1].focus();
        }
    };
    // Función para manejar el evento de pegar (paste) en los inputs del token
    const handlePaste = (e) => {
        // Obtiene el texto pegado, elimina cualquier carácter que no sea un dígito y limita a los primeros 6 caracteres
        const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        // Crea un nuevo array para el token con los dígitos pegados y rellena con campos vacíos si es necesario
        const newToken = paste.split("");
        // Actualiza el estado del token con los nuevos valores, asegurándose de que tenga 6 campos
        setToken([...newToken, ...Array(6 - newToken.length).fill("")]);
        // Actualiza los valores de los inputs con los dígitos pegados
        newToken.forEach((_, i) => {
            // Si el input existe, actualiza su valor con el dígito correspondiente
            if (inputsRef.current[i]) {
                // Actualiza el valor del input con el dígito pegado
                inputsRef.current[i].value = newToken[i];
            }
        });
    };
    // Función para manejar el envío del formulario
    const handleSubmit = (e) => {
        // Evita el comportamiento predeterminado del formulario (recargar la página)
        e.preventDefault();
        // Combina los dígitos del token en una sola cadena
        const finalToken = token.join("");
        // Valida que el token tenga exactamente 6 dígitos, si no muestra una alerta y no continúa con la verificación
        if (finalToken.length !== 6) {
            alert("El token debe tener 6 dígitos");
            return;
        }

        if (!dbUserId) {
            alert("No se pudo obtener el ID real del usuario. Vuelve a iniciar el flujo.");
            return;
        }

        setSubmittedToken(finalToken);
    };

    const handleTokenResult = (result) => {
        if (!result) {
            console.error('Error al procesar validación de token');
            return;
        }

        const isSuccess = result.success !== false;
        if (isSuccess) {
            setFeedback('Token validado correctamente.');
            navigate('/RestorePassword', {
                state: {
                    userCode: location.state?.userCode || '',
                    userId: dbUserId,
                    token: submittedToken
                }
            });
            return;
        }

        // Error en validación de token: se loguea en consola, no se muestra al usuario
        console.error('Error en validación de token:', result.message);
        setSubmittedToken('');
    };

    return (
        <div className='ContainerToken' style={{ backgroundImage: `url(${Image})` }}>
            <div className='wrapperToken'>
                <form onSubmit={handleSubmit}>
                    <img src={Logo} alt="Logo" className="logo" />

                    <h1>Recuperar Contraseña</h1>
                    <h2 className='subtitle'>
                        Ingresa el código de 6 dígitos enviado a tu correo
                    </h2>

                    <div className="otp-container" onPaste={handlePaste}>
                        {token.map((digit, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength={1}
                                value={digit}
                                ref={(el) => (inputsRef.current[index] = el)}
                                onChange={(e) => handleChange(e.target.value, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                            />
                        ))}
                    </div>

                    <button type="submit" className="btn" disabled={token.join("").length !== 6}>
                        Verificar
                    </button>

                    {feedback && <p>{feedback}</p>}

                    <button type="button" className="btn-return" onClick={() => navigate('/')}>
                        Volver
                    </button>
                </form>
                {submittedToken && (
                    <TokenFetcher
                        passwordResetToken={submittedToken}
                        userId={dbUserId}
                        onDataLoaded={handleTokenResult}
                    />
                )}
            </div>
        </div>
    );
};

export default TokenPassword;