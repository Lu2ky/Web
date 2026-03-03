
import { Link } from 'react-router-dom';
import './LogInForm.css';

//Imagenes y logos
import Logo from './assets/logo.png';
import { FaUser } from "react-icons/fa"; //  npm install react-icons --save
import { FaLock } from "react-icons/fa";
import Image from './assets/ImageLogIn.jpg';

// Hook de react
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LogInForm = () => {
    const [userId, setUserId] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const result = await LDAPservice(userId, password);

        if (result && result.success) {
            navigate(`/app/${userId}`);
        } else {
            setError("Usuario o contraseña incorrectos");
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
                        <input type="password"
                            placeholder="Contraseña" required />
                        <FaLock />
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
