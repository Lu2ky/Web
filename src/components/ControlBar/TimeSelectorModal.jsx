import { useMemo, useState } from "react";
import "../../styles/TimeSelectorModal.css";

const DEFAULT_TIME = {
    hours: 0,
    minutes: 0
};

function TimeSelectorModal({ onSave }) {
    const [isOpen, setIsOpen] = useState(false);
    const [timeData, setTimeData] = useState(DEFAULT_TIME);
    const [selectedPreset, setSelectedPreset] = useState(null);

    const totalMinutes = useMemo(() => {
        return Number(timeData.hours) * 60 + Number(timeData.minutes);
    }, [timeData.hours, timeData.minutes]);

    const handleHoursChange = (event) => {
        const value = Number(event.target.value || 0);
        setTimeData((prev) => ({ ...prev, hours: Math.max(0, value) }));
        setSelectedPreset(null);
    };

    const handleMinutesChange = (event) => {
        const value = Number(event.target.value || 0);
        const boundedMinutes = Math.min(59, Math.max(0, value));
        setTimeData((prev) => ({ ...prev, minutes: boundedMinutes }));
        setSelectedPreset(null);
    };

    const PRESETS = [
        { minutes: 480, label: "8 h" },
        { minutes: 1440, label: "1 día" },
        { minutes: 10080, label: "1 semana" }
    ];

    const applyPreset = (minutes) => {
        if (minutes === "off") {
            setTimeData({ hours: 0, minutes: 0 });
            setSelectedPreset("off");
            return;
        }

        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        setTimeData({ hours: hrs, minutes: mins });
        setSelectedPreset(minutes);
    };



    const handleClose = () => {
        setIsOpen(false);
    };

    const handleSave = () => {
        if (onSave) {
            onSave({ ...timeData, totalMinutes });
        }
        handleClose();
    };

    return (
        <>
            <button
                className="timeSelectorButton"
                onClick={() => setIsOpen(true)}
                type="button"
                aria-label="Configurar tiempo"
                title="Configurar tiempo"
            >
                <svg id="svg-bell" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
                    <path d="M18.4 12c.8 3.8 2.6 5 2.6 5H3s3-2 3-9c0-3.3 2.7-6 6-6 1.8 0 3.4.8 4.5 2" />
                    <path d="m2 2 20 20" />
                    <path d="M10.3 21a2 2 0 0 0 3.4 0" />
                </svg>
            </button>

            {isOpen && (
                <div
                    className="timeModalOverlay"
                    role="dialog"
                    aria-modal="true"
                    onClick={handleClose}
                >
                    <div className="timeModalContainer" onClick={(event) => event.stopPropagation()}>
                        <h2>Seleccionar tiempo</h2>

                        <button
                            className="timeModalClose"
                            onClick={handleClose}
                            title="Cerrar"
                            aria-label="Cerrar"
                            type="button"
                        >
                            X
                        </button>

                        <div className="presetBlock">
                            <label className="presetLabel">Duración predefinida</label>
                            <div className="presetChips">
                                {PRESETS.map((p) => (
                                    <button
                                        key={p.minutes}
                                        type="button"
                                        className={`time-chip ${selectedPreset === p.minutes ? "active" : ""}`}
                                        onClick={() => applyPreset(p.minutes)}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        

                        {/* no programmatic limit configured */}

                        

                        <div className="timeModalActions">
                            <button className="timeCancelButton" onClick={handleClose} type="button">
                                Cancelar
                            </button>
                            <button
                                className="timeSaveButton"
                                onClick={handleSave}
                                type="button"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default TimeSelectorModal;