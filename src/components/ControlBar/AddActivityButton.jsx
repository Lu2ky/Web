import { useState, useEffect } from "react";
import "../../styles/AddActivityButton.css";
import { saveActivity } from "../../services/personalActivitiesService";

const INITIAL_FORM_DATA = {
    title: "",
    description: "",
    day: "",
    startHour: "",
    endHour: ""
};

function AddActivityButton({ onActivitySaved }) {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);

    const [error, setError] = useState("");

    // Convierte hora militar a formato AM/PM para mostrar
    const formatHour = (hour, minutes = 0) => {
        const period = hour < 12 ? "AM" : "PM";
        const displayHour = hour % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, "0");
        return `${displayHour}:${displayMinutes} ${period}`;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        if (error) {
            setError("");
        }
    };

    const closeModal = ({ clearForm } = { clearForm: false }) => {
        setIsOpen(false);
        setError("");

        if (clearForm) {
            setFormData(INITIAL_FORM_DATA);
        }
    };

    const validateForm = () => {
        if (!formData.title.trim()) {
            return "El título es obligatorio.";
        }
        if (!formData.day) {
            return "Debes seleccionar un día.";
        }
        if (!formData.startHour || !formData.endHour) {
            return "Debes seleccionar hora de inicio y fin.";
        }
        const [startH, startM] = formData.startHour.split(":").map(Number);
        const [endH, endM] = formData.endHour.split(":").map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;
        if (startTotal >= endTotal) {
            return "La hora de inicio debe ser menor que la hora de fin.";
        }
        return "";
    };

    const handleSave = () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            // Guardar en localStorage
            saveActivity(formData);
        } catch (saveError) {
            setError("No se pudo guardar la actividad. Intenta nuevamente.");
            return;
        }

        closeModal({ clearForm: true });

        // Notificar al padre que se guardó una actividad
        if (onActivitySaved) {
            onActivitySaved();
        }
    };

    // Cerrar modal con tecla Esc
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape" && isOpen) {
                closeModal();
            }
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [isOpen]);

    return (
        <>
            <button className="addButton" onClick={() => setIsOpen(true)} type="button">
                Agregar actividad
            </button>


            {isOpen && (
                <div
                    className="modalOverlay"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => closeModal()}
                >
                    <div
                        className="modalContainer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>Nueva Actividad</h2>

                        <button className="modalClose" onClick={() => closeModal()} title="Cerrar" aria-label="Cerrar" type="button">
                            X
                        </button>
                        {error && <p className="errorMessage">{error}</p>}

                        <input
                            type="text"
                            name="title"
                            placeholder="Título"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />

                        <textarea
                            name="description"
                            placeholder="Descripción"
                            value={formData.description}
                            onChange={handleChange}
                        />

                        <select
                            name="day"
                            value={formData.day}
                            onChange={handleChange}
                        >
                            <option value="">Selecciona día</option>
                            <option value="Lunes">Lunes</option>
                            <option value="Martes">Martes</option>
                            <option value="Miércoles">Miércoles</option>
                            <option value="Jueves">Jueves</option>
                            <option value="Viernes">Viernes</option>
                            <option value="Sábado">Sábado</option>
                            <option value="Domingo">Domingo</option>
                        </select>

                        <label>Hora inicio</label>
                        <input
                            type="time"
                            name="startHour"
                            value={formData.startHour}
                            onChange={handleChange}
                            required
                        />
                        {formData.startHour && (
                            <p className="hourPreview">
                                Seleccionaste:{" "}
                                {formatHour(
                                    Number(formData.startHour.split(":")[0]),
                                    Number(formData.startHour.split(":")[1])
                                )}
                            </p>
                        )}

                        <label>Hora fin</label>
                        <input
                            type="time"
                            name="endHour"
                            value={formData.endHour}
                            onChange={handleChange}
                            required
                        />
                        {formData.endHour && (
                            <p className="hourPreview">
                                Seleccionaste:{" "}
                                {formatHour(
                                    Number(formData.endHour.split(":")[0]),
                                    Number(formData.endHour.split(":")[1])
                                )}
                            </p>
                        )}

                        <div className="modalActions">
                            <button
                                className="cancelButton"
                                onClick={() => closeModal({ clearForm: true })}
                                type="button"
                            >
                                Cancelar
                            </button>

                            <button
                                className="saveButton"
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

export default AddActivityButton;
