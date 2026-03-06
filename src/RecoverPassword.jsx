import Logo from './assets/logo.png';
import Image from './assets/ImageRecover.jpeg';
import './RecoverPassword.css';
import { MdEmail } from "react-icons/md"; //  npm install react-icons --save
import { useNavigate } from 'react-router-dom';

const RecoverPassword = () => {
    const navigate = useNavigate();

    return (
        <div className='ContainerRecover'
            style={{ backgroundImage: `url(${Image})` }}>
            <div className='wrapperRecovery'>
                <form action="" >
                    <img src={Logo} alt="Logo" className="logoRecover" />
                    <h1>Recuperar Contraseña</h1>
                    <h2 className='subtitle'>Por favor ingresa el correo vinculado a tu cuenta</h2>
                    <div className="input-box">
                        <input type="email"
                            placeholder="Correo Electrónico" required />
                        <MdEmail />
                    </div>
                    <button type="submit" className="btn">Recuperar Contraseña</button>
                    <button type="button" className="btn-return" onClick={() => navigate('/')}>
                        Volver
                    </button>
                </form>
            </div>
        </div>

    );
}
export default RecoverPassword;