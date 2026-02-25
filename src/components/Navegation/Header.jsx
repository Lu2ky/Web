import {useState} from "react";
import logo from "../../assets/logo.png";
import "../../styles/Header.css";

function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	return (
		<header>
			<div className="headerLeft">
				<img src={logo} alt="Logo de UPB Planner" />
				<h1>UPB Planner</h1>
			</div>

			<button
				className="menuButton"
				onClick={() => setIsMenuOpen(true)}		/*PARA LO DEL MENU HAMBURGUESA*/
				aria-label="Abrir menú"
			>
				☰
			</button>
			
			<nav className={`drawer ${isMenuOpen ? "open" : ""}`}>
				<ul>
					<li>
						<a href="#">Horario</a>
					</li>
					<li>
						<a href="#">Cuenta</a>
					</li>
					<li>
						<a href="#">Notificaciones</a>
					</li>
					<li>
						<a href="#">Sobre la App</a>
					</li>
				</ul>
			</nav>

			{isMenuOpen && <div className="overlay" onClick={() => setIsMenuOpen(false)} />}
		</header>
	);
}

export default Header;
