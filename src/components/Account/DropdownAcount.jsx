import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../Templates/Modal";
import UserProfile from "../Header/UserProfile";
import UserPreferences from "../Header/UserPreferences";
import DropdownBase from "../Templates/DropdownBase";
import "./DropdownAcount.css";
import { clearAuthSession } from "../../services/authSession";

const OPTIONS = [
    { id: "acount", label: "Mi Perfil" },
    { id: "prefer", label: "Preferencias" },
    { id: "close", label: "Cerrar Sesión" },
];

export default function DropdownAcount({ userId, showPreferences = true }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activeModal, setActiveModal] = useState(null);
    const [onboardingState, setOnboardingState] = useState({ isOpen: false, currentStepId: null });
    const navigate = useNavigate();

    const visibleOptions = showPreferences
        ? OPTIONS
        : OPTIONS.filter((option) => option.id !== "prefer");

    const emitProfileOpenedForOnboarding = () => {
        window.dispatchEvent(new CustomEvent("onboarding:profile-opened"));
    };

    useEffect(() => {
        const handleCloseUnrelatedUi = (event) => {
            const allowOpenUi = Array.isArray(event?.detail?.allowOpenUi) ? event.detail.allowOpenUi : [];

            if (!allowOpenUi.includes("dropdown-account")) {
                setIsDropdownOpen(false);
            }

            setActiveModal((prev) => {
                if (!prev) {
                    return prev;
                }

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

    useEffect(() => {
        const handleOnboardingStateChanged = (event) => {
            const detail = event?.detail || {};
            setOnboardingState({
                isOpen: Boolean(detail.isOpen),
                currentStepId: detail.currentStepId || null
            });
        };

        window.addEventListener("onboarding:state-changed", handleOnboardingStateChanged);
        window.dispatchEvent(new CustomEvent("onboarding:state-request"));

        return () => {
            window.removeEventListener("onboarding:state-changed", handleOnboardingStateChanged);
        };
    }, []);

    useEffect(() => {
        if (activeModal === "acount") {
            // Fallback: ensure step "Abre tu perfil" advances when profile modal is open.
            emitProfileOpenedForOnboarding();
        }
    }, [activeModal]);

    const toggleDropdown = () => {
        setIsDropdownOpen((prev) => {
            const nextState = !prev;
            if (nextState) {
                window.dispatchEvent(new CustomEvent("onboarding:account-dropdown-opened"));

                if (onboardingState.isOpen && onboardingState.currentStepId === "open-password-change") {
                    emitProfileOpenedForOnboarding();
                    setActiveModal("acount");
                    return false;
                }
            }
            return nextState;
        });
    };

    const handleOptionClick = (optionId) => {
        if (optionId === "prefer") {
            window.dispatchEvent(new CustomEvent("onboarding:preferences-opened"));
        }
        if (optionId === "acount") {
            emitProfileOpenedForOnboarding();
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
            <div className="dropdown-container" data-onboarding-id="account-dropdown">
                <DropdownBase
                    open={isDropdownOpen}
                    onOpenChange={(nextState) => setIsDropdownOpen(nextState)}
                    roleMode="menu"
                    className="dropdown-account-root"
                    menuClassName="dropdown-account-host"
                    trigger={({ ref, isOpen }) => (
                        <button
                            ref={ref}
                            className="dropdown-image-button"
                            data-onboarding-id="avatar-button"
                            onClick={toggleDropdown}
                            aria-haspopup="menu"
                            aria-expanded={isOpen}
                            title="Abrir menú de usuario"
                            type="button"
                        >
                            <img
                                src="https://i.pinimg.com/1200x/4a/18/f7/4a18f79fa10516601b7ab9a6ae0af0f7.jpg"
                                alt="Avatar"
                                className="dropdown-avatar"
                            />
                        </button>
                    )}
                >
                    {() => (
                        <ul className="dropdown-menu" role="menu">
                            {visibleOptions.map((option) => (
                                <li key={option.id} role="menuitem">
                                    <button
                                        className="dropdown-menu-item"
                                        data-onboarding-id={option.id === "acount" ? "profile-menu-button" : option.id === "prefer" ? "open-preferences-button" : undefined}
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
                </DropdownBase>
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