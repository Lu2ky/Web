import logo from "../../assets/logo.png";
import "../../styles/Header.css";

function Header() {
	return (
		<header>
			<img src={logo} alt="Logo de UPB Planner" />
			<h1>UPB Planner</h1>
			<nav>
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
		</header>
	);
}

export default Header;
