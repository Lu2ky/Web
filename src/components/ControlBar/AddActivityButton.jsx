import { useState, useEffect } from "react";
import "../../styles/AddActivityButton.css";
import { addPersonalActivity } from "../../services/PersonalFetcher";

const INITIAL_FORM_DATA = {
    title: "",
    description: "",
    day: "",
    startHour: "",
    endHour: "",
    dateStart: "",
    dateEnd: ""
};

function AddActivityButton({ userId, idCourse, onActivityAdd }) {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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
        if (!formData.dateStart) {
            return "Debes seleccionar la fecha de inicio.";
        }
        if (!formData.dateEnd) {
            return "Debes seleccionar la fecha de fin.";
        }
        const [startH, startM] = formData.startHour.split(":").map(Number);
        const [endH, endM] = formData.endHour.split(":").map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;
        if (startTotal >= endTotal) {
            return "La hora de inicio debe ser menor que la hora de fin.";
        }
        const dateStart = new Date(formData.dateStart);
        const dateEnd = new Date(formData.dateEnd);
        if (dateStart > dateEnd) {
            return "La fecha de inicio debe ser menor que la fecha de fin.";
        }
        return "";
    };

    const handleSave = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        if (!userId) {
            setError("Usuario no identificado. Por favor, recarga la página.");
            return;
        }

        setLoading(true);

        try {
            // Convertir fechas a ISO strings
            const dateStartISO = new Date(formData.dateStart).toISOString();
            const dateEndISO = new Date(formData.dateEnd).toISOString();

            // Preparar datos para la API
            const activityData = {
                title: formData.title,
                description: formData.description || "",
                day: formData.day,
                startHour: formData.startHour,
                endHour: formData.endHour,
                dateStart: dateStartISO,
                dateEnd: dateEndISO,
                idCourse: idCourse || null  // ✅ Agregar idCourse aquí
            };

            // Enviar a la API
            const response = await addPersonalActivity(userId, activityData);

            // Crear objeto con el formato esperado por BlockPersonal y PopUpPersonal
            const newActivity = {
                id: response.id || `activity-${Date.now()}`,
                name: formData.title,
                description: formData.description || "",
                tag: "Personal",
                day: formData.day,
                start_time: formData.startHour,
                end_time: formData.endHour,
                activity_name: formData.title,
                subject_name: formData.title,
                location: "",
                classroom: "",
                date_start: dateStartISO,
                date_end: dateEndISO,
                id_course: idCourse || null  // ✅ Incluir también en la actividad local
            };

            // Notificar al padre con la nueva actividad
            if (onActivityAdd) {
                onActivityAdd(newActivity);
            }

            closeModal({ clearForm: true });
        } catch (err) {
            console.error("Error al guardar actividad:", err);
            setError(`No se pudo guardar la actividad. ${err.message}`);
        } finally {
            setLoading(false);
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

    useEffect(() => {
        const handleCloseUnrelatedUi = (event) => {
            const allowOpenUi = Array.isArray(event?.detail?.allowOpenUi) ? event.detail.allowOpenUi : [];
            if (!allowOpenUi.includes("modal-add-activity")) {
                closeModal();
            }
        };

        window.addEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
        return () => window.removeEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
    }, []);

    return (
        <>
            <button
                className="addButton"
                onClick={() => {
                    setIsOpen(true);
                    window.dispatchEvent(new CustomEvent("onboarding:add-activity-opened"));
                }}
                type="button"
                data-onboarding-id="add-activity-button"
                title="Agregar actividad"
                aria-label="Agregar actividad"
            >
                Agregar actividad
            </button>


            {isOpen && (
                <div
                    className="modalOverlay"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="modalContainer"
                        data-onboarding-id="add-activity-modal"
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
                            onChange={(e) => {
                                handleChange(e);
                                if (String(e.target.value || "").trim()) {
                                    window.dispatchEvent(new CustomEvent("onboarding:add-activity-title-typed"));
                                }
                            }}
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

                        <label>Fecha de inicio</label>
                        <input
                            type="date"
                            name="dateStart"
                            value={formData.dateStart}
                            onChange={handleChange}
                            required
                        />

                        <label>Fecha de fin</label>
                        <input
                            type="date"
                            name="dateEnd"
                            value={formData.dateEnd}
                            onChange={handleChange}
                            required
                        />

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
                                disabled={loading}
                            >
                                {loading ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AddActivityButton;
