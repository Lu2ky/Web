import { Link } from 'react-router-dom';
import './LoginPage.css';
import { loginLocal } from '../../shared/api/authLocal';
import { FaEye, FaEyeSlash, FaUser, FaLock } from "react-icons/fa";

// Imagenes y logos
import Logo from '../../shared/assets/logo.png';
import Image from '../../shared/assets/ImageLogIn.webp';

// Utilidades de estado y navegación de React
import { useState, useCallback, memo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    createAuthSession,
    getHomeRouteByRole
} from '../../shared/session/authSession';

// Lazy load Modal para reducir bundle inicial
const LazyModal = lazy(() => import('../../shared/ui/Modal'));

// Componente memoizado para el Modal de feedback
const FeedbackModal = memo(({ isOpen, onClose, title, message }) => (
    isOpen ? (
        <Suspense fallback={null}>
            <LazyModal
                isOpen={isOpen}
                onClose={onClose}
                title={title}
                closeLabel="Entendido"
            >
                <p>{message}</p>
            </LazyModal>
        </Suspense>
    ) : null
));

FeedbackModal.displayName = 'FeedbackModal';

const LogInForm = () => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [feedbackTitle, setFeedbackTitle] = useState('No fue posible iniciar sesión');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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
        setIsLoading(true);

        const trimmedUserId = userId.trim();
        const trimmedPassword = password.trim();

        if (!trimmedUserId || !trimmedPassword) {
            setIsLoading(false);
            openFeedbackModal("Por favor ingresa usuario y contraseña", 'Campos incompletos');
            return;
        }

        try {
            const result = await loginLocal(trimmedUserId, trimmedPassword);

            if (result.success && result.token) {
                const roles = result.user?.roles || ['ROLE_USUARIOS'];
                
                createAuthSession({ 
                    userId: trimmedUserId, 
                    token: result.token, 
                    roles, 
                    numericUserId: trimmedUserId 
                });

                const homeRoute = getHomeRouteByRole();
                if (homeRoute !== "/") {
                    navigate(homeRoute, { replace: true });
                    return;
                }

                openFeedbackModal("Tu usuario no tiene permisos para acceder a la aplicación", 'Acceso restringido');
            } else {
                openFeedbackModal(result.message || "Usuario o contraseña incorrectos");
            }
        } catch {
            openFeedbackModal("No fue posible validar tus credenciales");
        } finally {
            setIsLoading(false);
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
                        aria-label="Id de usuario"
                        value={userId}
                        onChange={handleUserIdChange}
                        autoComplete="username"
                        spellCheck="false"
                        required
                        disabled={isLoading}
                    />
                    <FaUser className="inputBox__icon inputBox__icon--right" />
                </div>
                <div className="inputBox inputBox--password">
                    <input 
                        type={showPassword ? "text" : "password"}
                        inputMode="text"
                        placeholder="Contraseña"
                        aria-label="Contraseña"
                        value={password}
                        onChange={handlePasswordChange}
                        autoComplete="current-password"
                        spellCheck="false"
                        required
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        className="togglePassword"
                        onClick={handleTogglePassword}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        aria-pressed={showPassword}
                        title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        disabled={isLoading}
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    <FaLock className="inputBox__icon inputBox__icon--right inputBox__icon--lock" />
                </div>
                <div className="rememberForgot">
                    <Link to="/IdRestore">Olvidé mi contraseña</Link>
                    <label className="termsConsentLabel">
                        <input type="checkbox" required disabled={isLoading} />
                        <span className="termsConsentText termsConsentText--full">
                            Acepto <Link to="/Legal">los términos y condiciones y la política de tratamiento de datos.</Link>
                        </span>
                        <span className="termsConsentText termsConsentText--compact">
                            Acepto <Link to="/Legal">términos y condiciones</Link>.
                        </span>
                    </label>
                </div>
                <button type="submit" className="btn" disabled={isLoading}>
                    {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                </button>
            </form>

            <FeedbackModal
                isOpen={isFeedbackModalOpen}
                onClose={() => setIsFeedbackModalOpen(false)}
                title={feedbackTitle}
                message={feedbackMessage}
            />
        </div>
      </div>
    );
};

export default LogInForm;