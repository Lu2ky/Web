import { useState } from "react";
import logo from "../../assets/logo.png";
import "../../styles/Header.css";
import "../Account/DropdownAcount";
import DropdownAcount from "../Account/DropdownAcount";
import NotificationBell from "../Account/NotificationBell";


function Header({ userId }) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	return (
		<header>
			<div className="headerLeft">
				<img src={logo} alt="Logo de UPB Planner" />
				<h1>UPB Planner</h1>
			</div>

			<div className="headerRight">
				<NotificationBell userId={userId} />
				<DropdownAcount userId={userId} />
			</div>

			{isMenuOpen && <div className="overlay" onClick={() => setIsMenuOpen(false)} />}
		</header>
	);
}

export default Header;
