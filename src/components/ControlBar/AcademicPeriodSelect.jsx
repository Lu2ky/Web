// ============================================================================
// Componente AcademicPeriodSelect
// ============================================================================
// Dropdown de selección de períodos académicos.
// Carga períodos desde API (con ID y nombre) y notifica cambios al padre
// mediante onPeriodChange, pasando el objeto completo { id, nombre }.
// Cierra dropdown al hacer click fuera (click-outside pattern).
// ============================================================================

import { useState, useEffect, useRef } from "react";
import { fetchAcademicPeriods } from "../../services/academicPeriodsService";

const NotebookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="notebook-icon">
        <path d="M2 6h4"/>
        <path d="M2 10h4"/>
        <path d="M2 14h4"/>
        <path d="M2 18h4"/>
        <rect width="16" height="20" x="4" y="2" rx="2"/>
        <path d="M16 2v20"/>
    </svg>
);

function AcademicPeriodSelect({ onPeriodChange = () => {} }) {
    const [periods, setPeriods] = useState([]); // Array de { id, nombre }
    const [selectedPeriod, setSelectedPeriod] = useState(null); // { id, nombre } o null para "Todos"
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Carga períodos académicos desde API en montaje
    useEffect(() => {
        const loadPeriods = async () => {
            try {
                const fetchedPeriods = await fetchAcademicPeriods();
                setPeriods(fetchedPeriods);
                // No establecer período inicial (por defecto "Todos")
            } catch (error) {
                console.error("Error cargando períodos:", error);
                setPeriods([]);
            }
        };
        loadPeriods();
    }, []);

    // Cierra el dropdown cuando se hace click fuera del componente
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleCloseUnrelatedUi = (event) => {
            const allowOpenUi = Array.isArray(event?.detail?.allowOpenUi) ? event.detail.allowOpenUi : [];
            if (!allowOpenUi.includes("dropdown-academic-period")) {
                setIsOpen(false);
            }
        };

        window.addEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
        return () => window.removeEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
    }, []);

    const handleSelectPeriod = (period) => {
        window.dispatchEvent(new CustomEvent("onboarding:academic-period-selected"));
        setSelectedPeriod(period);
        // Pasar el período seleccionado (o null para "Todos") al padre
        onPeriodChange(period);
        setIsOpen(false);
    };

    const displayText = selectedPeriod ? selectedPeriod.nombre : "Período Académico";

    return (
        <div className="academicPeriodSelectWrapper" ref={wrapperRef}>
            <button
                className="academicPeriodButton"
                onClick={() => {
                    setIsOpen((prev) => {
                        const nextState = !prev;
                        if (nextState) {
                            window.dispatchEvent(new CustomEvent("onboarding:academic-period-opened"));
                        }
                        return nextState;
                    });
                }}
                title={displayText}
                aria-label="Seleccionar período académico"
                type="button"
                data-onboarding-id="academic-period-button"
            >
                <NotebookIcon />
                <span>{displayText}</span>
            </button>

            {isOpen && (
                <div className="academicPeriodMenu" data-onboarding-id="academic-period-menu">
                    {/* Opción "Todos" */}
                    <button
                        className={`academicPeriodOption ${selectedPeriod === null ? "selected" : ""}`}
                        onClick={() => handleSelectPeriod(null)}
                        type="button"
                        title="Mostrar todos los períodos"
                        aria-label="Todos los períodos"
                    >
                        Todos los períodos
                    </button>
                    
                    {/* Períodos cargados desde API */}
                    {periods.map((period) => (
                        <button
                            key={period.id}
                            className={`academicPeriodOption ${selectedPeriod?.id === period.id ? "selected" : ""}`}
                            onClick={() => handleSelectPeriod(period)}
                            type="button"
                            title={`Seleccionar período ${period.nombre}`}
                            aria-label={`Período ${period.nombre}`}
                        >
                            {period.nombre}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AcademicPeriodSelect;
