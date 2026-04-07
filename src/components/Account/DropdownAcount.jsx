import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
import UserProfile from "./UserProfile";
import UserPreferences from "./UserPreferences";
import "./DropdownAcount.css";
import { clearAuthSession } from "../../services/authSession";

const OPTIONS = [
    { id: "acount", label: "Mi Perfil" },
    { id: "prefer", label: "Preferencias" },
    { id: "close", label: "Cerrar Sesión" },
];

export default function DropdownAcount({ userId }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activeModal, setActiveModal] = useState(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();


    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleCloseUnrelatedUi = (event) => {
            const allowOpenUi = Array.isArray(event?.detail?.allowOpenUi) ? event.detail.allowOpenUi : [];

            if (!allowOpenUi.includes("dropdown-account")) {
                setIsDropdownOpen(false);
            }

            setActiveModal((prev) => {
                if (!prev) return prev;

                const modalKeyMap = {
                    acount: "modal-account",
                    prefer: "modal-preferences",
                    close: "modal-logout"
                };

                const mappedKey = modalKeyMap[prev];
                if (mappedKey && allowOpenUi.includes(mappedKey)) {
                    return prev;
                }

                return null;
            });
        };

        window.addEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
        return () => window.removeEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
    }, []);

    const toggleDropdown = () => {
        setIsDropdownOpen((prev) => {
            const nextState = !prev;
            if (nextState) {
                window.dispatchEvent(new CustomEvent("onboarding:account-dropdown-opened"));
            }
            return nextState;
        });
    };

    const handleOptionClick = (optionId) => {
        if (optionId === "prefer") {
            window.dispatchEvent(new CustomEvent("onboarding:preferences-opened"));
        }
        setActiveModal(optionId);
        setIsDropdownOpen(false);
    };

    const handleLogout = () => {
        // Limpiar sesión del usuario para bloquear rutas protegidas.
        clearAuthSession();

        // Rediriges al login
        navigate("/");
    };

    const closeModal = () => setActiveModal(null);

    return (
        <div>
            {/* Dropdown */}
            <div className="dropdown-container" ref={dropdownRef} data-onboarding-id="account-dropdown">
                <button
                    className="dropdown-image-button"
                    onClick={toggleDropdown}
                    aria-haspopup="true"
                    aria-expanded={isDropdownOpen}
                    title="Abrir menú de usuario"
                    type="button"
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
                                    data-onboarding-id={option.id === "prefer" ? "open-preferences-button" : undefined}
                                    onClick={() => handleOptionClick(option.id)}
                                    title={option.label}
                                    type="button"
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
                <UserProfile userId={userId} onClose={closeModal} />
            </Modal>

            <Modal
                isOpen={activeModal === "prefer"}
                onClose={closeModal}
                title="Preferencias"
            >
                <UserPreferences userId={userId} onClose={closeModal} />
            </Modal>

            <Modal
                isOpen={activeModal === "close"}
                onClose={closeModal}
                title="Cerrar Sesión"
                onConfirm={handleLogout}
                confirmLabel="Sí, cerrar sesión"
                closeLabel="Cancelar"
            >
                <p>¿Estás seguro de que deseas cerrar sesión?</p>
                
            </Modal>
        </div>
    );
}