import { useState, useEffect } from "react";
import { FaEdit, FaTimes, FaCheck } from "react-icons/fa";
import * as userService from "../../services/userService";
import "./UserPreferences.css";

export default function UserPreferences({ userId, onClose }) {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // Estado de edición de correo
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [isSavingEmail, setIsSavingEmail] = useState(false);

    // Estado de anticipación de recordatorios
    const [isEditingAnticipation, setIsEditingAnticipation] = useState(false);
    const [anticipationHours, setAnticipationHours] = useState(0);
    const [anticipationMinutes, setAnticipationMinutes] = useState(0);
    const [isSavingAnticipation, setIsSavingAnticipation] = useState(false);

    // Estado de silenciamiento de notificaciones
    const [isEditingMute, setIsEditingMute] = useState(false);
    const [muteInfo, setMuteInfo] = useState(null);
    const [isSavingMute, setIsSavingMute] = useState(false);
    const [selectedMutePreset, setSelectedMutePreset] = useState(null);

    // Presets de silenciado
    const MUTE_PRESETS = [
        { minutes: 480, label: "8 h" },
        { minutes: 1440, label: "1 día" },
        { minutes: 10080, label: "1 semana" }
    ];

    // Cargar datos del usuario al montar el componente
    useEffect(() => {
        loadUserData();
        loadMuteInfo();
    }, [userId]);

    const loadMuteInfo = () => {
        try {
            const stored = localStorage.getItem("notificationsMute");
            if (stored) {
                const parsed = JSON.parse(stored);
                // Verificar si sigue activo
                if (parsed.muteUntil && Date.now() < parsed.muteUntil) {
                    setMuteInfo(parsed);
                } else {
                    // Expirado, limpiar
                    localStorage.removeItem("notificationsMute");
                    setMuteInfo(null);
                }
            }
        } catch (err) {
            console.error("Error loading mute info:", err);
        }
    };

    const loadUserData = async () => {
        if (!userId) {
            setError("Usuario no disponible");
            setLoading(false);
            return;
        }

        try {
            const data = await userService.getUserData(userId);
            if (data) {
                // Backend puede devolver un array o un objeto
                const userData = Array.isArray(data) ? data[0] : data;
                setUserData(userData);
                setNewEmail(userData.email || userData.correo || "");
                
                // Extraer tiempo de anticipación desde 'antelacionNotis' (formato TIME: HH:MM:SS)
                let totalMinutes = 0;
                const antelacionField = userData.antelacionNotis;
                
                if (antelacionField) {
                    // Si es una cadena en formato TIME (HH:MM:SS)
                    if (typeof antelacionField === 'string' && antelacionField.includes(':')) {
                        const parts = antelacionField.split(':');
                        const hours = parseInt(parts[0]) || 0;
                        const minutes = parseInt(parts[1]) || 0;
                        totalMinutes = hours * 60 + minutes;
                    } 
                    // Si es un objeto con propiedades de horas y minutos
                    else if (typeof antelacionField === 'object' && antelacionField !== null) {
                        const hours = parseInt(antelacionField.hours || antelacionField.horas || 0) || 0;
                        const minutes = parseInt(antelacionField.minutes || antelacionField.minutos || 0) || 0;
                        totalMinutes = hours * 60 + minutes;
                    }
                    // Si ya es un número (minutos totales)
                    else if (typeof antelacionField === 'number') {
                        totalMinutes = antelacionField;
                    }
                }
                
                setAnticipationHours(Math.floor(totalMinutes / 60));
                setAnticipationMinutes(totalMinutes % 60);
                
                setError("");
            } else {
                setError("No se pudieron cargar los datos del usuario");
            }
        } catch (err) {
            setError("Error al cargar los datos del usuario");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Validar formato de correo
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleEditEmail = () => {
        setIsEditingEmail(true);
        setError("");
        setSuccess("");
        window.dispatchEvent(new CustomEvent("onboarding:preferences-email-edit-opened"));
    };

    const handleCancelEmail = () => {
        setIsEditingEmail(false);
        setNewEmail(userData?.email || userData?.correo || "");
        setError("");
    };

    const handleSaveEmail = async (e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("onboarding:preferences-email-saved"));
        setError("");
        setSuccess("");

        const emailToSave = newEmail.trim();
        
        if (!emailToSave) {
            setError("Por favor ingresa un correo electrónico");
            return;
        }

        if (!isValidEmail(emailToSave)) {
            setError("Por favor ingresa un correo electrónico válido");
            return;
        }

        const currentEmail = userData?.email || userData?.correo || "";
        if (emailToSave === currentEmail) {
            setError("El correo nuevo debe ser diferente al actual");
            return;
        }

        setIsSavingEmail(true);

        try {
            const result = await userService.updateUserEmail(userId, emailToSave);

            if (result && (result.success || result.status === "success" || result.ok === true)) {
                setSuccess("Correo actualizado exitosamente");
                setUserData({
                    ...userData,
                    email: emailToSave,
                    correo: emailToSave
                });
                setIsEditingEmail(false);
                
                // Limpiar mensaje de éxito después de 3 segundos
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError(result?.message || "Error al actualizar el correo");
            }
        } catch (err) {
            setError(err?.message || "Error al actualizar el correo");
            console.error(err);
        } finally {
            setIsSavingEmail(false);
        }
    };

    const handleEditAnticipation = () => {
        setIsEditingAnticipation(true);
        setError("");
        setSuccess("");
    };

    const handleCancelAnticipation = () => {
        setIsEditingAnticipation(false);
        
        // Restaurar desde userData
        let totalMinutes = 0;
        const antelacionField = userData?.antelacionNotis;
        
        if (antelacionField) {
            if (typeof antelacionField === 'string' && antelacionField.includes(':')) {
                const parts = antelacionField.split(':');
                const hours = parseInt(parts[0]) || 0;
                const minutes = parseInt(parts[1]) || 0;
                totalMinutes = hours * 60 + minutes;
            } else if (typeof antelacionField === 'object' && antelacionField !== null) {
                const hours = parseInt(antelacionField.hours || antelacionField.horas || 0) || 0;
                const minutes = parseInt(antelacionField.minutes || antelacionField.minutos || 0) || 0;
                totalMinutes = hours * 60 + minutes;
            } else if (typeof antelacionField === 'number') {
                totalMinutes = antelacionField;
            }
        }
        
        setAnticipationHours(Math.floor(totalMinutes / 60));
        setAnticipationMinutes(totalMinutes % 60);
        setError("");
    };

    const handleSaveAnticipation = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const hours = parseInt(anticipationHours) || 0;
        const minutes = parseInt(anticipationMinutes) || 0;
        const totalMinutes = hours * 60 + minutes;

        if (totalMinutes < 0) {
            setError("El tiempo de anticipación no puede ser negativo");
            return;
        }

        if (totalMinutes > 1440) {
            setError("El tiempo de anticipación no puede ser mayor a 24 horas");
            return;
        }

        // Obtener minutos totales actuales desde userData
        let currentTotalMinutes = 0;
        const antelacionField = userData?.antelacionNotis;
        
        if (antelacionField) {
            if (typeof antelacionField === 'string' && antelacionField.includes(':')) {
                const parts = antelacionField.split(':');
                const h = parseInt(parts[0]) || 0;
                const m = parseInt(parts[1]) || 0;
                currentTotalMinutes = h * 60 + m;
            } else if (typeof antelacionField === 'object' && antelacionField !== null) {
                const h = parseInt(antelacionField.hours || antelacionField.horas || 0) || 0;
                const m = parseInt(antelacionField.minutes || antelacionField.minutos || 0) || 0;
                currentTotalMinutes = h * 60 + m;
            } else if (typeof antelacionField === 'number') {
                currentTotalMinutes = antelacionField;
            }
        }
        
        if (totalMinutes === currentTotalMinutes) {
            setError("El nuevo tiempo debe ser diferente al actual");
            return;
        }

        setIsSavingAnticipation(true);

        try {
            const result = await userService.updateReminderAnticipation(userId, totalMinutes);

            if (result && (result.success || result.status === "success" || result.ok === true)) {
                setSuccess("Tiempo de anticipación actualizado exitosamente");
                setUserData({
                    ...userData,
                    antelacionNotis: totalMinutes
                });
                setIsEditingAnticipation(false);
                
                // Limpiar mensaje de éxito después de 3 segundos
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError(result?.message || "Error al actualizar el tiempo de anticipación");
            }
        } catch (err) {
            setError(err?.message || "Error al actualizar el tiempo de anticipación");
            console.error(err);
        } finally {
            setIsSavingAnticipation(false);
        }
    };

    // Mute notifications handlers
    const handleEditMute = () => {
        setIsEditingMute(true);
        setSelectedMutePreset(null);
        setError("");
        setSuccess("");
    };

    const handleCancelMute = () => {
        setIsEditingMute(false);
        setSelectedMutePreset(null);
        setError("");
    };

    const applyMutePreset = (minutes) => {
        setSelectedMutePreset(minutes);
    };

    const handleSaveMute = (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (selectedMutePreset === null) {
            setError("Por favor selecciona una duración");
            return;
        }

        const totalMinutes = selectedMutePreset;

        setIsSavingMute(true);

        try {
            const now = Date.now();
            const muteUntil = now + totalMinutes * 60 * 1000;
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;

            const payload = {
                enabled: true,
                hours,
                minutes,
                totalMinutes,
                muteUntil,
                createdAt: now,
                userId,
            };

            localStorage.setItem("notificationsMute", JSON.stringify(payload));
            setMuteInfo(payload);
            setSuccess("Notificaciones silenciadas correctamente");
            setIsEditingMute(false);
            setSelectedMutePreset(null);

            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError("Error al silenciar notificaciones");
            console.error(err);
        } finally {
            setIsSavingMute(false);
        }
    };

    const handleUnmute = () => {
        localStorage.removeItem("notificationsMute");
        setMuteInfo(null);
        setSuccess("Notificaciones reactivadas");
        setTimeout(() => setSuccess(""), 3000);
    };

    if (loading) {
        return (
            <div className="user-preferences">
                <p className="loading">Cargando datos...</p>
            </div>
        );
    }

    const currentEmail = userData?.email || userData?.correo || "No disponible";
    const handleOnboardingEmailInput = (value) => {
        setNewEmail(value);

        const trimmedValue = String(value || "").trim();
        if (trimmedValue && isValidEmail(trimmedValue)) {
            window.dispatchEvent(new CustomEvent("onboarding:preferences-email-typed"));
        }
    };

    return (
        <div className="user-preferences">
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Email Preferences Section */}
            <section className="preferences-section" data-onboarding-id="preferences-email-section">
                <h3 className="preferences-section-title">Correo Electrónico</h3>
                
                <div className="pref-group">
                    <label className="pref-label">Correo Principal</label>
                    {isEditingEmail ? (
                        <form onSubmit={handleSaveEmail} className="email-edit-form">
                            <div className="email-input-wrapper" data-onboarding-id="preferences-email-input">
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => handleOnboardingEmailInput(e.target.value)}
                                    placeholder="nuevo.email@upb.edu"
                                    className="form-input email-input"
                                    disabled={isSavingEmail}
                                />
                                <button
                                    type="submit"
                                    className="email-action-btn email-save-btn"
                                    disabled={isSavingEmail}
                                    title="Guardar"
                                    data-onboarding-id="preferences-email-save-button"
                                >
                                    <FaCheck />
                                </button>
                                <button
                                    type="button"
                                    className="email-action-btn email-cancel-btn"
                                    onClick={handleCancelEmail}
                                    disabled={isSavingEmail}
                                    title="Cancelar"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="email-display-wrapper">
                            <div className="pref-value">{currentEmail}</div>
                            <button
                                className="email-edit-button"
                                onClick={handleEditEmail}
                                disabled={isSavingEmail}
                                title="Editar correo"
                                data-onboarding-id="preferences-email-edit-button"
                            >
                                <FaEdit />
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Notifications Preferences Section */}
            <section className="preferences-section">
                <h3 className="preferences-section-title">Notificaciones</h3>
                
                <div className="pref-group">
                    <label className="pref-label">Notificaciones por Correo</label>
                    <p className="pref-description">Recibe actualizaciones importantes en tu correo electrónico</p>
                </div>

                {/* Mute Notifications Section */}
                <div className="pref-group">
                    <label className="pref-label">Silenciar Notificaciones</label>
                    
                    {muteInfo?.enabled && muteInfo?.muteUntil ? (
                        <div className="mute-status-badge">
                            <span className="mute-status-indicator">●</span>
                            <div className="mute-status-content">
                                <p className="mute-status-text">Silenciadas</p>
                                <p className="mute-status-until">
                                    Hasta {new Date(muteInfo.muteUntil).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="email-action-btn email-cancel-btn"
                                onClick={handleUnmute}
                                title="Reactivar notificaciones"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    ) : null}

                    {!isEditingMute && (!muteInfo?.enabled || !muteInfo?.muteUntil) ? (
                        <button
                            type="button"
                            className="mute-toggle-btn"
                            onClick={handleEditMute}
                            disabled={isSavingMute}
                        >
                            Silenciar Notificaciones
                        </button>
                    ) : isEditingMute ? (
                        <form onSubmit={handleSaveMute} className="mute-edit-form">
                            <div className="mute-preset-section">
                                <label className="pref-label">Duración predefinida</label>
                                <div className="mute-preset-chips">
                                    {MUTE_PRESETS.map((preset) => (
                                        <button
                                            key={preset.minutes}
                                            type="button"
                                            className={`time-chip ${selectedMutePreset === preset.minutes ? "active" : ""}`}
                                            onClick={() => applyMutePreset(preset.minutes)}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="time-actions">
                                <button
                                    type="submit"
                                    className="email-action-btn email-save-btn"
                                    disabled={isSavingMute || selectedMutePreset === null}
                                    title="Guardar"
                                >
                                    <FaCheck />
                                </button>
                                <button
                                    type="button"
                                    className="email-action-btn email-cancel-btn"
                                    onClick={handleCancelMute}
                                    disabled={isSavingMute}
                                    title="Cancelar"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </form>
                    ) : null}
                </div>
            </section>

            {/* Reminder Anticipation Section */}
            <section className="preferences-section">
                <h3 className="preferences-section-title">Recordatorios</h3>
                
                <div className="pref-group">
                    <label className="pref-label">Tiempo de Anticipación</label>
                    <p className="pref-description">¿Con cuánto tiempo de anticipación quieres ser recordado antes de que venza una tarea? (máximo 24 horas)</p>
                    
                    {isEditingAnticipation ? (
                        <form onSubmit={handleSaveAnticipation} className="anticipation-edit-form">
                            <div className="anticipation-input-wrapper">
                                <div className="time-input-group">
                                    <label htmlFor="anticipation-hours" className="time-label">Horas</label>
                                    <select
                                        id="anticipation-hours"
                                        value={anticipationHours}
                                        onChange={(e) => setAnticipationHours(e.target.value)}
                                        className="time-select"
                                        disabled={isSavingAnticipation}
                                    >
                                        {[...Array(24)].map((_, i) => (
                                            <option key={i} value={i}>{i}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="time-input-group">
                                    <label htmlFor="anticipation-minutes" className="time-label">Minutos</label>
                                    <select
                                        id="anticipation-minutes"
                                        value={anticipationMinutes}
                                        onChange={(e) => setAnticipationMinutes(e.target.value)}
                                        className="time-select"
                                        disabled={isSavingAnticipation}
                                    >
                                        {[...Array(60)].map((_, i) => (
                                            <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="time-actions">
                                    <button
                                        type="submit"
                                        className="email-action-btn email-save-btn"
                                        disabled={isSavingAnticipation}
                                        title="Guardar"
                                    >
                                        <FaCheck />
                                    </button>
                                    <button
                                        type="button"
                                        className="email-action-btn email-cancel-btn"
                                        onClick={handleCancelAnticipation}
                                        disabled={isSavingAnticipation}
                                        title="Cancelar"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="anticipation-display-wrapper">
                            <div className="pref-value">
                                {anticipationHours > 0 && `${anticipationHours}h `}
                                {anticipationMinutes > 0 && `${anticipationMinutes}m `}
                                {anticipationHours === 0 && anticipationMinutes === 0 && "Sin recordatorio"}
                            </div>
                            <button
                                className="email-edit-button"
                                onClick={handleEditAnticipation}
                                disabled={isSavingAnticipation}
                                title="Editar tiempo de anticipación"
                            >
                                <FaEdit />
                            </button>
                        </div>
                    )}
                </div>
            </section>

        </div>
    );
}