import { useEffect, useRef } from "react"; // useRef para manejo de referencias sin
//  renderizar todo de nuevo, useEffect para manejo de eventos y efectos secundarios
import "./Modal.css";

// Recibe 4 propiedades: isOpen(esta abierto), onClose(función para cerrar), title(título del modal) y children(contenido del modal)
const Modal = ({ isOpen, onClose, title, children, onConfirm = null, confirmLabel = "Confirmar", closeLabel = "Cerrar" }) => { // componente funcional y base para las ventanas de notificación y configuración
    const modalRef = useRef(null); // ref para el contenedor del modal, para manejar el enfoque y eventos de teclado
    const closeBtnRef = useRef(null); // ref para el botón de cerrar, para establecer el foco inicial cuando se abre el modal

    // Solo ejecutar si el modal esta abierto
    useEffect(() => {
        if (!isOpen) return;
        // Si el usuario da Escape, se cierra el modal
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }

            // Captura todos los elementos que pueden recibir foco dentro del modal
            if (e.key === "Tab") {
                const focusableElements = modalRef.current?.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );

                if (!focusableElements || focusableElements.length === 0) return;

                const firstElement = focusableElements[0]; // Primer elemento enfocable
                const lastElement = focusableElements[focusableElements.length - 1]; // Último elemento enfocable

                if (e.shiftKey) { // evitan que el tabulador saca el foco fuera del modal
                    if (document.activeElement === firstElement) {
                        e.preventDefault(); // si esta en el primer elemento y se presiona shift+tab, se previene el comportamiento por defecto y se mueve el foco al último elemento
                        lastElement.focus(); 
                    }
                } else {
                    if (document.activeElement === lastElement) { // Si esta en el último se presiona tab y vuelve al primero
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        // Al abrir el modal, se establece el foco en el botón de cerrar para mejorar la accesibilidad
        closeBtnRef.current?.focus();
        // Escucha las teclas mientras el modal este abierto 
        document.addEventListener("keydown", handleKeyDown);
        // Limpieza de eventos, elimina el listener
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);
    // si no esta abierto, no renderiza nada
    if (!isOpen) return null;
{/*Fondo Oscuro */}
    return ( 
        <div
            className="modal-overlay" 
            role="presentation"
        >
            {/*Contenedor principal, accesibilidad y evita que al dar clic dentro se cierre*/}
            <div
                className="modal-container" 
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="modal-header"> {/* Titulo y cierre */}
                    <h2 id="modal-title" className="modal-title">
                        {title}
                    </h2>
                    <button
                        ref={closeBtnRef}
                        className="modal-close-btn"
                        onClick={onClose}
                        aria-label="Cerrar modal"
                    >
                        ✕
                    </button>
                </header>

                <div className="modal-body">{children}</div> {/* Contenido dinámico */}

                <footer className="modal-footer"> {/*Pie del modal y boton de cerrar*/}
                    {onConfirm ? (
                        <>
                            <button className="modal-secondary-btn" onClick={onClose}>
                                {closeLabel}
                            </button>
                            <button className="modal-action-btn" onClick={onConfirm}>
                                {confirmLabel}
                            </button>
                        </>
                    ) : (
                        <button className="modal-action-btn" onClick={onClose}>
                            {closeLabel}
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default Modal;