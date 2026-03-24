// ============================================================================
// Componente AcademicPeriodSelect
// ============================================================================
// Dropdown de selección de períodos académicos.
// Carga períodos desde API y notifica cambios al padre mediante una función.
// Cierra dropdown al hacer click fuera (click-outside pattern).
// ============================================================================

import { useState, useEffect, useRef } from "react";
import { fetchAcademicPeriods } from "../../services/academicPeriodsService";

function AcademicPeriodSelect({ onPeriodChange = () => {} }) {
    const [periods, setPeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState("Todos");
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Carga períodos académicos desde API en montaje
    useEffect(() => {
        const loadPeriods = async () => {
            try {
                const fetchedPeriods = await fetchAcademicPeriods();
                if (fetchedPeriods.length > 0) {
                    setPeriods(["Todos", ...fetchedPeriods]);
                } else {
                    setPeriods(["Todos"]);
                }
            } catch (error) {
                console.error("Error cargando períodos:", error);
                setPeriods(["Todos"]);
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

    const handleSelectPeriod = (period) => {
        setSelectedPeriod(period);
        onPeriodChange(period);
        setIsOpen(false);
    };

    const displayText = selectedPeriod === "Todos" ? "Todos los períodos" : selectedPeriod;

    return (
        <div className="academicPeriodSelectWrapper" ref={wrapperRef}>
            <button
                className="academicPeriodButton"
                onClick={() => setIsOpen(!isOpen)}
                title={displayText}
                aria-label="Seleccionar período académico"
                type="button"
            >
                <span>{displayText}</span>
            </button>

            {isOpen && (
                <div className="academicPeriodMenu">
                    {periods.map((period) => (
                        <button
                            key={period}
                            className={`academicPeriodOption ${selectedPeriod === period ? "selected" : ""}`}
                            onClick={() => handleSelectPeriod(period)}
                            type="button"
                        >
                            {period === "Todos" ? "Todos los períodos" : period}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AcademicPeriodSelect;
