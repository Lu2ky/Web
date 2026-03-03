import { useState, useEffect } from "react"; // Manejar estados y efectos secundarios
<<<<<<< Updated upstream
import "../../styles/addButton.css"; 
import { saveToDo } from "../../services/todoService"; // Función para guardar actividad (fallback local)
import ReminderService from "../../services/reminderService";
import Calendar from "react-calendar"; // npm install react-calendar para instalar
import "react-calendar/dist/Calendar.css"; // Estilos para el calendario
=======
import "../../styles/addButton.css";
import { saveToDo } from "../../services/todoService"; // Función para guardar actividad (fallback local)
import ReminderService from "../../services/reminderService";
import TaskAddModal from "./TaskAddModal";
>>>>>>> Stashed changes


const TAGS_STORAGE_KEY = "savedTags"; // Clave para guardar y recuperar etiquetas en localStorage

const getSavedTags = () => { // Función para obtener las etiquetas guardadas en localStorage
    try {
        return JSON.parse(localStorage.getItem(TAGS_STORAGE_KEY)) || []; // Si no hay etiquetas guardadas, devuelve un array vacío
    } catch {
        return [];
    }
};

function AddButton({ onToDoSaved, userId, availableTags = [] }) {

<<<<<<< Updated upstream
function AddButton({ onToDoSaved, userId }) {
=======
>>>>>>> Stashed changes
    const [isOpen, setIsOpen] = useState(false); // Controla si esta abierto el modal
    const [savedTags, setSavedTags] = useState(getSavedTags()); // Etiquetas disponibles para seleccionar

    useEffect(() => { // Cargar etiquetas guardadas al montar el componente
        setSavedTags(getSavedTags());
    }, []);



    // Mapea y guarda la tarea creada desde el modal de añadir
    const handleAddModalSave = async (modalForm) => {
        const nombre = modalForm.name || "";
        const descripcion = modalForm.description || "";
        const fechaRaw = modalForm.dueDate || "";
        const prioridad = modalForm.priority || "";
        const tags = Array.isArray(modalForm.tags) ? modalForm.tags.map(t => t.label || String(t)) : [];

<<<<<<< Updated upstream
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
=======
        console.log("[AddButton] Enviando recordatorio:", {
            P_usuario: userId,
            P_nombre: nombre,
            P_descripcion: descripcion,
            P_fecha: fechaRaw,
            P_prioridad: prioridad,
            tags,
        });
>>>>>>> Stashed changes

        try {
            const result = await ReminderService.addReminder({
                P_usuario: userId ?? "",
                P_nombre: nombre,
                P_descripcion: descripcion,
                P_fecha: fechaRaw,
                P_prioridad: prioridad,
                tags,
            });
            console.log("[AddButton] Recordatorio agregado exitosamente:", result);
        } catch (error) {
            console.error("[AddButton] Error al agregar recordatorio en backend, guardando localmente:", error);
            // Fallback: guardar en localStorage si el backend falla
            const endDay = (fechaRaw && String(fechaRaw).slice(0, 10)) || new Date().toISOString().slice(0, 10);
            saveToDo({ title: nombre, description: descripcion, endDay, priority: prioridad, tag: tags });
        }

        if (onToDoSaved) onToDoSaved();
        setIsOpen(false);
    };

    // Cerrar modal con tecla Esc
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") setIsOpen(false);
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
                <TaskAddModal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    onSave={handleAddModalSave}
                    availableTags={
                        availableTags.length > 0
                            ? availableTags
                            : savedTags.map(s => ({ label: s, type: 'custom' }))
                    }
                />
            )}
        </>
    );
}

export default AddButton;