
import { Link } from 'react-router-dom';
import './LogInForm.css';
import LDAPservice from '../services/LDAPservice';
import { FaEye, FaEyeSlash, FaUser, FaLock } from "react-icons/fa";
import Modal from '../components/Templates/Modal';

//Imagenes y logos
import Logo from '../assets/logo.png';
import Image from '../assets/ImageLogIn.webp';

// Utilidades de estado y navegación de React
import { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    createAuthSession,
    getHomeRouteByRole,
    ROLE_ADMIN,
    ROLE_USUARIOS
} from '../services/authSession';

// Componente memoizado para el Modal de feedback
const FeedbackModal = memo(({ isOpen, onClose, title, message }) => (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        closeLabel="Entendido"
    >
        <p>{message}</p>
    </Modal>
));

FeedbackModal.displayName = 'FeedbackModal';

const LogInForm = () => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [feedbackTitle, setFeedbackTitle] = useState('No fue posible iniciar sesión');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

    const navigate = useNavigate();

    const openFeedbackModal = useCallback((message, title = 'No fue posible iniciar sesión') => {
        setFeedbackTitle(title);
        setFeedbackMessage(message);
        setIsFeedbackModalOpen(true);
    }, []);

    const handleTogglePassword = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    const handleUserIdChange = useCallback((e) => {
        setUserId(e.target.value);
    }, []);

    const handlePasswordChange = useCallback((e) => {
        setPassword(e.target.value);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsFeedbackModalOpen(false);

        const trimmedUserId = userId.trim();
        const trimmedPassword = password.trim();

        if (!trimmedUserId || !trimmedPassword) {
            openFeedbackModal("Por favor ingresa usuario y contraseña", 'Campos incompletos');
            return;
        }

        let result;

        try {
            result = await LDAPservice(trimmedUserId, trimmedPassword);
        } catch {
            openFeedbackModal("No fue posible validar tus credenciales");
            return;
        }

        if (result) {
            const isSuccess = result.success || result.status === 'success' || result.valid === true || Boolean(result.data);

            if (isSuccess) {
                const token = result?.token ?? result?.jwt_token ?? "";
                const roles = Array.isArray(result?.role)
                    ? result.role
                    : Array.isArray(result?.roles)
                        ? result.roles
                        : [];

                createAuthSession({ userId: trimmedUserId, token, roles });

                if (roles.includes(ROLE_ADMIN) || roles.includes(ROLE_USUARIOS)) {
                    navigate(getHomeRouteByRole(), { replace: true });
                    return;
                }

                openFeedbackModal("Tu usuario no tiene permisos para acceder a la aplicación", 'Acceso restringido');
            } else {
                openFeedbackModal(result.message || "Usuario o contraseña incorrectos");
            }
        } else {
            openFeedbackModal("Credenciales incorrectas");
        }
    };


    return (
        <div className='ContainerLogIn'
            style={{ backgroundImage: `url(${Image})` }}>
            <div className='wrapperLogIn'>
                <form action="" onSubmit={handleSubmit}>
                    <img src={Logo} alt="Logo" className="logoLogIn" />
                    <h1>Iniciar Sesión</h1>
                    <h2 className='subtitle'>Por favor ingresa tu información para iniciar sesión.</h2>
                    <div className="inputBox inputBox--user">
                        <input 
                            type="text"
                            inputMode="text"
                            placeholder="Id Usuario"
                            value={userId}
                            onChange={handleUserIdChange}
                            autoComplete="username"
                            spellCheck="false"
                            required
                        />
                        <FaUser className="inputBox__icon inputBox__icon--right" />
                    </div>
                    <div className="inputBox inputBox--password">
                        <input 
                            type={showPassword ? "text" : "password"}
                            inputMode="text"
                            placeholder="Contraseña"
                            value={password}
                            onChange={handlePasswordChange}
                            autoComplete="current-password"
                            spellCheck="false"
                            required
                        />
                        <button
                            type="button"
                            className="togglePassword"
                            onClick={handleTogglePassword}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                        <FaLock className="inputBox__icon inputBox__icon--right inputBox__icon--lock" />
                    </div>
                    <div className="rememberForgot">
                        <Link to="/IdRestore">Olvidé mi contraseña</Link>
                        <label className="termsConsentLabel">
                            <input type="checkbox" required />
                            <span className="termsConsentText termsConsentText--full">
                                Acepto <Link to="/Legal">los términos y condiciones y la política de tratamiento de datos.</Link>
                            </span>
                            <span className="termsConsentText termsConsentText--compact">
                                Acepto <Link to="/Legal">términos y condiciones</Link>.
                            </span>
                        </label>
                    </div>
                    <button type="submit" className="btn">Iniciar Sesión</button>
                </form>
            </div>

            <FeedbackModal
                isOpen={isFeedbackModalOpen}
                onClose={() => setIsFeedbackModalOpen(false)}
                title={feedbackTitle}
                message={feedbackMessage}
            />
        </div>
    );
}


export default LogInForm;
