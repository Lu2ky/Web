import Logo from '../../assets/logo.png';
import { FaUser } from "react-icons/fa"; //  npm install react-icons --save
import { FaLock } from "react-icons/fa"; 
import '../../styles/LogIn.css';
import Image from '../../assets/login-background.jpg';

const LogInForm = () => {
    return (
        <div className='ContainerLogIn'
        style={{ backgroundImage: `url(${Image})` }}>
            <div className='wrapper'>
                <form action="" >
                    <img src={Logo} alt="Logo" className="logo" />
                    <h1>Iniciar Sesión</h1>
                    <h2 className='subtitle'>Por favor ingresa tu información para iniciar sesión.</h2>
                    <div className="inputBox">
                        <input type="username"
                            placeholder="Usuario" required />
                        <FaUser />
                    </div>
                    <div className="inputBox">
                        <input type="password"
                            placeholder="Contraseña" required />
                        <FaLock />
                    </div>
                    <div className="rememberForgot">
                        <a href="RecoverPassword">Olvidé mi contraseña</a> {/*Enlazar con recuperación de contraseña*/}
                        <label><input type="checkbox" required /> Acepto los términos y condiciones</label> {/*Poner la politica de términos y condiciones*/}
                    </div>
                    <button type="submit" className="btn">Iniciar Sesión</button>
                </form>
            </div>
        </div>
    );
}
export default LogInForm;