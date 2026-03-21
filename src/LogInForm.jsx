
import { Link } from 'react-router-dom';
import './LogInForm.css';
import LDAPservice from './services/LDAPservice';
import { FaEye, FaEyeSlash } from "react-icons/fa";

//Imagenes y logos
import Logo from './assets/logo.png';
import { FaUser } from "react-icons/fa"; //  npm install react-icons --save
import { FaLock } from "react-icons/fa";
import Image from './assets/ImageLogIn.jpeg';

// Hook de react
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

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!userId.trim() || !password.trim()) {
            setError("Por favor ingresa usuario y contraseña");
            return;
        }

        const result = await LDAPservice(userId, password);

        if (result) {
            // Backend may return different success indicators
            const isSuccess = result.success || result.status === 'success' || result.valid === true || Boolean(result.data);
            
            if (isSuccess) {
                const token = result?.token ?? result?.accessToken ?? result?.key ?? "";
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
                setError(result.message || "Usuario o contraseña incorrectos");
            }
        } else {
            setError("Error al conectar con el servidor");
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
                            style={{ cursor: "pointer", marginLeft: "8px" }}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>
                    <div className="rememberForgot">
                        <Link to="/RecoverPassword">Olvidé mi contraseña</Link>
                        <label><input type="checkbox" required /> Acepto los términos y condiciones</label> {/*Poner la politica de términos y condiciones*/}
                    </div>
                    <button type="submit" className="btn">Iniciar Sesión</button>
                </form>
            </div>
        </div>
    );
}


export default LogInForm;
