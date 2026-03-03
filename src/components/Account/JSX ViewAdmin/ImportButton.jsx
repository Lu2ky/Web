import { useState } from "react";
import "../../styles/ImportButton.css";

function ImportButton() {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <button className="importButton" onClick={() => setIsOpen(true)} type="button">
                <div className="buttonIcon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3v12"/>
                        <path d="m8 11 4 4 4-4"/>
                        <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4"/>
                    </svg>
                </div>
                <span className="buttonLabel">Importar horario</span>
            </button>

            {isOpen && (
                <div
                    className="importModalOverlay"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="importModalContainer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>Seleccionar archivo a importar</h2>
                        <button className="importModalClose" onClick={() => setIsOpen(false)} title="Cerrar" aria-label="Cerrar" type="button">
                            X
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default ImportButton;
