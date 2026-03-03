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

            if (result && (result.success || result.status === "success")) {
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
            setError("Error al actualizar el correo");
            console.error(err);
        } finally {
            setIsSavingEmail(false);
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
        </div>
    );
}
