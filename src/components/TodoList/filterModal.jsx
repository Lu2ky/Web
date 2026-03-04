import { useState, useEffect } from 'react'
import '../../styles/filterModal.css'

/**
 * Modal de filtrado para To-Do List
 * Props:
 *   - isOpen: boolean — controla la visibilidad
 *   - onClose: () => void — cerrar el modal
 *   - userTags: [{ id, nombre }] — etiquetas del usuario desde la API
 *   - selectedTags: string[] — etiquetas actualmente seleccionadas
 *   - onApply: (selectedTags: string[]) => void — aplicar filtro
 *   - onClear: () => void — limpiar todos los filtros
 */
function FilterModal({ isOpen, onClose, userTags = [], selectedTags = [], onApply, onClear }) {
    // Estado local para las tags seleccionadas dentro del modal
    const [localSelected, setLocalSelected] = useState([]);

    // Sincronizar con los filtros activos al abrir
    useEffect(() => {
        if (isOpen) {
            setLocalSelected([...selectedTags]);
        }
    }, [isOpen, selectedTags]);

    // Cerrar con Esc
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // No renderizar si no está abierto
    if (!isOpen) return null;

    // Toggle de selección de una etiqueta
    const toggleTag = (tagName) => {
        if (!tagName) return; // Protección contra undefined
        const normalized = tagName.toLowerCase();
        setLocalSelected((prev) =>
            prev.includes(normalized)
                ? prev.filter((t) => t !== normalized)
                : [...prev, normalized]
        );
    };

    // Verificar si una etiqueta está seleccionada
    const isSelected = (tagName) => {
        if (!tagName) return false; // Protección contra undefined
        return localSelected.includes(tagName.toLowerCase());
    };

    // Aplicar filtros y cerrar
    const handleApply = () => {
        if (onApply) onApply(localSelected);
    };

    // Limpiar filtros y cerrar
    const handleClear = () => {
        setLocalSelected([]);
        if (onClear) onClear();
    };

    return (
        <div className="filter-modal-overlay" onClick={onClose}>
            <div className="filter-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="filter-modal-header">
                    <h3>Filtrar por etiquetas</h3>
                    <button
                        className="filter-modal-close"
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>
                </div>

                {/* Cuerpo — Lista de etiquetas */}
                <div className="filter-modal-body">
                    {userTags.length === 0 ? (
                        <p className="filter-modal-empty">
                            No tienes etiquetas disponibles.
                        </p>
                    ) : (
                        <div className="filter-tags-grid">
                            {userTags
                                .filter((tag) => tag && tag.nombre) // Filtrar tags sin nombre
                                .map((tag) => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        className={`filter-tag-btn ${isSelected(tag.nombre) ? 'filter-tag-btn--active' : ''}`}
                                        onClick={() => toggleTag(tag.nombre)}
                                    >
                                        {/* Checkmark si está seleccionado */}
                                        {isSelected(tag.nombre) && (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                        {tag.nombre}
                                    </button>
                                ))}
                        </div>
                    )}
                </div>

                {/* Contador de seleccionados */}
                {localSelected.length > 0 && (
                    <p className="filter-modal-count">
                        {localSelected.length} etiqueta{localSelected.length > 1 ? 's' : ''} seleccionada{localSelected.length > 1 ? 's' : ''}
                    </p>
                )}

                {/* Acciones */}
                <div className="filter-modal-actions">
                    <button
                        className="filter-clear-btn"
                        onClick={handleClear}
                        type="button"
                    >
                        Limpiar filtros
                    </button>
                    <button
                        className="filter-apply-btn"
                        onClick={handleApply}
                        type="button"
                    >
                        Aplicar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FilterModal;