import { useState, useEffect } from 'react'
import '../../styles/addToDoButton.css' // Reutiliza los mismos estilos del modal de agregar
import { updateReminderFields } from '../../services/ToDoListTagFetcher'

/*
    Modal de edición de recordatorio
    Props:
    - isOpen: boolean
    - task: objeto con los datos actuales de la tarea
    - userId: number
    - userTags: [{ id, nombre }] — para sugerencias de autocompletado
    - onClose: () => void
    - onSave: (updatedTask) => void — callback cuando se guarda exitosamente
 */

const PRIORITY_OPTIONS = [
    { value: "alta", label: "Alta" },
    { value: "media", label: "Media" },
    { value: "baja", label: "Baja" },
];

function EditTodoModal({ isOpen, task, userId, userTags = [], onClose, onSave }) {
    // Estado del formulario, inicializado con los datos de la tarea 
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        dueDate: "",
        dueTime: "",
        priority: "media",
        tag1: "",
        tag2: "",
        tag3: "",
        tag4: "",
        tag5: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [visibleTags, setVisibleTags] = useState(1);

    // Estado para sugerencias de tags
    const [activeSuggestionField, setActiveSuggestionField] = useState(null); // "tag1", "tag2", etc.
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);

    // Cargue de datos de la tarea al abrir el modal
    useEffect(() => {
        if (isOpen && task) {
            // Extraer las etiquetas existentes de la tarea
            const existingTags = task.tags || [];
            // Contar cuántas etiquetas tiene para mostrar los campos correctos
            const tagCount = Math.max(existingTags.length, 1);

            setFormData({
                title: task.title || "",
                description: task.description || "",
                dueDate: task.dueDate || "",
                dueTime: task.dueTime || "",
                priority: task.priority || "media",
                tag1: existingTags[0]?.label || "",
                tag2: existingTags[1]?.label || "",
                tag3: existingTags[2]?.label || "",
                tag4: existingTags[3]?.label || "",
                tag5: existingTags[4]?.label || "",
            });

            setVisibleTags(Math.min(tagCount, 5)); // Mostrar los campos de tags necesarios
            setError("");
        }
    }, [isOpen, task]);

    // ESC para cerrar el modal
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

    //Manejar cambios en los inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (error) setError("");

        // Si el campo es un tag, mostrar sugerencias
        if (name.startsWith("tag")) {
            setActiveSuggestionField(name);
            // Filtrar sugerencias que coincidan con lo escrito
            if (value.trim()) {
                const filtered = userTags.filter((t) =>
                    t.nombre.toLowerCase().includes(value.toLowerCase())
                );
                setFilteredSuggestions(filtered);
            } else {
                setFilteredSuggestions([]); // No mostrar sugerencias si el campo está vacío
            }
        }
    };

    // Seleccionar una sugerencia de tag
    const selectSuggestion = (tagName) => {
        if (activeSuggestionField) {
            setFormData((prev) => ({
                ...prev,
                [activeSuggestionField]: tagName,
            }));
        }
        setActiveSuggestionField(null);
        setFilteredSuggestions([]);
    };

    // Cerrar sugerencias al hacer clic fuera
    const closeSuggestions = () => {
        // Pequeño delay para permitir el clic en la sugerencia
        setTimeout(() => {
            setActiveSuggestionField(null);
            setFilteredSuggestions([]);
        }, 200);
    };

    // Validar formulario
    const validateForm = () => {
        if (!formData.title.trim()) return "El título es obligatorio.";
        if (!formData.dueDate) return "Debes seleccionar una fecha límite.";
        if (!formData.dueTime) return "Debes seleccionar una hora límite.";
        return "";
    };

    // Formatear hora para preview
    const formatHourPreview = (timeStr) => {
        if (!timeStr) return "";
        const [hourStr, minute] = timeStr.split(":");
        let hour = parseInt(hourStr, 10);
        const suffix = hour >= 12 ? "p.m." : "a.m.";
        if (hour === 0) hour = 12;
        else if (hour > 12) hour -= 12;
        return `${hour.toString().padStart(2, "0")}:${minute} ${suffix}`;
    };

    // Guardar edicion (comparando solo los campos que cambiaron)
    const handleSave = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            // Recopilar tags actuales
            const tagsArray = [
                formData.tag1,
                formData.tag2,
                formData.tag3,
                formData.tag4,
                formData.tag5,
            ].map((t) => t.trim()).filter(Boolean);

            // Datos nuevos para comparar con los originales
            const newData = {
                title: formData.title,
                description: formData.description,
                dueDate: formData.dueDate,
                dueTime: formData.dueTime,
                priority: formData.priority,
                tags: tagsArray,
            };

            // Llamar a la función que compara y actualiza solo lo que cambió
            await updateReminderFields(task.id, task, newData);

            // Construir el objeto actualizado 
            const updatedTask = {
                ...task, // Mantener los campos que no cambiaron 
                title: formData.title,
                description: formData.description,
                dueDate: formData.dueDate,
                dueTime: formData.dueTime,
                priority: formData.priority,
                tags: tagsArray.map((label, i) => ({
                    id: task.tags?.[i]?.id || `tag-edit-${i}`, // Reutilizar ID si existe
                    label: label,
                })),
            };

            // Notificar al padre con la tarea actualizada
            if (onSave) onSave(updatedTask);

            console.log("Recordatorio actualizado exitosamente");
        } catch (err) {
            console.error("Error al actualizar recordatorio:", err);
            setError(`No se pudo actualizar. ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Agregar / quitar campos de tags
    const addTagField = () => {
        if (visibleTags < 5) setVisibleTags((prev) => prev + 1);
    };

    const removeTagField = () => {
        if (visibleTags > 1) {
            setFormData((prev) => ({ ...prev, [`tag${visibleTags}`]: "" }));
            setVisibleTags((prev) => prev - 1);
        }
    };

    // Renderizar campos de tags con sugerencias
    const renderTagFields = () => {
        const fields = [];
        for (let i = 1; i <= visibleTags; i++) {
            const fieldName = `tag${i}`;
            fields.push(
                <div key={fieldName} className="todo-tag-input-wrapper">
                    <input
                        type="text"
                        name={fieldName}
                        placeholder={`Etiqueta ${i}`}
                        value={formData[fieldName]}
                        onChange={handleChange}
                        onFocus={() => {
                            // Mostrar sugerencias al enfocar si hay texto
                            setActiveSuggestionField(fieldName);
                            if (formData[fieldName].trim()) {
                                const filtered = userTags.filter((t) =>
                                    t.nombre.toLowerCase().includes(formData[fieldName].toLowerCase())
                                );
                                setFilteredSuggestions(filtered);
                            }
                        }}
                        onBlur={closeSuggestions}
                        autoComplete="off"
                    />
                    {/* Dropdown de sugerencias (solo para el campo activo) */}
                    {activeSuggestionField === fieldName && filteredSuggestions.length > 0 && (
                        <div className="todo-tag-suggestions">
                            {filteredSuggestions.map((tag) => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    className="todo-tag-suggestion-item"
                                    onMouseDown={() => selectSuggestion(tag.nombre)}
                                >
                                    {tag.nombre}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            );
        }
        return fields;
    };

    //Preview de tags ingresados
    const getEnteredTags = () => {
        return [formData.tag1, formData.tag2, formData.tag3, formData.tag4, formData.tag5]
            .map((t) => t.trim())
            .filter(Boolean);
    };

    return (
        <div className="todo-modal-overlay" onClick={onClose}>
            <div className="todo-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Título del modal (indica que es edición) */}
                <h2>Editar Recordatorio</h2>

                <button
                    className="todo-modal-close"
                    onClick={onClose}
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
                    placeholder="Título del recordatorio"
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
                <label>Fecha límite</label>
                <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                />

                {/* Hora límite */}
                <label>Hora límite</label>
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

                {/* Tags dinámicos con sugerencias */}
                <div className="todo-tags-header">
                    <label>Etiquetas (máx. 5)</label>
                    <div className="todo-tags-controls">
                        {visibleTags > 1 && (
                            <button type="button" className="todo-tag-control-btn" onClick={removeTagField}>−</button>
                        )}
                        {visibleTags < 5 && (
                            <button type="button" className="todo-tag-control-btn" onClick={addTagField}>+</button>
                        )}
                    </div>
                </div>

                {renderTagFields()}

                {/* Preview de tags */}
                {getEnteredTags().length > 0 && (
                    <div className="todo-tags-preview">
                        {getEnteredTags().map((tag, i) => (
                            <span key={i} className="todo-tag-chip">{tag}</span>
                        ))}
                    </div>
                )}

                {/* Acciones */}
                <div className="todo-modal-actions">
                    <button className="todo-cancel-btn" onClick={onClose} type="button">
                        Cancelar
                    </button>
                    <button
                        className="todo-save-btn"
                        onClick={handleSave}
                        type="button"
                        disabled={loading}
                    >
                        {loading ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditTodoModal;