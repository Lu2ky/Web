import { useState, useEffect } from "react";
import { FaEdit, FaTimes, FaCheck } from "react-icons/fa";
import * as userService from "../../services/userService";
import "./UserPreferences.css";

export default function UserPreferences({ userId, onClose }) {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // Email edit state
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [isSavingEmail, setIsSavingEmail] = useState(false);

    // Reminder anticipation state
    const [isEditingAnticipation, setIsEditingAnticipation] = useState(false);
    const [anticipationHours, setAnticipationHours] = useState(0);
    const [anticipationMinutes, setAnticipationMinutes] = useState(0);
    const [isSavingAnticipation, setIsSavingAnticipation] = useState(false);

    // Cellphone edit state
    const [isEditingCellphone, setIsEditingCellphone] = useState(false);
    const [newCellphone, setNewCellphone] = useState("");
    const [isSavingCellphone, setIsSavingCellphone] = useState(false);

    // Load user data on component mount
    useEffect(() => {
        loadUserData();
    }, [userId]);

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
                setNewCellphone(userData.telefono || userData.celular || "");
                
                // Extract anticipation time from 'antelacionNotis' field (TIME format: HH:MM:SS)
                let totalMinutes = 0;
                const antelacionField = userData.antelacionNotis;
                
                if (antelacionField) {
                    // If it's a TIME format string (HH:MM:SS)
                    if (typeof antelacionField === 'string' && antelacionField.includes(':')) {
                        const parts = antelacionField.split(':');
                        const hours = parseInt(parts[0]) || 0;
                        const minutes = parseInt(parts[1]) || 0;
                        totalMinutes = hours * 60 + minutes;
                    } 
                    // If it's an object with hours and minutes properties
                    else if (typeof antelacionField === 'object' && antelacionField !== null) {
                        const hours = parseInt(antelacionField.hours || antelacionField.horas || 0) || 0;
                        const minutes = parseInt(antelacionField.minutes || antelacionField.minutos || 0) || 0;
                        totalMinutes = hours * 60 + minutes;
                    }
                    // If it's already a number (total minutes)
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

    // Validate email format
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleEditEmail = () => {
        setIsEditingEmail(true);
        setError("");
        setSuccess("");
    };

    const handleCancelEmail = () => {
        setIsEditingEmail(false);
        setNewEmail(userData?.email || userData?.correo || "");
        setError("");
    };

    const handleSaveEmail = async (e) => {
        e.preventDefault();
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
                
                // Clear success message after 3 seconds
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
        
        // Restore from userData
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

        // Get current total minutes from userData
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
                
                // Clear success message after 3 seconds
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

    // Validate cellphone format (basic validation)
    // const isValidCellphone = (cellphone) => {
    //     // Allow digits, spaces, hyphens, parentheses, plus sign
    //     const cellphoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    //     return cellphoneRegex.test(cellphone.replace(/\s/g, ''));
    // };

    const handleEditCellphone = () => {
        setIsEditingCellphone(true);
        setError("");
        setSuccess("");
    };

    const handleCancelCellphone = () => {
        setIsEditingCellphone(false);
        setNewCellphone(userData?.telefono || userData?.celular || "");
        setError("");
    };

    const handleSaveCellphone = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const cellphoneToSave = newCellphone.trim();
        
        if (!cellphoneToSave) {
            setError("Por favor ingresa un número de celular");
            return;
        }

        const currentCellphone = userData?.telefono || userData?.celular || "";
        if (cellphoneToSave === currentCellphone) {
            setError("El número de celular nuevo debe ser diferente al actual");
            return;
        }

        setIsSavingCellphone(true);

        try {
            const result = await userService.updateUserCellphone(userId, cellphoneToSave);

            if (result && (result.success || result.status === "success" || result.ok === true)) {
                setSuccess("Número de celular actualizado exitosamente");
                setUserData({
                    ...userData,
                    telefono: cellphoneToSave,
                    celular: cellphoneToSave
                });
                setIsEditingCellphone(false);
                
                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError(result?.message || "Error al actualizar el celular");
            }
        } catch (err) {
            setError(err?.message || "Error al actualizar el celular");
            console.error(err);
        } finally {
            setIsSavingCellphone(false);
        }
    };

    if (loading) {
        return (
            <div className="user-preferences">
                <p className="loading">Cargando datos...</p>
            </div>
        );
    }

    const currentEmail = userData?.email || userData?.correo || "No disponible";

    return (
        <div className="user-preferences">
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Email Preferences Section */}
            <section className="preferences-section">
                <h3 className="preferences-section-title">Correo Electrónico</h3>
                
                <div className="pref-group">
                    <label className="pref-label">Correo Principal</label>
                    {isEditingEmail ? (
                        <form onSubmit={handleSaveEmail} className="email-edit-form">
                            <div className="email-input-wrapper">
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="nuevo.email@upb.edu"
                                    className="form-input email-input"
                                    disabled={isSavingEmail}
                                />
                                <button
                                    type="submit"
                                    className="email-action-btn email-save-btn"
                                    disabled={isSavingEmail}
                                    title="Guardar"
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

            {/* Cellphone Preferences Section */}
            <section className="preferences-section">
                <h3 className="preferences-section-title">Número de Celular</h3>
                
                <div className="pref-group">
                    <label className="pref-label">Celular Principal</label>
                    <p className="pref-description">Actualiza tu número de celular para recibir notificaciones</p>
                    
                    {isEditingCellphone ? (
                        <form onSubmit={handleSaveCellphone} className="cellphone-edit-form">
                            <div className="cellphone-input-wrapper">
                                <input
                                    type="tel"
                                    value={newCellphone}
                                    onChange={(e) => setNewCellphone(e.target.value)}
                                    placeholder="+57 3001234567"
                                    className="form-input cellphone-input"
                                    disabled={isSavingCellphone}
                                />
                                <button
                                    type="submit"
                                    className="email-action-btn email-save-btn"
                                    disabled={isSavingCellphone}
                                    title="Guardar"
                                >
                                    <FaCheck />
                                </button>
                                <button
                                    type="button"
                                    className="email-action-btn email-cancel-btn"
                                    onClick={handleCancelCellphone}
                                    disabled={isSavingCellphone}
                                    title="Cancelar"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="cellphone-display-wrapper">
                            <div className="pref-value">{userData?.telefono || userData?.celular || "No disponible"}</div>
                            <button
                                className="email-edit-button"
                                onClick={handleEditCellphone}
                                disabled={isSavingCellphone}
                                title="Editar celular"
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
