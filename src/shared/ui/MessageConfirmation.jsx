// ============================================================================
// Componente MessageConfirmation
// ============================================================================
// Modal de confirmación genérico reutilizable.
// Personalizable con título, descripción y textos de botones.
//
// Accesibilidad: role="dialog", focus trap, cierre con Escape y restauración
// del foco al elemento que abrió el diálogo.
// ============================================================================

import { useEffect, useId, useRef } from 'react';
import './ConfirmMessage.css';

const FOCUSABLE_SELECTOR =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function MessageConfirmation({ 
    isOpen, 
    onClose, 
    onConfirm,
    title = "¿Estás seguro de eliminar esto?",
    description = "Esta acción no se puede deshacer. La actividad se borrará permanentemente de tu horario.",
    confirmText = "Sí, eliminar",
    cancelText = "No, mantener"
}) {
    const titleId = useId();
    const descriptionId = useId();
    const containerRef = useRef(null);
    const restoreFocusRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;

        restoreFocusRef.current = document.activeElement;
        const container = containerRef.current;
        const focusables = container ? [...container.querySelectorAll(FOCUSABLE_SELECTOR)] : [];
        // En una acción destructiva el foco inicial va a "cancelar".
        const initial = container?.querySelector('.confirmacion-message-cancel-btn') || focusables[0] || container;
        initial?.focus();

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose?.();
                return;
            }

            if (event.key !== 'Tab' || !container) return;

            const elements = [...container.querySelectorAll(FOCUSABLE_SELECTOR)];
            if (elements.length === 0) {
                event.preventDefault();
                return;
            }

            const first = elements[0];
            const last = elements[elements.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            const previous = restoreFocusRef.current;
            if (previous && typeof previous.focus === 'function' && document.contains(previous)) {
                previous.focus();
            }
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="confirmacion-message-overlay"
            onClick={onClose}
            role="presentation"
        >
            <div
                className="confirmacion-message-container"
                ref={containerRef}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                tabIndex={-1}
                data-onboarding-id="todo-delete-modal"
            >
                {/* Barra decorativa */}
                <div className="confirmacion-message-gradient-bar" aria-hidden="true" />
                
                <div className="confirmacion-message-content">
                    {/* Botón de cierre */}
                    <div className="confirmacion-message-close-container">
                        <button
                            className="confirmacion-message-close-btn"
                            onClick={onClose}
                            title="Cerrar"
                            aria-label="Cerrar"
                            type="button"
                        >
                            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    {/* Icono central y textos */}
                    <div className="confirmacion-message-center">
                        <div className="confirmacion-message-icon-container" aria-hidden="true">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </div>
                        
                        <h3 className="confirmacion-message-title" id={titleId}>
                            {title}
                        </h3>
                        
                        <p className="confirmacion-message-description" id={descriptionId}>
                            {description}
                        </p>
                    </div>

                    {/* Botones de acción */}
                    <div className="confirmacion-message-actions">
                        <button 
                            className="confirmacion-message-cancel-btn" 
                            onClick={onClose}
                            type="button"
                        >
                            {cancelText}
                        </button>
                        
                        <button 
                            className="confirmacion-message-confirm-btn" 
                            onClick={onConfirm}
                            type="button"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="confirmacion-message-footer">
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 12 2 2 4-4"></path>
                        <path d="M21 12c.552 0 1-.448 1-1V8a2 2 0 0 0-2-2h-5L12 3H7a2 2 0 0 0-2 2v3c0 .552.448 1 1 1z"></path>
                    </svg>
                    <span className="confirmacion-message-footer-text">
                        Confirmación de Seguridad • UPB Planner
                    </span>
                </div>
            </div>
        </div>
    );
}
