import { useState, useRef } from "react";
import Logo from './assets/logo.png';
import Image from './assets/ImageRecover.jpeg';
import './TokenPassword.css';
import { useNavigate } from 'react-router-dom';

const TokenPassword = () => {
    const navigate = useNavigate();
    const [token, setToken] = useState(["", "", "", "", "", ""]);
    const inputsRef = useRef([]);

    const handleChange = (value, index) => {
        if (!/^\d?$/.test(value)) return;

        const newToken = [...token];
        newToken[index] = value;
        setToken(newToken);

        if (value && index < 5) {
            inputsRef.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !token[index] && index > 0) {
            inputsRef.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const newToken = paste.split("");
        setToken([...newToken, ...Array(6 - newToken.length).fill("")]);

        newToken.forEach((_, i) => {
            if (inputsRef.current[i]) {
                inputsRef.current[i].value = newToken[i];
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalToken = token.join("");

        if (finalToken.length !== 6) {
            alert("El token debe tener 6 dígitos");
            return;
        }

        console.log("Token:", finalToken);
    };

    return (
        <div className='ContainerToken' style={{ backgroundImage: `url(${Image})` }}>
            <div className='wrapperToken'>
                <form onSubmit={handleSubmit}>
                    <img src={Logo} alt="Logo" className="logo" />

                    <h1>Recuperar Contraseña</h1>
                    <h2 className='subtitle'>
                        Ingresa el código de 6 dígitos enviado a tu correo
                    </h2>

                    <div className="otp-container" onPaste={handlePaste}>
                        {token.map((digit, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength={1}
                                value={digit}
                                ref={(el) => (inputsRef.current[index] = el)}
                                onChange={(e) => handleChange(e.target.value, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                            />
                        ))}
                    </div>

                    <button type="submit" className="btn" disabled={token.join("").length !== 6}>
                        Verificar
                    </button>

                    <button type="button" className="btn-return" onClick={() => navigate('/')}>
                        Volver
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TokenPassword;