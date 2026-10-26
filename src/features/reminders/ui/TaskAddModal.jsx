import { useState, useEffect, useRef, useCallback } from 'react';
import '../../../shared/styles/modalForm.css';
import { deleteTag, getTagsByUser } from '../api/tagsService';
import { isReminderDateInPast, PAST_REMINDER_DATE_MESSAGE } from "../../../shared/lib/reminderDateValidation";
import Modal from '../../../shared/ui/Modal';
import TaskFormContent from './TaskFormContent';
import {
    buildDueDate,
    formatDate,
    getTimePart,
    parseDDMMYYYY,
    stringToDate
} from '../lib/taskDateUtils';

export default function TaskAddModal({
    isOpen,
    onClose,
    onSave,
    title = "Nueva Tarea",
    userId,
    availableTags = [],
    task = null,
    onboardingId,
    onboardingNameTypedEvent
}) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        dueDate: '',
        tags: [],
        priority: ''
    });

    const [tagLabel, setTagLabel] = useState('');
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const tagInputRef = useRef(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [dateText, setDateText] = useState('');
    const [timeText, setTimeText] = useState('');
    const [error, setError] = useState('');
    const [fetchedTags, setFetchedTags] = useState([]);

    useEffect(() => {
        if (formData.dueDate) {
            setDateText(formatDate(stringToDate(formData.dueDate)));
            setTimeText(getTimePart(formData.dueDate));
        } else {
            setDateText('');
            setTimeText('');
        }
    }, [formData.dueDate]);

    // useEffect modificado para precargar datos cuando es duplicado
    useEffect(() => {
        if (isOpen) {
            setError('');
            if (onboardingId === "todo-duplicate-modal") {
                window.dispatchEvent(new CustomEvent("onboarding:todo-card-duplicate-clicked"));
            }
            setTagLabel('');
            
            // Verificar si hay una tarea para duplicar
            if (task) {
                // Precargar los datos de la tarea a duplicar
                setFormData({
                    name: task.name || '',
                    description: task.description || '',
                    dueDate: task.dueDate || '',
                    tags: Array.isArray(task.tags) ? task.tags : [],
                    priority: task.priority || ''
                });
                // Establecer fechas y horas desde la tarea duplicada
                setDateText(formatDate(stringToDate(task.dueDate)));
                setTimeText(getTimePart(task.dueDate));
            } else {
                // Si no hay tarea, inicializar con valores vacíos (nuevo recordatorio)
                setFormData({
                    name: '',
                    description: '',
                    dueDate: '',
                    tags: [],
                    priority: ''
                });
                setDateText('');
                setTimeText('');
            }
            
            if (userId) {
                getTagsByUser(userId).then(setFetchedTags).catch(() => setFetchedTags([]));
            }
        }
    }, [isOpen, userId, task]); // Agregar 'task' a las dependencias

    const handleSave = async () => {
        // LIMPIAR ERROR PREVIO
        setError('');
        
        if (!formData.name.trim()) {
            setError('El nombre es obligatorio');
            return;
        }

        // Validación OBLIGATORIA de fecha
        if (!formData.dueDate || !formData.dueDate.trim()) {
            setError('La fecha es obligatoria. Selecciona una fecha y hora.');
            return;
        }

        // Si la fecha no tiene hora, agregar hora default 00:00:00
        let finalDueDate = formData.dueDate;
        const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(finalDueDate);
        if (dateOnly) {
            finalDueDate = finalDueDate + " 00:00:00";
        }

        if (isReminderDateInPast(finalDueDate)) {
            setError(PAST_REMINDER_DATE_MESSAGE);
            return;
        }

        // Incluir automáticamente cualquier etiqueta pendiente que quede en el input
        let finalTags = formData.tags;
        const pending = tagLabel.trim();
        if (pending && !finalTags.some(t => t.label === pending)) {
            finalTags = [...finalTags, { label: pending, type: 'custom' }];
        }

        const dataToSend = { ...formData, dueDate: finalDueDate, tags: finalTags };
        try {
            await onSave(dataToSend);
            
            // Disparar evento de onboarding después de guardar
            if (onboardingId === "todo-duplicate-modal") {
                window.dispatchEvent(new CustomEvent("onboarding:todo-duplicate-saved"));
            } else {
                window.dispatchEvent(new CustomEvent("onboarding:todo-add-saved"));
            }
            
            setTagLabel('');
            setError('');
        } catch {
            setError('No se pudo guardar el recordatorio. Intenta nuevamente.');
        }
    };

    const handleAddTag = () => {
        const label = tagLabel.trim();
        if (!label) return;
        
        // Validar límite de 5 etiquetas
        if (formData.tags.length >= 5) {
            setError('No puedes agregar más de 5 etiquetas');
            return;
        }
        
        const exists = formData.tags.some(t => t.label === label);
        if (!exists) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, { label, type: 'custom' }]
            }));
            setError(''); // Limpiar error si se agrega exitosamente
        }
        setTagLabel('');
    };

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag.label !== tagToRemove.label)
        }));
    };

    const handleDeleteTag = async (tagToDelete) => {
        handleRemoveTag(tagToDelete);

        if (!tagToDelete?.id || !userId) {
            return;
        }

        try {
            await deleteTag(tagToDelete.id, userId);
            setFetchedTags((prev) => prev.filter((tag) => String(tag.id) !== String(tagToDelete.id)));
            setError('');
        } catch (deleteError) {
            console.error('Error eliminando etiqueta:', deleteError);
            setError('No se pudo eliminar la etiqueta del sistema. Se quitó solo del recordatorio.');
        }
    };

    const handleDateFromCalendar = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const selectedDate = `${year}-${month}-${day}`;
        const nextDueDate = buildDueDate(selectedDate, timeText);
        setFormData(prev => ({ ...prev, dueDate: nextDueDate }));
        if (!isReminderDateInPast(nextDueDate)) {
            setError('');
        }
        setShowCalendar(false);
    };

    const handleModalClose = useCallback(() => {
        setShowCalendar(false);
        onClose();
    }, [onClose]);

    const tagsSource = fetchedTags.length > 0 ? fetchedTags : availableTags;
    const filteredTags = tagsSource.filter(t =>
        t.label.toLowerCase().includes(tagLabel.toLowerCase())
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleModalClose}
            title={title}
            onConfirm={handleSave}
            confirmLabel="Guardar"
            closeLabel="Cancelar"
            closeOnOverlayClick={false}
            closeOnEscape={true}
            showFooter={true}
            bodyClassName="modalForm"
        >
            <TaskFormContent
                formData={formData}
                setFormData={setFormData}
                tagLabel={tagLabel}
                setTagLabel={setTagLabel}
                showTagDropdown={showTagDropdown}
                setShowTagDropdown={setShowTagDropdown}
                showCalendar={showCalendar}
                setShowCalendar={setShowCalendar}
                dateText={dateText}
                setDateText={setDateText}
                timeText={timeText}
                setTimeText={setTimeText}
                error={error}
                setError={setError}
                fetchedTags={fetchedTags}
                availableTags={availableTags}
                onboardingNameTypedEvent={onboardingNameTypedEvent}
                handleAddTag={handleAddTag}
                handleDeleteTag={handleDeleteTag}
                handleDateFromCalendar={handleDateFromCalendar}
                formatDate={formatDate}
                stringToDate={stringToDate}
                parseDDMMYYYY={parseDDMMYYYY}
                buildDueDate={buildDueDate}
                isReminderDateInPast={isReminderDateInPast}
            />
        </Modal>
    );
}