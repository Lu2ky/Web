import { useState, useEffect } from "react";
import DropdownBase from "../Templates/DropdownBase";
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
        <DropdownBase
            open={isOpen}
            onOpenChange={(nextState, reason) => {
                setIsOpen(nextState);
                if (nextState && reason === "trigger") {
                    window.dispatchEvent(new CustomEvent("onboarding:academic-period-opened"));
                }
            }}
            roleMode="menu"
            className="controlBarDropdownRoot controlBarDropdownRoot--academicPeriod"
            menuClassName="controlBarDropdownMenu controlBarDropdownMenu--academicPeriod"
            trigger={({ ref, onClick, ...triggerProps }) => (
                <button
                    ref={ref}
                    className="controlBarDropdownTrigger controlBarDropdownTrigger--academicPeriod"
                    onClick={onClick}
                    title={displayText}
                    aria-label="Seleccionar período académico"
                    type="button"
                    data-onboarding-id="academic-period-button"
                    {...triggerProps}
                >
                    <NotebookIcon />
                    <span>{displayText}</span>
                </button>
            )}
        >
            {({ select }) => (
                <ul className="controlBarDropdownList" data-onboarding-id="academic-period-menu">
                    <li>
                        <button
                            className={`controlBarDropdownOption ${selectedPeriod === null ? "is-selected" : ""}`}
                            onClick={() => {
                                handleSelectPeriod(null);
                                select();
                            }}
                            type="button"
                            title="Mostrar todos los períodos"
                            aria-label="Todos los períodos"
                        >
                            Todos los períodos
                        </button>
                    </li>

                    {periods.map((period) => (
                        <li key={period.id}>
                            <button
                                className={`controlBarDropdownOption ${selectedPeriod?.id === period.id ? "is-selected" : ""}`}
                                onClick={() => {
                                    handleSelectPeriod(period);
                                    select();
                                }}
                                type="button"
                                title={`Seleccionar período ${period.nombre}`}
                                aria-label={`Período ${period.nombre}`}
                            >
                                {period.nombre}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </DropdownBase>
    );
}

export default AcademicPeriodSelect;
