import { useEffect, useState } from "react";
import "../../styles/addButton.css";

const defaultFilters = {
    status: "all",
    priority: "all",
    tag: ""
};

function ToDoFilterModal({ isOpen, onClose, onApply, initialFilters = defaultFilters, availableTags = [] }) {
    const [filters, setFilters] = useState(defaultFilters);

    useEffect(() => {
        if (isOpen) {
            setFilters({ ...defaultFilters, ...initialFilters });
        }
    }, [isOpen, initialFilters]);

    if (!isOpen) return null;

    const handleApply = () => {
        onApply({
            ...filters,
            tag: filters.tag.trim()
        });
        onClose();
    };

    const handleClear = () => {
        setFilters(defaultFilters);
        onApply(defaultFilters);
        onClose();
    };

    return (
        <div
            className="modalOverlay"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div className="modalContainer" onClick={e => e.stopPropagation()}>
                <h2>Filtrar tareas</h2>

                <button className="modalClose" onClick={onClose} title="Cerrar" aria-label="Cerrar" type="button">
                    X
                </button>

                <label>Estado</label>
                <select
                    value={filters.status}
                    onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                    <option value="all">Todas</option>
                    <option value="pending">Pendientes</option>
                    <option value="completed">Completadas</option>
                </select>

                <label>Prioridad</label>
                <select
                    value={filters.priority}
                    onChange={e => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                >
                    <option value="all">Todas</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                </select>

                <label>Etiqueta</label>
                {availableTags && availableTags.length > 0 ? (
                    <select
                        value={filters.tag}
                        onChange={e => setFilters(prev => ({ ...prev, tag: e.target.value }))}
                    >
                        <option value="">Todas</option>
                        {availableTags.map(t => (
                            <option key={t.id} value={t.label}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        type="text"
                        placeholder="Ej: Mathematics"
                        value={filters.tag}
                        onChange={e => setFilters(prev => ({ ...prev, tag: e.target.value }))}
                    />
                )}

                <div className="modalActions">
                    <button className="cancelButton" onClick={handleClear}>
                        Limpiar
                    </button>
                    <button className="saveButton" onClick={handleApply}>
                        Aplicar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ToDoFilterModal;