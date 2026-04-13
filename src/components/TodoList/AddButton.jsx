import { useState } from "react";
import { useEffect } from "react";
import "../../styles/addButton.css";
import { saveToDo } from "../../services/todoService"; // respaldo local
import ReminderService from "../../services/reminderService";
import { addNotification } from "../../services/notificationService";
import { getUserData } from "../../services/userService";
import TaskAddModal from "./TaskAddModal";
import { isReminderDateInPast } from "./reminderDateValidation";

function AddButton({ onToDoSaved, userId, availableTags = [] }) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleCloseUnrelatedUi = (event) => {
            const allowOpenUi = Array.isArray(event?.detail?.allowOpenUi) ? event.detail.allowOpenUi : [];
            if (!allowOpenUi.includes("modal-todo-add")) {
                setIsOpen(false);
            }
        };

        window.addEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
        return () => window.removeEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
    }, []);

    const handleAddSave = async (data) => {
        // Validación: Si no hay dueDate o es inválida, no guardar
        const { dueDate } = data || {};
        if (isReminderDateInPast(dueDate)) {
            // NO hacer nada - el error ya se mostró en TaskAddModal
            // NO cerrar el modal
            return;
        }

        // data: { name, description, dueDate, tags, priority }
        const { name, description, tags = [], priority = "" } = data || {};

        // Convertir dueDate ("YYYY-MM-DD" o "YYYY-MM-DD HH:MM:SS") a Date
        let endDay = null;
        try {
            endDay = dueDate ? new Date(String(dueDate).replace(" ", "T")) : new Date();
            if (Number.isNaN(endDay.getTime())) endDay = new Date();
        } catch (e) {
            endDay = new Date();
        }

        // Procesar tags: convertir array de objetos a array de strings (labels)
        // Si 'tags' es undefined/null, usar array vacío
        const safeTagsArray = Array.isArray(tags) ? tags : [];
        const tagLabels = safeTagsArray
            .map(t => {
                if (typeof t === 'string') return t;
                if (t && typeof t === 'object' && t.label) return String(t.label).trim();
                return "";
            })
            .filter(label => label.length > 0);

        try {
            if (userId) {
                // Obtener el ID interno del usuario desde la API antes de agregar el recordatorio
                const userData = await getUserData(userId);
                const rawUser = Array.isArray(userData) ? userData[0] : userData;
                const idUsuario =
                    rawUser?.N_idUsuario ??
                    rawUser?.idUsuario ??
                    rawUser?.id_user ??
                    rawUser?.ID_USER ??
                    rawUser?.id ??
                    userId;

                // ESPERAR a que addReminder se complete antes de continuar
                const result = await ReminderService.addReminder(idUsuario, name, description, endDay, priority, tagLabels, userId);
                
                const newId = result?.data?.InsertedId;
                if (newId) {
                    try {
                        await addNotification({
                            todoId: newId,
                            name,
                            description,
                            issueDate: new Date().toISOString(),
                        });
                    } catch (notifErr) {
                        // Error al agregar notificación
                    }
                }
            } else {
                // Sin userId, guardar en localStorage
                saveToDo({ title: name, description, endDay: endDay.toISOString().split("T")[0], priority, tag: tagLabels });
            }
        } catch (err) {
            // Error al agregar recordatorio
            // Fallback a localStorage en caso de error
            saveToDo({ title: name, description, endDay: endDay.toISOString().split("T")[0], priority, tag: tagLabels });
        }
        
        // Cierre exitoso: recargar tareas y cerrar modal
        setIsOpen(false);
        if (onToDoSaved) {
            setTimeout(() => {
                onToDoSaved();
            }, 500);
        }
    };

    return (
        <>
            <button
                className="addButton"
                onClick={() => {
                    setIsOpen(true);
                    window.dispatchEvent(new CustomEvent("onboarding:todo-add-opened"));
                }}
                title="Agregar tarea"
                aria-label="Agregar tarea"
                type="button"
                data-onboarding-id="todo-add-button"
            />

            <TaskAddModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onSave={handleAddSave}
                userId={userId}
                availableTags={availableTags}
                onboardingId="todo-add-modal"
                onboardingNameTypedEvent="onboarding:todo-add-title-typed"
            />
        </>
    );
}

export default AddButton;