import Logo from '../../assets/logo.png';
import '../../styles/RecoverPassword.css';
import { MdEmail } from "react-icons/md"; //  npm install react-icons --save

const RecoverPassword = () => {
    return (
        <div className='wrapper'>
            <form action="" >
                <img src={Logo} alt="Logo" className="logo" />
                <h1>Recuperar Contraseña</h1>
                <h2 className='subtitle'>Por favor ingresa el correo vinculado a tu cuenta</h2>
                <div className="input-box">
                    <input type="email"
                        placeholder="Correo Electrónico" required />
                    <MdEmail />
                </div>
                <button type="submit" className="btn">Recuperar Contraseña</button>
                <button type="button" className="btn-return">
                    Volver
                </button>
            </form>
        </div>

    );
}
export default RecoverPassword;