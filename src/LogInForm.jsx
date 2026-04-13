
import { Link } from 'react-router-dom';
import './LogInForm.css';
import LDAPservice from './services/LDAPservice';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Modal from './components/Account/Modal';

//Imagenes y logos
import Logo from './assets/logo.png';
import { FaUser } from "react-icons/fa"; //  npm install react-icons --save
import { FaLock } from "react-icons/fa";
import Image from './assets/ImageLogIn.webp';

// Utilidades de estado y navegación de React
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    createAuthSession,
    ROLE_ADMIN_UPB_PLANNER,
    ROLE_USUARIOS
} from './services/authSession';

const LogInForm = () => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loginFeedback, setLoginFeedback] = useState('');
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsFeedbackModalOpen(false);
        setLoginFeedback('');

        if (!userId.trim() || !password.trim()) {
            setError("Por favor ingresa usuario y contraseña");
            return;
        }
        const result = await LDAPservice(userId, password);

        if (result) {
            // El backend puede devolver distintos indicadores de éxito
            const isSuccess = result.success || result.status === 'success' || result.valid === true || Boolean(result.data);
            
            if (isSuccess) {
                const token = result?.token ?? result?.jwt_token ?? "";
                const roles = Array.isArray(result?.role)
                    ? result.role
                    : Array.isArray(result?.roles)
                        ? result.roles
                        : [];

                createAuthSession({ userId, token, roles });

                if (roles.includes(ROLE_ADMIN_UPB_PLANNER)) {
                    navigate("/AdminView");
                    return;
                }

                if (roles.includes(ROLE_USUARIOS)) {
                        navigate(`/app/${userId}`);
                    return;
                }

                setError("Tu usuario no tiene permisos para acceder a la aplicación");
            } else {
                setLoginFeedback(result.message || "Usuario o contraseña incorrectos");
                setIsFeedbackModalOpen(true);
            }
        } else {
            setLoginFeedback("Credenciales incorrectas");
            setIsFeedbackModalOpen(true);
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
                    <div className="inputBox">
                        <input type="text"
                            placeholder="Id Usuario"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                        />
                        <FaUser />
                    </div>
                    <div className="inputBox">
                        <input type={showPassword ? "text" : "password"}
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <FaLock />
                        <span className="togglePassword" onClick={() => setShowPassword(!showPassword)} // 👈 cambia el estado
                            style={{ cursor: "pointer" }}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>
                    {error && (
                        <div className="error-message" style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}
                    <div className="rememberForgot">
                        <Link to="/RecoverPassword">Olvidé mi contraseña</Link>
                        <label className="termsConsentLabel">
                            <input type="checkbox" required />
                            <span className="termsConsentText termsConsentText--full">
                                Acepto <Link to="/legal">los términos y condiciones y la política de tratamiento de datos.</Link>
                            </span>
                            <span className="termsConsentText termsConsentText--compact">
                                Acepto <Link to="/legal">términos y condiciones</Link>.
                            </span>
                        </label>
                    </div>
                    <button type="submit" className="btn">Iniciar Sesión</button>
                </form>
            </div>

            <Modal
                isOpen={isFeedbackModalOpen}
                onClose={() => setIsFeedbackModalOpen(false)}
                title="No fue posible iniciar sesión"
                closeLabel="Entendido"
            >
                <p>{loginFeedback}</p>
            </Modal>
        </div>
    );
}


export default LogInForm;
