import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import * as userService from "../../services/userService";
import "./UserProfile.css";

function validatePasswordComplexity(password) {
    const value = String(password || "");

    if (value.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (!/[a-z]/.test(value)) return "La contraseña debe incluir al menos una letra minúscula";
    if (!/[A-Z]/.test(value)) return "La contraseña debe incluir al menos una letra mayúscula";
    if (!/\d/.test(value)) return "La contraseña debe incluir al menos un número";
    if (!/[^A-Za-z0-9\s]/.test(value)) return "La contraseña debe incluir al menos un símbolo";

    return null;
}

export default function UserProfile({ userId, onClose }) {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    // Estado del formulario de cambio de contraseña
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Cargar datos del usuario al montar el componente
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
                console.log("[UserProfile] userData procesado:", userData); // DEPURACIÓN
                setUserData(userData);
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

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Validaciones
        if (!currentPassword.trim()) {
            setError("Por favor ingresa tu contraseña actual");
            return;
        }

        if (!newPassword.trim()) {
            setError("Por favor ingresa una nueva contraseña");
            return;
        }

        if (!confirmPassword.trim()) {
            setError("Por favor confirma la nueva contraseña");
            return;
        }

        const policyError = validatePasswordComplexity(newPassword);
        if (policyError) {
            setError(policyError);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        if (currentPassword === newPassword) {
            setError("La nueva contraseña debe ser diferente a la actual");
            return;
        }

        setIsChangingPassword(true);

        try {
            const result = await userService.changePassword(
                userId,
                currentPassword,
                newPassword
            );

            if (result && (result.success || result.status === "success")) {
                setSuccess("Contraseña cambiada exitosamente");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                
                // Limpiar mensaje de éxito después de 3 segundos
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError(result?.message || "Error al cambiar la contraseña");
            }
        } catch (err) {
            setError("Error al cambiar la contraseña");
            console.error(err);
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="user-profile">
                <p className="loading">Cargando datos...</p>
            </div>
        );
    }

    return (
        <div className="user-profile">
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* User Information Section */}
            <section className="profile-section">
                <h3 className="profile-section-title">Información del Perfil</h3>
                
                <div className="info-group">
                    <label className="info-label">Nombre</label>
                    <div className="info-value">
                        {userData?.nombre || userData?.name || userData?.fullName || userData?.nombreCompleto || "No disponible"}
                    </div>
                </div>

                <div className="info-group">
                    <label className="info-label">Semestre</label>
                    <div className="info-value">
                        {userData?.semestreActual || userData?.semestre || userData?.semester || userData?.nivel || userData?.level || "No disponible"}
                    </div>
                </div>

                <div className="info-group">
                    <label className="info-label">Programa Académico</label>
                    <div className="info-value">
                        {userData?.programa || userData?.program || userData?.carrera || userData?.career || userData?.programaAcademico || userData?.academicProgram || "No disponible"}
                    </div>
                </div>
            </section>

            {/* Change Password Section */}
            <section className="profile-section">
                <h3 className="profile-section-title">Cambiar Contraseña</h3>
                
                <form onSubmit={handleChangePassword} className="password-form">
                    <div className="form-group">
                        <label htmlFor="currentPassword" className="form-label">
                            Contraseña Actual
                        </label>
                        <div className="password-input-wrapper">
                            <input
                                id="currentPassword"
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Ingresa tu contraseña actual"
                                className="form-input"
                                disabled={isChangingPassword}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                disabled={isChangingPassword}
                            >
                                {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="newPassword" className="form-label">
                            Nueva Contraseña
                        </label>
                        <div className="password-input-wrapper">
                            <input
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Ingresa una nueva contraseña"
                                className="form-input"
                                disabled={isChangingPassword}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                disabled={isChangingPassword}
                            >
                                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">
                            Confirmar Nueva Contraseña
                        </label>
                        <div className="password-input-wrapper">
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirma tu nueva contraseña"
                                className="form-input"
                                disabled={isChangingPassword}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                disabled={isChangingPassword}
                            >
                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="profile-submit-btn"
                        disabled={isChangingPassword}
                    >
                        {isChangingPassword ? "Actualizando..." : "Cambiar Contraseña"}
                    </button>
                </form>
            </section>
        </div>
    );
}
