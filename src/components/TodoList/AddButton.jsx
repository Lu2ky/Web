import { useState, useEffect } from "react"; // Manejar estados y efectos secundarios
import "../../styles/addButton.css"; 
import { saveToDo } from "../../services/todoService"; // Función para guardar actividad
import Calendar from "react-calendar"; // npm install react-calendar para instalar
import "react-calendar/dist/Calendar.css"; // Estilos para el calendario


function AddButton({ onToDoSaved }) {
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

    // Para mostrar la fecha en formato dd/mm/aaaa y mostrarla en el input
    const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, "0"); // para que sea 02 y no solo 2 
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Para convertir el texto dd/mm/aaaa a un objeto Date
    const parseDate = (dataString) => {
        const date = dataString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (!date) return null;
        const day = Number(date[1]);
        const month = Number(date[2] - 1); // los meses en javascript van de 0 a 11
        const year = Number(date[3]);
        const reviewDate = new Date(year, month, day);

        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month ||
            date.getDate() !== day
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

    //Guardar actividad en localStorage y cerrar el modal
    const handleSave = () => {
        const validationError = validateForm(); // validar datos del formulario
        if (validationError) { // si hay error, mostrar mensaje y no guardar 
            setError(validationError);
            return;
        }

        // Guardar en localStorage
        saveToDo({
            ...formData,
            endDay: formData.endDay.toISOString().split("T")[0] // Guardar solo la fecha en formato YYYY-MM-DD
        });

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
            <button className="addButton" onClick={() => setIsOpen(true)}>
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

                        <button className="modalClose"
                            onClick={() => {
                                setShowCalendar(false);
                                setIsOpen(false);
                            }}>
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
                                aria-label="Abrir Calendario"
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

                        <div className="modalActions">
                            <button
                                className="cancelButton"
                                onClick={() =>{
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