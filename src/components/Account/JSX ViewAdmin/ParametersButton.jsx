import { useState} from "react";
import "../CSS ViewAdmin/ParametersButton.css";

function ParametersButton() {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <button className="parametersButton" onClick={() => setIsOpen(true)} type="button">
                <div className="buttonIcon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <circle cx="12" cy="12" r="4"/>
                    </svg>
                </div>
                <span className="buttonLabel">Gestionar parámetros</span>
            </button>

            {isOpen && (
                <div
                    className="parametersModalOverlay"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="parametersModalContainer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>Gestionar parámetros</h2>
                        <button className="parametersModalClose" onClick={() => setIsOpen(false)} title="Cerrar" aria-label="Cerrar" type="button">
                            X
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default ParametersButton;
