import { useEffect, useState } from "react";
import "../../styles/addButton.css";
import Modal from '../Templates/Modal';
import FilterFormContent from './FilterFormContent';

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
            window.dispatchEvent(new CustomEvent("onboarding:todo-filter-modal-opened"));
        }
    }, [isOpen, initialFilters]);

    const handleApply = () => {
        window.dispatchEvent(new CustomEvent("onboarding:todo-filter-applied"));
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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Filtrar tareas"
            closeLabel="Cerrar"
            showFooter={false}
            closeOnOverlayClick={false}
            closeOnEscape={true}
            bodyClassName="modal-filter-body"
        >
            <FilterFormContent
                filters={filters}
                setFilters={setFilters}
                availableTags={availableTags}
            />

            <div className="modalActions">
                <button 
                    className="cancelButton" 
                    onClick={handleClear}
                    title="Limpiar todos los filtros"
                    aria-label="Limpiar filtros"
                    type="button"
                >
                    Limpiar
                </button>
                <button 
                    className="saveButton" 
                    onClick={handleApply}
                    title="Aplicar filtros seleccionados"
                    aria-label="Aplicar filtros"
                    type="button"
                >
                    Aplicar
                </button>
            </div>
        </Modal>
    );
}

export default ToDoFilterModal;