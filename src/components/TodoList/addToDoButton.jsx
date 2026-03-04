import { useState, useEffect } from "react";
import "../../styles/addToDoButton.css";
import { createReminder } from "../../services/ToDoListTagFetcher"; // Servicio para crear recordatorio en el backend

const INITIAL_FORM_DATA = {
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
    priority: "media", // Valor por defecto
    tag1: "",
    tag2: "",
    tag3: "",
    tag4: "",
    tag5: "",
};

// Opciones de prioridad para el select
const PRIORITY_OPTIONS = [
    { value: "alta", label: "Alta" },
    { value: "media", label: "Media" },
    { value: "baja", label: "Baja" },
];

// Componente para el botón "+" que abre el modal de creación de recordatorio
function AddToDoButton({ userId, onTaskAdd, userTags = [] }) { // userId para asociar el recordatorio al usuario, onTaskAdd para notificar al padre (TodoList) de la nueva tarea
    const [isOpen, setIsOpen] = useState(false); // Estado para controlar si el modal está abierto o cerrado
    const [formData, setFormData] = useState(INITIAL_FORM_DATA); // Estado para almacenar los datos del formulario
    const [error, setError] = useState(""); // Estado para almacenar mensajes de error y mostrarlos en el modal
    const [loading, setLoading] = useState(false); // Estado para controlar si se está guardando el recordatorio (mostrar "Guardando..." en el botón)
    // Controla cuántos campos de tag se muestran (mínimo 1, máximo 5)
    const [visibleTags, setVisibleTags] = useState(1);

    // Sugerencia de etiquetas 
    const [activeSuggestionField, setActiveSuggestionField] = useState(null); // Campo de tag activo para mostrar sugerencias
    const [filteredSuggestions, setFilteredSuggestions] = useState([]); // Sugerencias filtradas según lo que el usuario escribe

    // Maneja cambios en los campos del formulario, actualizando el estado formData
    const handleChange = (e) => {
        const { name, value } = e.target; // name corresponde a los nombres de los campos
        setFormData((prev) => ({  // Actualizar el campo correspondiente en formData manteniendo los demás campos sin cambios
            ...prev,
            [name]: value,
        }));
        if (error) setError("");
        // Si es un campo de tag, filtrar sugerencias
        if (name.startsWith("tag")) {
            setActiveSuggestionField(name);
            if (value.trim() && userTags.length > 0) {
                const filtered = userTags.filter((t) =>
                    t.nombre && t.nombre.toLowerCase().includes(value.toLowerCase())
                );
                setFilteredSuggestions(filtered);
            } else {
                setFilteredSuggestions([]);
            }
        }
    };

    // Seleccionar una sugerencia de etiqueta para el campo activo
    const selectSuggestion = (tag) => {
        if (activeSuggestionField) {
            setFormData((prev) => ({
                ...prev,
                [activeSuggestionField]: tag,
            }));
        }
        setActiveSuggestionField(null);
        setFilteredSuggestions([]);
    };

    // Cerrar sugerencias con delay para permitir click en la sugerencia
    const closeSuggestions = () => {
        setTimeout(() => {
            setActiveSuggestionField(null);
            setFilteredSuggestions([]);
        }, 200);
    };

    // Función para cerrar el modal, opcionalmente limpiando el formulario
    const closeModal = ({ clearForm } = { clearForm: false }) => {
        setIsOpen(false);
        setError("");
        if (clearForm) {
            setFormData(INITIAL_FORM_DATA);
            setVisibleTags(1);
        }
    };

    // Validar el formulario antes de guardar, asegurándose de que se hayan ingresado los campos obligatorios (título, fecha y hora)
    const validateForm = () => {
        if (!formData.title.trim()) {
            return "El título es obligatorio.";
        }
        if (!formData.dueDate) {
            return "Debes seleccionar una fecha límite.";
        }
        if (!formData.dueTime) {
            return "Debes seleccionar una hora límite.";
        }
        return "";
    };

    // Formatear la hora para mostrar un preview amigable (ej. "02:30 p.m.")
    const formatHourPreview = (timeStr) => {
        if (!timeStr) return ""; // Si no hay hora, no mostrar nada
        const [hourStr, minute] = timeStr.split(":"); // timeStr viene en formato "HH:MM"
        let hour = parseInt(hourStr, 10); // Convertir a número para formatear
        const suffix = hour >= 12 ? "p.m." : "a.m."; // Determinar si es a.m. o p.m.
        if (hour === 0) hour = 12; // Convertir 00:XX a 12:XX a.m.
        else if (hour > 12) hour -= 12; // Convertir horas mayores a 12 al formato de 12 horas
        return `${hour.toString().padStart(2, "0")}:${minute} ${suffix}`; // Formatear la hora con ceros a la izquierda y el sufijo
    };

    // Función para manejar la acción de guardar el nuevo recordatorio, validando el formulario, enviando los datos a la API y notificando al padre (TodoList) de la nueva tarea creada
        const handleSave = async () => {
        const validationError = validateForm();
        if (validationError) { setError(validationError); return; }
        if (!userId) { setError("Usuario no identificado."); return; }

        setLoading(true);

        try {
            const tagsArray = [
                formData.tag1, formData.tag2, formData.tag3,
                formData.tag4, formData.tag5,
            ].map((t) => t.trim()).filter(Boolean);

            const taskData = {
                title: formData.title,
                description: formData.description,
                dueDate: formData.dueDate,
                dueTime: formData.dueTime,
                priority: formData.priority,
                tags: tagsArray,
            };

            // POST a la API
            const response = await createReminder(userId, taskData);

            // La API retorna { success: true } sin data
            // Crear objeto temporal para mostrar inmediatamente en la UI
            if (response?.success) {
                const newTask = {
                    id: `todo-${Date.now()}`,       // ID temporal
                    userId: userId,
                    reminderId: null,                // No lo tenemos aún
                    title: formData.title,
                    description: formData.description || "",
                    dueDate: formData.dueDate,
                    dueTime: formData.dueTime,
                    completed: false,
                    isDeleted: false,
                    priority: formData.priority,
                    tags: tagsArray.map((label, i) => ({ id: `tag-new-${i}`, label })),
                };

                if (onTaskAdd) onTaskAdd(newTask);
                closeModal({ clearForm: true });
            } else {
                throw new Error("La API no confirmó la creación");
            }

        } catch (err) {
            console.error("Error al guardar:", err);
            setError(`No se pudo guardar. ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Agregar campo de tag visible
    const addTagField = () => {
        if (visibleTags < 5) {
            setVisibleTags((prev) => prev + 1);
        }
    };

    // Remover último campo de tag
    const removeTagField = () => {
        if (visibleTags > 1) {
            // Limpiar el campo que se va a ocultar
            setFormData((prev) => ({
                ...prev,
                [`tag${visibleTags}`]: "",
            }));
            setVisibleTags((prev) => prev - 1);
        }
    };

    // Cerrar con Esc
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape" && isOpen) {
                closeModal();
            }
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [isOpen]);

    // Renderizar campos de tags dinámicos
    const renderTagFields = () => {
        const fields = [];
        for (let i = 1; i <= visibleTags; i++) {
            fields.push(
                <input
                    key={`tag${i}`}
                    type="text"
                    name={`tag${i}`}
                    placeholder={`Etiqueta ${i}`}
                    value={formData[`tag${i}`]}
                    onChange={handleChange}
                />
            );
        }
        return fields;
    };

    // Preview de tags ingresados
    const getEnteredTags = () => {
        return [formData.tag1, formData.tag2, formData.tag3, formData.tag4, formData.tag5]
            .map((t) => t.trim())
            .filter(Boolean);
    };

    return (
        <>
            {/* Botón "+" del header */}
            <button
                className="btn-add"
                onClick={() => setIsOpen(true)}
                type="button"
                aria-label="Agregar tarea"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </button>

            {/* Modal */}
            {isOpen && (
                <div
                    className="todo-modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => closeModal()}
                >
                    <div
                        className="todo-modal-container"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>Nuevo Recordatorio</h2>

                        <button
                            className="todo-modal-close"
                            onClick={() => closeModal()}
                            title="Cerrar"
                            aria-label="Cerrar"
                            type="button"
                        >
                            ✕
                        </button>

                        {error && <p className="todo-error-message">{error}</p>}

                        {/* Título */}
                        <input
                            type="text"
                            name="title"
                            placeholder="Título del recordatorio*"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />

                        {/* Descripción */}
                        <textarea
                            name="description"
                            placeholder="Descripción (opcional)"
                            value={formData.description}
                            onChange={handleChange}
                        />

                        {/* Prioridad */}
                        <label>Prioridad</label>
                        <select
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                        >
                            {PRIORITY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>

                        {/* Fecha límite */}
                        <label>Fecha límite*</label>
                        <input
                            type="date"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleChange}
                            required
                        />

                        {/* Hora límite */}
                        <label>Hora límite*</label>
                        <input
                            type="time"
                            name="dueTime"
                            value={formData.dueTime}
                            onChange={handleChange}
                            required
                        />
                        {formData.dueTime && (
                            <p className="todo-hour-preview">
                                Hora seleccionada: {formatHourPreview(formData.dueTime)}
                            </p>
                        )}

                        {/* Tags dinámicos (máx 5) */}
                        <div className="todo-tags-header">
                            <label>Etiquetas (máx. 5)</label>
                            <div className="todo-tags-controls">
                                {visibleTags > 1 && (
                                    <button
                                        type="button"
                                        className="todo-tag-control-btn"
                                        onClick={removeTagField}
                                        aria-label="Quitar etiqueta"
                                    >
                                        −
                                    </button>
                                )}
                                {visibleTags < 5 && (
                                    <button
                                        type="button"
                                        className="todo-tag-control-btn"
                                        onClick={addTagField}
                                        aria-label="Agregar etiqueta"
                                    >
                                        +
                                    </button>
                                )}
                            </div>
                        </div>

                        {renderTagFields()}

                        {/* Preview de tags */}
                        {getEnteredTags().length > 0 && (
                            <div className="todo-tags-preview">
                                {getEnteredTags().map((tag, i) => (
                                    <span key={i} className="todo-tag-chip">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Acciones */}
                        <div className="todo-modal-actions">
                            <button
                                className="todo-cancel-btn"
                                onClick={() => closeModal({ clearForm: true })}
                                type="button"
                            >
                                Cancelar
                            </button>
                            <button
                                className="todo-save-btn"
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

export default AddToDoButton;