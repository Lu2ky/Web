import { useState } from "react";
import "../../styles/addButton.css";
import { saveToDo } from "../../services/todoService"; // fallback local
import ReminderService from "../../services/reminderService";
import { getUserData } from "../../services/userService";
import TaskAddModal from "./TaskAddModal";

function AddButton({ onToDoSaved, userId, availableTags = [] }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleAddSave = async (data) => {
        console.log('[AddButton] handleAddSave received data:', JSON.stringify(data, null, 2));
        // data: { name, description, dueDate, tags, priority }
        const { name, description, dueDate, tags = [], priority = "" } = data || {};

        // Convert dueDate ("YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS") to Date
        let endDay = null;
        try {
            endDay = dueDate ? new Date(String(dueDate).replace(" ", "T")) : new Date();
            if (Number.isNaN(endDay.getTime())) endDay = new Date();
        } catch (e) {
            endDay = new Date();
        }

        const tagLabels = tags.map(t => (typeof t === 'string' ? t : t.label || "" )).filter(Boolean);
        console.log('[AddButton] tagLabels to send:', tagLabels, 'userId:', userId);

        if (userId) {
            try {
                // Obtain the internal user ID from the API before adding the reminder
                const userData = await getUserData(userId);
                const rawUser = Array.isArray(userData) ? userData[0] : userData;
                const idUsuario =
                    rawUser?.N_idUsuario ??
                    rawUser?.idUsuario ??
                    rawUser?.id_user ??
                    rawUser?.ID_USER ??
                    rawUser?.id ??
                    userId;
                console.log('[AddButton] idUsuario resolved:', idUsuario);

                await ReminderService.addReminder(idUsuario, name, description, endDay, priority, tagLabels, userId);
            } catch (err) {
                console.error("Error al agregar recordatorio en servidor:", err);
                saveToDo({ title: name, description, endDay: endDay.toISOString().split("T")[0], priority, tag: tagLabels });
            }
        } else {
            saveToDo({ title: name, description, endDay: endDay.toISOString().split("T")[0], priority, tag: tagLabels });
        }

        setIsOpen(false);
        if (onToDoSaved) onToDoSaved();
    };

    return (
        <>
            <button
                className="addButton"
                onClick={() => setIsOpen(true)}
                title="Agregar tarea"
                aria-label="Agregar tarea"
                type="button"
            />

            <TaskAddModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onSave={handleAddSave}
                userId={userId}
                availableTags={availableTags}
            />
        </>
    );
}

export default AddButton;