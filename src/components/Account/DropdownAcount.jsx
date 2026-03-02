import { useState, useRef, useEffect } from "react";
import Modal from "./Modal"; 
import "./DropdownAcount.css";

const OPTIONS = [
    { id: "acount", label: "Mi Perfil" },
    { id: "prefer", label: "Preferencias" },
    { id: "close", label: "Cerrar Sesión"},
];

export default function DropdownAcount() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activeModal, setActiveModal] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

    const handleOptionClick = (optionId) => {
        setActiveModal(optionId);
        setIsDropdownOpen(false);
    };

    const closeModal = () => setActiveModal(null);

    return (
        <div>
            {/* Dropdown */}
            <div className="dropdown-container" ref={dropdownRef}>
                <button
                    className="dropdown-image-button"
                    onClick={toggleDropdown}
                    aria-haspopup="true"
                    aria-expanded={isDropdownOpen}
                >
                    <img
                        src="https://i.pinimg.com/1200x/4a/18/f7/4a18f79fa10516601b7ab9a6ae0af0f7.jpg"
                        alt="Avatar"
                        className="dropdown-avatar"
                    />
                </button>

                {isDropdownOpen && (
                    <ul className="dropdown-menu" role="menu">
                        {OPTIONS.map((option) => (
                            <li key={option.id} role="menuitem">
                                <button
                                    className="dropdown-menu-item"
                                    onClick={() => handleOptionClick(option.id)}
                                >
                                    <span>{option.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Modal
                isOpen={activeModal === "acount"}
                onClose={closeModal}
                title="Mi Perfil"
            >
                <p>Aquí va el contenido y cambio de contraseña</p>

            </Modal>

            <Modal
                isOpen={activeModal === "prefer"}
                onClose={closeModal}
                title="Configuración"
            >
                <p>Configuración de notis y correo</p>
            </Modal>

            <Modal
                isOpen={activeModal === "close"}
                onClose={closeModal}
                title="Cerrar Sesión"
            >
                <p>¿Estás seguro de que deseas cerrar sesión?</p>
                <button className="modal-confirm-btn">Sí, cerrar sesión</button>
            </Modal>
        </div>
    );
}