import { useState, useEffect } from "react"; // Manejar estados y efectos secundarios
import "../../styles/addButton.css"; 
import { saveToDo } from "../../services/todoService"; // Función para guardar actividad (fallback local)
import ReminderService from "../../services/reminderService";
import Calendar from "react-calendar"; // npm install react-calendar para instalar
import "react-calendar/dist/Calendar.css"; // Estilos para el calendario


const TAGS_STORAGE_KEY = "savedTags"; // Clave para guardar y recuperar etiquetas en localStorage

const getSavedTags = () => { // Función para obtener las etiquetas guardadas en localStorage
    try {
        return JSON.parse(localStorage.getItem(TAGS_STORAGE_KEY)) || []; // Si no hay etiquetas guardadas, devuelve un array vacío
    } catch {
        return [];
    }
};

const persistTags = (tags) => { // Función para guardar las etiquetas en localStorage
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags)); // Guarda el array de etiquetas como una cadena JSON en localStorage
};

function AddButton({ onToDoSaved, userId }) {
    const [isOpen, setIsOpen] = useState(false); // Controla si esta abierto el modal
    const [showCalendar, setShowCalendar] = useState(false); // Controla si se muestra el calendario para seleccionar fecha

    const [formData, setFormData] = useState({ // Datos del formulario para nueva tarea 
        title: "",
        description: "",
        endDay: new Date(),
        priority: "",
        tag: []
    });

    const [dateText, setDateText] = useState(""); // texto dd/mm/aaaa
    const [error, setError] = useState(""); // guarda mensajes de validación 

    // Etiquetas 
    const [tagInput, setTagInput] = useState(""); // Usuario las escribe
    const [savedTags, setSavedTags] = useState(getSavedTags()); // Etiquetas disponibles para seleccionar
    const [showSuggestions, setShowSuggestions] = useState(false); // Controla si se muestran las sugerencias de etiquetas

    useEffect(() => { // Cargar etiquetas guardadas al montar el componente
        setSavedTags(getSavedTags());
    }, []);


    const filteredSuggestions = savedTags.filter( // Filtrar sugerencias mientras escribe
        (type) =>
            type.toLowerCase().includes(tagInput.toLowerCase()) &&
            !formData.tag.includes(type) // no sugerir las que ya están seleccionadas
    );

    // Agregar etiqueta (Enter o clic en sugerencia)
    const addTag = (tagName) => {
        const cleaned = tagName.trim();
        if (!cleaned) return;
        if (formData.tag.includes(cleaned)) return; // ya existe

        // Agregar al formulario
        setFormData((prev) => ({
            ...prev,
            tag: [...prev.tag, cleaned]
        }));

        // Guardar en localStorage si es nueva
        if (!savedTags.includes(cleaned)) {
            const updated = [...savedTags, cleaned];
            setSavedTags(updated);
            persistTags(updated);
        }

        setTagInput("");
        setShowSuggestions(false);
    };

    // Quitar etiqueta del formulario
    const removeTag = (tagName) => {
        setFormData((prev) => ({
            ...prev,
            tag: prev.tag.filter((t) => t !== tagName)
        }));
    };
    // Para mostrar la fecha en formato dd/mm/aaaa y mostrarla en el input
    const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, "0"); // para que sea 02 y no solo 2 
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Para convertir el texto dd/mm/aaaa a un objeto Date
    const parseDate = (dataString) => {
        const date = dataString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!date) return null;
        const day = Number(date[1]);
        const month = Number(date[2]) - 1; // los meses en javascript van de 0 a 11
        const year = Number(date[3]);
        const reviewDate = new Date(year, month, day);

        if (
            reviewDate.getFullYear() !== year ||
            reviewDate.getMonth() !== month ||
            reviewDate.getDate() !== day
        ) {
            return null; // fecha no válida
        }
        return reviewDate;
    };

    // Mantener la fecha sincronizada entre el calendario y el input de texto
    useEffect(() => {
        setDateText(formatDate(formData.endDay));
    }, [formData.endDay]);


    // Maneja cambios en los campos del formulario
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev, [name]: value
        }));
    };

    // Validación del formulario antes de guardar 
    const validateForm = () => {
        if (!formData.title.trim()) {
            return "El título es obligatorio";
        }
        if (!formData.endDay) {
            return "Debes seleccionar una fecha límite";
        }
        return "";
    };

    //Guardar actividad en localStorage o API y cerrar el modal
    const handleSave = async () => {
        const validationError = validateForm(); // validar datos del formulario
        if (validationError) { // si hay error, mostrar mensaje y no guardar 
            setError(validationError);
            return;
        }

        // if we have a userId, send to backend; otherwise fallback to localStorage
        if (userId) {
            try {
                await ReminderService.addReminder(
                    userId,
                    formData.title,
                    formData.description,
                    formData.endDay,
                    formData.priority,
                    formData.tag
                );
            } catch (err) {
                console.error("Error al agregar recordatorio en servidor:", err);
                // still continue to add locally so UI isn't blocked
                saveToDo({
                    ...formData,
                    endDay: formData.endDay.toISOString().split("T")[0]
                });
            }
        } else {
            saveToDo({
                ...formData,
                endDay: formData.endDay.toISOString().split("T")[0]
            });
        }

        setIsOpen(false);
        setFormData({
            title: "",
            description: "",
            endDay: new Date(),
            priority: "",
            tag: []
        });
        setError("");

        // Notificar al padre que se guardó una actividad
        if (onToDoSaved) {
            onToDoSaved();
        }
    };

    // Cerrar modal con tecla Esc
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") { // Si se presiona la tecla Esc, cerrar el modal
                setIsOpen(false);
                setShowCalendar(false); // Cerrar el calendario si está abierto
            }
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, []);

    return (
        <>
            <button
                className="addButton"
                onClick={() => setIsOpen(true)}
                title="Agregar tarea"
                aria-label="Agregar tarea"
                type="button"
            >
            </button>
            {isOpen && (
                <div
                    className="modalOverlay"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => {
                        setShowCalendar(false);
                        setIsOpen(false)
                    }}
                >
                    <div className="modalContainer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>Recordatorio</h2>

                        <button
                            className="modalClose"
                            onClick={() => {
                                setShowCalendar(false);
                                setIsOpen(false);
                            }}
                            title="Cerrar"
                            aria-label="Cerrar"
                            type="button"
                        >
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
                        <h4>Fecha límite</h4>

                        <div className="dateInputContainer">
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="dd/mm/aaaa"
                                value={dateText}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setDateText(v);
                                    const parsed = parseDDMMYYYY(v);
                                    if (parsed) {
                                        setFormData((prev) => ({ ...prev, endDay: parsed }));
                                    }
                                }}
                                onBlur={() => {
                                    // al salir del campo, si es inválida, vuelve a la última fecha válida
                                    const parsed = parseDDMMYYYY(dateText);
                                    if (!parsed) setDateText(formatDDMMYYYY(formData.endDay));
                                }}
                            />
                            <button
                                type="button"
                                className="calendarToggle"
                                   data-tooltip="Abrir calendario"
                                   aria-label="Abrir Calendario"
                                   title="Abrir Calendario"
                                onClick={() => setShowCalendar(!showCalendar)}
                            >
                                📅
                            </button>
                        </div>
                        {showCalendar && (
                            <div className="calendarWrapper">
                                <Calendar
                                    onChange={(date) => {
                                        setFormData((prev) => ({ ...prev, endDay: date }));
                                        setShowCalendar(false);
                                    }}
                                    value={formData.endDay}
                                    locale="es-ES"
                                />
                            </div>
                        )}
                        {/* ── Prioridad ── */}
                        <h4>Prioridad</h4>
                        <div className="priorityGroup">
                            {["alta", "media", "baja"].map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    className={`priorityButton priority-${level} ${formData.priority === level ? "priorityActive" : ""
                                        }`}
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            priority: prev.priority === level ? "" : level
                                        }))
                                    }
                                >
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </button>
                            ))}
                        </div>

                        <h4>Etiquetas</h4>
                        <div className="tagsSection" onClick={(e) => e.stopPropagation()}>
                            {/* Chips de etiquetas seleccionadas */}
                            {formData.tag.length > 0 && (
                                <div className="tagChips">
                                    {formData.tag.map((t) => (
                                        <span key={t} className="tagChip">
                                            {t}
                                            <button
                                                type="button"
                                                className="tagChipRemove"
                                                onClick={() => removeTag(t)}
                                                aria-label={`Quitar ${t}`}
                                                title={`Quitar ${t}`}
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Input + sugerencias */}
                            <div className="tagInputWrapper">
                                <input
                                    type="text"
                                    placeholder="Escribe una etiqueta..."
                                    value={tagInput}
                                    onChange={(e) => {
                                        setTagInput(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addTag(tagInput);
                                        }
                                    }}
                                />

                                {showSuggestions && tagInput && filteredSuggestions.length > 0 && (
                                    <ul className="tagSuggestions">
                                        {filteredSuggestions.map((s) => (
                                            <li
                                                key={s}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    addTag(s);
                                                }}
                                            >
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="modalActions">
                            <button
                                className="cancelButton"
                                onClick={() => {
                                    setShowCalendar(false);
                                    setIsOpen(false);
                                }}
                            >
                                Cancelar
                            </button>

                            <button className="saveButton"
                                onClick={handleSave}
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

export default AddButton;