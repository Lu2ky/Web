// Página de cambio de contraseña
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { changeRecoveredPassword } from './services/passwordChangeService.jsx';

import Logo from './assets/logo.png';
import Image from './assets/ImagePassword.jpeg';
import './RestorePassword.css';

function validatePasswordComplexity(password) {
    const value = String(password || "");

    if (value.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (!/[a-z]/.test(value)) return "La contraseña debe incluir al menos una letra minúscula";
    if (!/[A-Z]/.test(value)) return "La contraseña debe incluir al menos una letra mayúscula";
    if (!/\d/.test(value)) return "La contraseña debe incluir al menos un número";
    if (!/[^A-Za-z0-9\s]/.test(value)) return "La contraseña debe incluir al menos un símbolo";

    return null;
}

const RestorePassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const recoveryUser = location.state?.userCode || '';

    // Estados

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');


        // Validar nueva contraseña
        if (!newPassword.trim()) {
            setError("Por favor ingresa una nueva contraseña");
            return;
        }

        const policyError = validatePasswordComplexity(newPassword);
        if (policyError) {
            setError(policyError);
            return;
        }

        // Validar confirmación
        if (!confirmPassword.trim()) {
            setError("Por favor confirma tu nueva contraseña");
            return;
        }

        // Validar que coincidan
        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setIsLoading(true);

        try {
            if (!recoveryUser) {
                setError("No se encontro el usuario de recuperacion. Reinicia el flujo desde 'Olvide mi contrasena'.");
                return;
            }

            const result = await changeRecoveredPassword(recoveryUser, newPassword);
            if (!result || result.success === false) {
                console.error("Error al cambiar contrasena:", result?.message);
                setError("No se pudo actualizar la contrasena");
                return;
            }

            setSuccess("¡Contraseña actualizada exitosamente! Redirigiendo...");

            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err) {
            setError("Error al actualizar la contraseña");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='ContainerRestore'
            style={{ backgroundImage: `url(${Image})` }}>
            <div className='wrapperRestore'>
                <form onSubmit={handleChangePassword}>
                    <img src={Logo} alt="Logo" className="logoRestore" />
                    <h1>Restaurar Contraseña</h1>
                    <h2 className='subtitle'>Por favor ingresa tu nueva contraseña</h2>
                    {/* Campo: Nueva contraseña */}
                    <div className="input-box">
                        <input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Nueva Contraseña"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                        <span
                            className="toggle-password-recover"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>

                    {/* Campo: Confirmar contraseña */}
                    <div className="input-box">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirmar Contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                        <span
                            className="toggle-password-recover"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>

                    {/* Indicador de coincidencia en tiempo real */}
                    {confirmPassword.length > 0 && (
                        <div className={`password-match-indicator ${newPassword === confirmPassword ? 'match' : 'no-match'}`}>
                            {newPassword === confirmPassword
                                ? "✓ Las contraseñas coinciden"
                                : "✗ Las contraseñas no coinciden"
                            }
                        </div>
                    )}

                    <button type="submit" className="btn" disabled={isLoading}>
                        {isLoading ? "Actualizando..." : "Cambiar Contraseña"}
                    </button>
                    <button
                        type="button"
                        className="btn-return"
                        onClick={() => navigate('/')}
                        disabled={isLoading}
                    >
                        Volver
                    </button>
                </form>
            </div>
        </div>
    );
}

export default RestorePassword;