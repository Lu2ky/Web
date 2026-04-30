import { useEffect, useId, useMemo, useRef } from "react";
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
    const containerRef = useRef(null);
    const closeBtnRef = useRef(null);
    const hasInitializedFocusRef = useRef(false);
    const modalId = useId();
    const titleId = useMemo(() => `modal-title-${modalId}`, [modalId]);
    const descriptionId = useMemo(() => `modal-description-${modalId}`, [modalId]);

    useEffect(() => {
        if (isOpen) {
            const previousFocusedElement = document.activeElement;
            stackModal.push(modalId);
            lockBodyScroll();

            // Solo establecer el focus inicial una vez
            if (!hasInitializedFocusRef.current) {
                const focusTarget = initialFocusRef?.current || closeBtnRef.current;
                focusTarget?.focus();
                hasInitializedFocusRef.current = true;
            }

            const onKeyDown = (e) => {
                const isTopModal = stackModal[stackModal.length - 1] === modalId;
                if (!isTopModal) return;

                if (e.key === "Escape" && closeOnEscape) {
                    e.preventDefault();
                    onClose();
                    return;
                }

                if (e.key === "Tab") {
                    const items = getFocusableElements(containerRef.current);
                    if (items.length === 0) return;
                    const firstItem = items[0];
                    const lastItem = items[items.length - 1];

                    if (e.shiftKey && document.activeElement === firstItem) {
                        e.preventDefault();
                        lastItem.focus();
                    } else if (!e.shiftKey && document.activeElement === lastItem) {
                        e.preventDefault();
                        firstItem.focus();
                    }
                }
            };

            document.addEventListener("keydown", onKeyDown);

            return () => {
                document.removeEventListener("keydown", onKeyDown);
                const i = stackModal.indexOf(modalId);
                if (i >= 0) stackModal.splice(i, 1);
                unlockBodyScroll();
                hasInitializedFocusRef.current = false;

                const restoreEl = restoreFocusRef?.current || previousFocusedElement;
                if (restoreEl && typeof restoreEl.focus === "function") {
                    restoreEl.focus();
                }
            };
        } else {
            // Asegurar que si isOpen es false, se reestablece el scroll
            if (lockCount > 0) {
                lockCount = 0;
                document.body.style.overflow = "";
            }
        }
    }, [isOpen, onClose, modalId, initialFocusRef, restoreFocusRef, closeOnEscape]);

    if (!isOpen) return null;

    const handleOverlayClick = () => {
        if (closeOnOverlayClick) onClose();
    };

    return (
        <div className="modal-overlay" role="presentation" onClick={handleOverlayClick}>
            <div
                className={`modal-container ${className}`.trim()}
                ref={containerRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-label={title ? undefined : ariaLabel}
                aria-describedby={ariaDescribedBy || descriptionId}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="modal-header">
                    {title ? (
                        <h2 id={titleId} className="modal-title">
                            {title}
                        </h2>
                    ) : (
                        <span className="sr-only">Dialog</span>
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

                <div id={descriptionId} className={`modal-body ${bodyClassName}`.trim()}>
                    {children}
                </div>

                {showFooter && (
                    <footer className={`modal-footer ${footerClassName}`.trim()}>
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
}
