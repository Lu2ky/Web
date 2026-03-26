import { useState} from "react";
import "../CSS ViewAdmin/PrivilegesButton.css";

function PrivilegesButton() {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <button 
                className="privilegesButton" 
                onClick={() => setIsOpen(true)} 
                type="button"
                title="Gestionar privilegios de usuarios"
                aria-label="Gestionar privilegios"
            >
                <div className="buttonIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 21a8 8 0 0 0-16 0"/>
                    <circle cx="10" cy="8" r="5"/>
                    <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/>
                </svg>
            </div>
            <span className="buttonLabel">Gestionar privilegios</span>
            </button>


            {isOpen && (
                <div
                    className="privilegesModalOverlay"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="privilegesModalContainer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>Gestionar priviligios</h2>

                        <button
                            className="privilegesModalClose"
                            onClick={() => {
                                setIsOpen(false);
                            }}
                            title="Cerrar"
                            aria-label="Cerrar"
                            type="button"
                        >
                            X
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default PrivilegesButton;
