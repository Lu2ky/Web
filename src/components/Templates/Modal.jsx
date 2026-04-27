import { useEffect, useId, useMemo, useRef } from "react"; // useRef para manejo de referencias sin
//  renderizar todo de nuevo, useEffect para manejo de eventos y efectos secundarios
import "./Modal.css";

// Recibe 4 propiedades: isOpen(esta abierto), onClose(función para cerrar), title(título del modal) y children(contenido del modal)
const stackModal = []; // pila para manejar múltiples modales abiertos, asegurando que el enfoque y eventos se manejen correctamente en caso de tener varios modales anidados o abiertos al mismo tiempo
let lockCount = 0; // contador para manejar el bloqueo del scroll del body, asegurando que solo se desbloquee cuando todos los modales estén cerrados

function lockBodyScroll() {
    lockCount++;
    if (lockCount === 1) {
        document.body.style.overflow = "hidden"; // bloquea el scroll del body para evitar que el fondo se mueva mientras el modal esta activo
    }
}

function unlockBodyScroll() {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
        document.body.style.overflow = ""; // restaura el scroll del body cuando todos los modales estén cerrados
    }
}

function getFocusableElements(container) {
    if (!container) return [];
    return Array.from(
        container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
    ).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden")); // filtra elementos que no son interactivos o están ocultos para mejorar la accesibilidad
}

export default function ModalBase({
    isOpen,
    onClose,
    title,
    children,
    onConfirm = null,
    confirmLabel = "Confirmar",
    closeLabel = "Cerrar",
    closeOnOverlayClick = false, // false para q no cierre al hacer clic en el fondo, true para que cierre al hacer clic fuera del modal
    closeOnEscape = true, // true para que cierre al presionar Escape, false para que no cierre con Escape
    showFooter = true, // true para mostrar el pie del modal con botones, false para ocultarlo y solo mostrar el contenido
    initialFocusRef,
    restoreFocusRef,
    ariaLabel,
    ariaDescribedBy,
    className = "",
    bodyClassName = "",
    footerClassName = "",
}) {
    const containerRef = useRef(null); // ref para el contenedor del modal, para manejar el enfoque y eventos de teclado
    const closeBtnRef = useRef(null); // ref para el botón de cerrar, para establecer el foco inicial cuando se abre el modal
    const modalId = useId(); // ID único para el modal, utilizado para accesibilidad y manejo de eventos
    const titleId = useMemo(()=> `modal-title-${modalId}`, [modalId]); // ID para el título del modal, utilizado para aria-labelledby
    const descriptionId = useMemo(() => `modal-description-${modalId}`, [modalId]); // ID para la descripción del modal, utilizado para aria-describedby

    useEffect(() => {
        if (!isOpen) return;
        const previousFocusedElement = document.activeElement; // Guarda el elemento que tenía el foco antes de abrir el modal para restaurarlo al cerrar
        stackModal.push(modalId); // Agrega el ID del modal a la pila de modales abiertos
        lockBodyScroll(); // Bloquea el scroll del body para evitar que el fondo se mueva mientras el modal esta activo

        const focusTarget = initialFocusRef?.current || closeBtnRef.current; // Determina el elemento que recibirá el foco inicial, priorizando el ref proporcionado y luego el botón de cerrar
        focusTarget?.focus(); // Establece el foco en el elemento objetivo para mejorar la accesibilidad

        const onKeyDown = (e) => {
            const isTopModal = stackModal[stackModal.length - 1] === modalId; // Verifica si este modal es el que está en la cima de la pila, para manejar eventos solo en el modal activo
            if (!isTopModal) return; // Si no es el modal activo, no maneja los eventos de teclado

            if (e.key === "Escape" && closeOnEscape) {
                e.preventDefault(); // Previene el comportamiento por defecto de Escape para evitar conflictos con otros modales o elementos
                onClose(); // Llama a la función de cierre del modal
                return;
            }

            if (e.key === "Tab") {
                const items = getFocusableElements(containerRef.current); // Obtiene todos los elementos enfocables dentro del modal para manejar el ciclo de enfoque
                if (items.length === 0) return; // Si no hay elementos enfocables, no hace nada
                const firstItem = items[0]; // Primer elemento enfocables
                const lastItem = items[items.length - 1]; // Último elemento enfocables

                if (e.shiftKey && document.activeElement === firstItem) {
                    e.preventDefault();
                    lastItem.focus(); // Si se presiona Shift+Tab en el primer elemento, mueve el foco al último para crear un ciclo de enfoque
                } else if (!e.shiftKey && document.activeElement === lastItem) {
                    e.preventDefault();
                    firstItem.focus(); // Si se presiona Tab en el último elemento, mueve el foco al primero para crear un ciclo de enfoque
                }
            }
        };

        document.addEventListener("keydown", onKeyDown); // Agrega el listener de eventos de teclado para manejar Escape y Tab

        return () => {
            document.removeEventListener("keydown", onKeyDown); // Limpia el listener de eventos de teclado al cerrar el modal
            const i= stackModal.indexOf(modalId);
            if (i >= 0) stackModal.splice(i, 1); // Elimina el ID del modal de la pila de modales abiertos
            unlockBodyScroll(); // Desbloquea el scroll del body cuando se cierra el modal

            const restoreEl = restoreFocusRef?.current || previousFocusedElement; // Determina el elemento al que se restaurará el foco, priorizando el ref proporcionado y luego el elemento previamente enfocado
            if (restoreEl && typeof restoreEl.focus === "function") {
                restoreEl.focus();
            }
        };
    }, [isOpen, 
        onClose, 
        modalId, 
        initialFocusRef, 
        restoreFocusRef, 
        closeOnEscape
    ]);

    if (!isOpen) return null; // Si el modal no está abierto, no renderiza nada

    const handleOverlayClick = () => {
        if (closeOnOverlayClick) onClose(); // Si se permite cerrar al hacer clic en el fondo, llama a la función de cierre del modal
    };

    return (
        <div className="modal-overlay" role="presentation" onClick={handleOverlayClick}>
            <div
                className={'modal-container ${className}'.trim()} // Permite agregar clases personalizadas al contenedor del modal para estilos específicos
                ref={containerRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined} // Solo agrega aria-labelledby si hay un título para mejorar la accesibilidad
                aria-label={title ? undefined : ariaLabel} // Si no hay título, utiliza aria-label para describir el propósito del modal
                aria-describedby={ariaDescribedBy || descriptionId} // Permite describir el contenido del modal para mejorar la accesibilidad
                onClick={(e) => e.stopPropagation()} // Evita que los clics dentro del modal cierren el modal si closeOnOverlayClick es true
            >
                <header className="modal-header">
                    {title ? (
                        <h2 id={titleId} className="modal-title">
                            {title}
                        </h2>
                    ) : (
                        <span className="sr-only">Dialog</span> // Si no hay título, agrega un elemento oculto para accesibilidad
                    )}

                    <button
                        ref={closeBtnRef}
                        className="modal-close-btn"
                        onClick={onClose}
                        aria-label="Cerrar modal"
                    >
                        ✕
                    </button>
                </header>

                <div id={descriptionId} className={'modal-body ${bodyClassName}'.trim()}>
                    {children}
                </div>

                {showFooter && (
                    <footer className={'modal-footer ${footerClassName}'.trim()}>
                        {onConfirm ? (
                            <>
                                <button className="modal-secondary-btn" onClick={onClose}>
                                    {closeLabel}
                                </button>
                                <button className="modal-primary-btn" onClick={onConfirm}>
                                    {confirmLabel}
                                </button>
                            </>
                        ) : (
                            <button className="modal-action-btn" onClick={onClose}>
                                {closeLabel}
                            </button>
                        )}
                    </footer>
                )}

            </div>
        </div>
    );
};
