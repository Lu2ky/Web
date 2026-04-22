import { useState } from "react";
import logo from "../../assets/logo.png";
import "../../styles/Header/Header.css";
import DropdownAcount from "../Account/DropdownAcount";
import NotificationBell from "./NotificationBell";
import Modal from "../Account/Modal";


function Header({ userId }) {
	const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

	const openInstructions = () => setIsInstructionsOpen(true);
	const closeInstructions = () => setIsInstructionsOpen(false);

	return (
		<>
			<header>
				<div className="headerLeft">
					<img src={logo} alt="Logo de UPB Planner" />
					<h1>UPB Planner</h1>
				</div>

				<div className="headerRight">
					<NotificationBell userId={userId} />
					<button
						type="button"
						className="helpInstructionsButton"
						onClick={openInstructions}
						title="Instrucciones para quejas o preguntas"
						aria-label="Abrir instrucciones para quejas o preguntas"
						aria-haspopup="dialog"
						aria-expanded={isInstructionsOpen}
						aria-controls="header-help-modal-content"
					>
						?
					</button>
					<DropdownAcount userId={userId} />
				</div>
			</header>

			<Modal
				isOpen={isInstructionsOpen}
				onClose={closeInstructions}
				title="Quejas y preguntas"
				closeLabel="Entendido"
				closeOnOverlayClick
			>
				<div id="header-help-modal-content" className="helpInstructionsContent">
					<p>
						Si tienes una queja o una pregunta, usa este flujo para recibir atencion mas rapido:
					</p>
					<ol>
						<li>Describe el problema o la duda de forma corta y clara.</li>
						<li>Indica la fecha y hora aproximada en la que ocurrio.</li>
						<li>Anexa evidencia (captura de pantalla, mensaje de error o contexto).</li>
						<li>Incluye tus datos de contacto y el canal preferido para respuesta.</li>
					</ol>
					<p>
						Con esta informacion, el equipo puede escalar y responder tu caso con mayor precision.
					</p>
					<p>
						Correo de contacto: <a href="mailto:upbplanner@gmail.com">upbplanner@gmail.com</a>
					</p>
				</div>
			</Modal>
		</>
	);
}

export default Header;