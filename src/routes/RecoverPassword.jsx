// ============================================================================
// COMPONENTE: RecoverPassword
// ============================================================================
// Gestiona la primera pantalla del flujo de recuperación de contraseña.
// El usuario ingresa su ID institucional, que se valida con el servidor.
//
// FLUJO:
// 1. Usuario digita ID en el input → actualiza institutionalId
// 2. Usuario hace submit → valida y actualiza submittedUserCode
// 3. submittedUserCode dispara el useEffect del UserIdFetcher
// 4. El servicio hace POST al servidor con USER_CODE
// 5. El servidor responde y handleUserIdResult navega a TokenPassword
// ============================================================================

import { useState } from 'react';
import Logo from '../assets/logo.png';
import Image from '../assets/ImageRecover.webp';
import './RecoverPassword.css';
import { MdPassword } from "react-icons/md"; //  npm install react-icons --save
import { useNavigate } from 'react-router-dom';
import UserIdFetcher from '../services/UserIdFetcher';

const RecoverPassword = () => {
    const navigate = useNavigate();
    const [institutionalId, setInstitutionalId] = useState('');
    const [submittedUserCode, setSubmittedUserCode] = useState('');
    const [feedback, setFeedback] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault(); // Evita recargar la página

        // Normaliza el ID (elimina espacios al inicio/final)
        const normalizedId = institutionalId.trim();
        
        // Valida que el usuario ingresó algo
        if (!normalizedId) {
            setFeedback('Ingresa tu ID institucional para continuar.');
            return;
        }

        // IMPORTANTE: al actualizar submittedUserCode, el useEffect de UserIdFetcher
        // se dispara automáticamente (porque le pasamos submittedUserCode como dependencia)
        setSubmittedUserCode(normalizedId);
    };

    const handleUserIdResult = (result) => {
        // Si result es null, significa que algo falló en el fetcher
        if (!result) {
            console.error('Error al procesar solicitud de recuperación');
            return;
        }

        // Verifica si la respuesta indica éxito
        // (el servidor puede enviar success: true, success: false, etc.)
        const isSuccess = result.success !== false;
        
        if (isSuccess) {
            // Éxito: muestra feedback positivo y navega a TokenPassword
            setFeedback('Código enviado correctamente. Continúa con el token.');
            
            // Navega a TokenPassword pasando el userCode vía state de React Router
            // (para que la siguiente pantalla sepa qué usuario es)
            navigate('/TokenPassword', {
                state: {
                    userCode: submittedUserCode
                }
            });
            return;
        }

        // ERROR: El servidor rechazó el ID (no existe, ya está recuperando, etc.)
        // Loguea el error en consola para debugging, pero no muestra mensaje al usuario
        console.error('Error en validación de ID:', result.message);
        
        // Se resetea submittedUserCode para permitir reintentos
        // Así el usuario puede corregir el ID y hacer submit de nuevo
        setSubmittedUserCode('');
    };

    return (
        <div className='ContainerRecover'
            style={{ backgroundImage: `url(${Image})` }}>
            <div className='wrapperRecovery'>
                <form action="" onSubmit={handleSubmit}>
                    <img src={Logo} alt="Logo" className="logoRecover" />
                    <h1>Recuperar Contraseña</h1>
                    <h2 className='subtitle'>Por favor ingresa tu id institucional vinculado a tu cuenta, sin los ceros. </h2>
                    <div className="input-box">
                        <input type="text"
                            placeholder="ID Institucional"
                            value={institutionalId}
                            onChange={(e) => setInstitutionalId(e.target.value)}
                            required />
                        <MdPassword />
                    </div>

                    {feedback && <p>{feedback}</p>}
                    <button type="submit" className="btn">Recuperar Contraseña</button>
                    <button type="button" className="btn-return" onClick={() => navigate('/')}>
                        Volver
                    </button>
                </form>
                {submittedUserCode && (
                    <UserIdFetcher
                        userCode={submittedUserCode}
                        onDataLoaded={handleUserIdResult}
                    />
                )}
            </div>
        </div>

    );
}
export default RecoverPassword;