import { useState, useRef } from "react";
import Logo from './assets/logo.png';
import Image from './assets/ImageRecover.jpeg';
import './TokenPassword.css';
import { useNavigate } from 'react-router-dom';

// Componente para la verificación del token de recuperación de contraseña
const TokenPassword = () => {
    // Hook para navegar entre rutas
    const navigate = useNavigate();
    // Estado para almacenar los dígitos del token, inicializado con 6 campos vacíos
    const [token, setToken] = useState(["", "", "", "", "", ""]);
    // Referencia para manejar el enfoque de los inputs (es decir el lugar donde se digita el número)
    const inputsRef = useRef([]);
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
        // Agregar conexión al backend para verificar el token aquí
        console.log("Token:", finalToken);
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

                    <button type="button" className="btn-return" onClick={() => navigate('/')}>
                        Volver
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TokenPassword;