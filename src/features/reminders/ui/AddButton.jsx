import { useState } from "react";
import { useEffect } from "react";
import "./addButton.css";
import { saveToDo } from "../../../shared/storage/todoStorage"; // respaldo local
import ReminderService from "../api/reminderService";
import { addNotification } from "../../../shared/api/notificationService";
import { getUserData } from "../../../shared/api/userService";
import TaskAddModal from "./TaskAddModal";
import { isReminderDateInPast } from "../../../shared/lib/reminderDateValidation";

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

        // Convertir dueDate ("YYYY-MM-DD HH:MM:SS") a Date
        // TaskAddModal asegura que siempre haya hora (00:00:00 por defecto si no la especifica)
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
                const userData = await getUserData(userId);
                const rawUser = Array.isArray(userData) ? userData[0] : userData;
                const idUsuario =
                    rawUser?.id ??
                    Number(userId);

                // El backend devuelve { message, toDoId, reminderId }.
                const result = await ReminderService.addReminder(
                    idUsuario,
                    name,
                    description,
                    endDay,
                    priority,
                    tagLabels,
                );

                const idToDoList = result?.toDoId ?? result?.reminderId ?? null;
                if (idToDoList) {
                    try {
                        await addNotification({
                            idToDoList,
                            userId: Number(idUsuario),
                            nombre: name,
                            descripcion: description,
                            fechaEmision: new Date().toISOString(),
                        });
                    } catch {
                        // La notificación es secundaria: no bloquea el guardado.
                    }
                }
            } else {
                // Sin sesión no hay API: se conserva el respaldo local.
                saveToDo({ title: name, description, endDay: endDay.toISOString().split("T")[0], priority, tag: tagLabels });
            }
        } catch (err) {
            console.error("Error al guardar el recordatorio:", err);
            // Se propaga para que el modal muestre el error y no cierre.
            throw err;
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