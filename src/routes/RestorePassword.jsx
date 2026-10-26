// Página de cambio de contraseña
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaCheckCircle, FaRegCircle, FaExclamationCircle } from "react-icons/fa";
import { changeRecoveredPassword } from '../services/passwordChangeService.jsx';

import Logo from '../assets/logo.png';
import Image from '../assets/ImagePassword.webp';
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

function getPasswordChecklist(password, previousPassword, backendRejectedAsSame) {
    const value = String(password || "");
    const previous = String(previousPassword || "");

    return [
        {
            id: "min-length",
            label: "Al menos 8 caracteres",
            met: value.length >= 8,
        },
        {
            id: "lowercase",
            label: "Al menos una letra minúscula",
            met: /[a-z]/.test(value),
        },
        {
            id: "uppercase",
            label: "Al menos una letra mayúscula",
            met: /[A-Z]/.test(value),
        },
        {
            id: "number",
            label: "Al menos un número",
            met: /\d/.test(value),
        },
        {
            id: "symbol",
            label: "Al menos un símbolo",
            met: /[^A-Za-z0-9\s]/.test(value),
        },
        {
            id: "different-previous",
            label: "Debe ser diferente a la contraseña anterior",
            met: previous.length > 0
                ? (value.length > 0 && value !== previous)
                : (value.length > 0 && !backendRejectedAsSame),
        },
    ];
}

const RestorePassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const recoveryUser = location.state?.userCode || '';
    const previousPasswordFromState = location.state?.previousPassword || '';

    // Estados

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sameAsPreviousRejected, setSameAsPreviousRejected] = useState(false);

    const passwordChecklist = getPasswordChecklist(
        newPassword,
        previousPasswordFromState,
        sameAsPreviousRejected
    );
    const metCriteriaCount = passwordChecklist.filter((criteria) => criteria.met).length;
    const checklistProgress = Math.round((metCriteriaCount / passwordChecklist.length) * 100);
    const showMatchHint = confirmPassword.length > 0;
    const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');


        // Validar nueva contraseña
        if (!newPassword.trim()) {
            setError("Por favor ingresa una nueva contraseña");
            return;
        }

        if (
            previousPasswordFromState
            && newPassword === String(previousPasswordFromState)
        ) {
            setError("La nueva contraseña debe ser diferente a la anterior");
            setSameAsPreviousRejected(true);
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

                const backendMessage = String(result?.message || "");
                const indicatesSameAsPrevious =
                    /(misma|igual)/i.test(backendMessage)
                    || (/diferente/i.test(backendMessage) && /(anterior|previa|actual)/i.test(backendMessage));

                if (indicatesSameAsPrevious) {
                    setSameAsPreviousRejected(true);
                    setError("La nueva contraseña debe ser diferente a la anterior");
                    return;
                }

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

                    {error && <div className="restore-alert restore-alert-error">{error}</div>}
                    {success && <div className="restore-alert restore-alert-success">{success}</div>}

                    {/* Campo: Nueva contraseña */}
                    <div className="input-box">
                        <input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Nueva Contraseña"
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                setSameAsPreviousRejected(false);
                            }}
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

                    <div className="password-checklist" aria-live="polite">
                        <div className="password-checklist-header">
                            <span className="password-checklist-title">Criterios de seguridad</span>
                            <span className="password-checklist-score">{metCriteriaCount}/{passwordChecklist.length}</span>
                        </div>

                        <div className="password-checklist-progress-track" aria-hidden="true">
                            <span
                                className="password-checklist-progress-fill"
                                style={{ width: `${checklistProgress}%` }}
                            />
                        </div>

                        <ul className="password-checklist-list">
                            {passwordChecklist.map((criteria) => (
                                <li
                                    key={criteria.id}
                                    className={`password-checklist-item ${criteria.met ? "met" : "pending"}`}
                                >
                                    <span className="password-checklist-icon" aria-hidden="true">
                                        {criteria.met ? <FaCheckCircle /> : <FaRegCircle />}
                                    </span>
                                    <span>{criteria.label}</span>
                                </li>
                            ))}
                        </ul>
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
                    {showMatchHint && (
                        <p className={`password-match-hint ${passwordsMatch ? "match" : "no-match"}`}>
                            <span aria-hidden="true">
                                {passwordsMatch ? <FaCheckCircle /> : <FaExclamationCircle />}
                            </span>
                            {passwordsMatch ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                        </p>
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