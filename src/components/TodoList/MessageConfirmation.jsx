import React from 'react';
import '../styles/confirmacionMessage.css';

export default function MessageConfirmation({ 
    isOpen, 
    onClose, 
    onConfirm,
    title = "¿Estás seguro de eliminar esto?",
    description = "Esta acción no se puede deshacer. La actividad se borrará permanentemente de tu horario.",
    confirmText = "Sí, eliminar",
    cancelText = "No, mantener"
}) {
    if (!isOpen) return null;

    // Iconos SVG simples
    const CloseIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    );

    const AlertIcon = () => (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
    );

    const CheckIcon = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 12 2 2 4-4"></path>
            <path d="M21 12c.552 0 1-.448 1-1V8a2 2 0 0 0-2-2h-5L12 3H7a2 2 0 0 0-2 2v3c0 .552.448 1 1 1z"></path>
        </svg>
    );

    return (
        <div className="confirmacion-message-overlay" onClick={onClose}>
            <div className="confirmacion-message-container" onClick={(e) => e.stopPropagation()}>
                {/* Barra decorativa */}
                <div className="confirmacion-message-gradient-bar" />
                
                <div className="confirmacion-message-content">
                    {/* Botón de cierre */}
                    <div className="confirmacion-message-close-container">
                        <button className="confirmacion-message-close-btn" onClick={onClose}>
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Icono central y textos */}
                    <div className="confirmacion-message-center">
                        <div className="confirmacion-message-icon-container">
                            <AlertIcon />
                        </div>
                        
                        <h3 className="confirmacion-message-title">
                            {title}
                        </h3>
                        
                        <p className="confirmacion-message-description">
                            {description}
                        </p>
                    </div>

                    {/* Botones de acción */}
                    <div className="confirmacion-message-actions">
                        <button className="confirmacion-message-cancel-btn" onClick={onClose}>
                            {cancelText}
                        </button>
                        
                        <button className="confirmacion-message-confirm-btn" onClick={onConfirm}>
                            {confirmText}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="confirmacion-message-footer">
                    <CheckIcon />
                    <span className="confirmacion-message-footer-text">
                        Confirmación de Seguridad • UPB Planner
                    </span>
                </div>
            </div>
        </div>
    );
}