import React, { useState, useEffect, useRef, useCallback } from 'react';
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import '../../styles/addButton.css';
import { deleteTag, getTagsByUser } from '../../services/tagsService';
import {
    stringToDate,
    formatDateDMY,
    parseDateDMY,
    getTimePart,
    buildDateTime
} from '../../utils/dateTimeFormatter';
import Modal from '../Templates/Modal';
import TaskEditFormContent from './TaskEditFormContent';

export default function TaskEditModal({
    isOpen,
    onClose,
    onSave,
    task = null,
    title = "Editar Tarea",
    userId,
    availableTags = []
}) {
    const normalizeTags = (tags) => {
        if (!tags) return [];
        return tags.map(t => (typeof t === 'string' ? { label: t, type: 'custom' } : t));
    };

    const [formData, setFormData] = useState({
        name: task?.name || '',
        description: task?.description || '',
        dueDate: task?.dueDate || '',
        tags: normalizeTags(task?.tags) || [],
        priority: task?.priority || ''
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
            const dateObj = stringToDate(formData.dueDate);
            setDateText(formatDateDMY(dateObj));
            const timeFull = getTimePart(formData.dueDate);
            setTimeText(timeFull.slice(0, 5));
        } else {
            setDateText('');
            setTimeText('');
        }
    }, [formData.dueDate]);

    useEffect(() => {
        if (isOpen) {
            setError('');
            setTagLabel('');
            setFormData({
                name: task?.name || '',
                description: task?.description || '',
                dueDate: task?.dueDate || '',
                tags: normalizeTags(task?.tags) || [],
                priority: task?.priority || ''
            });
            if (userId) {
                getTagsByUser(userId).then(setFetchedTags).catch(() => setFetchedTags([]));
            }
        }
    }, [isOpen, task, userId]);

    const handleModalClose = useCallback(() => {
        setShowCalendar(false);
        onClose();
    }, [onClose]);

    const handleSave = () => {
        if (!formData.name.trim()) {
            setError('El nombre es obligatorio');
            return;
        }

        // Si la fecha no tiene hora, agregar hora default 00:00:00
        let finalDueDate = formData.dueDate;
        if (finalDueDate) {
            const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(finalDueDate);
            if (dateOnly) {
                finalDueDate = finalDueDate + " 00:00:00";
            }
        }

        // Validar que la fecha/hora no sea anterior a la actual
        if (finalDueDate) {
            const dueDateObj = stringToDate(finalDueDate);
            const now = new Date();
            
            if (dueDateObj < now) {
                setError('La fecha y hora no pueden ser anteriores a la actual');
                return;
            }
        }

        // Incluir automáticamente cualquier etiqueta pendiente que quede en el input
        let finalTags = formData.tags;
        const pending = tagLabel.trim();
        if (pending && !finalTags.some(t => t.label === pending)) {
            finalTags = [...finalTags, { label: pending, type: 'custom' }];
        }

        const saveData = { ...formData, dueDate: finalDueDate, tags: finalTags };

        onSave(saveData);

        // Disparar evento de onboarding después de guardar
        window.dispatchEvent(new CustomEvent("onboarding:todo-edit-saved"));
        
        setTagLabel('');
        onClose();
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
        setFormData(prev => ({ ...prev, dueDate: buildDateTime(selectedDate, timeText) }));
        setShowCalendar(false);
    };

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
            bodyClassName="modal-form-body"
        >
            <TaskEditFormContent
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
                fetchedTags={fetchedTags}
                availableTags={availableTags}
                handleAddTag={handleAddTag}
                handleDeleteTag={handleDeleteTag}
                handleDateFromCalendar={handleDateFromCalendar}
                stringToDate={stringToDate}
                parseDateDMY={parseDateDMY}
                formatDateDMY={formatDateDMY}
            />
        </Modal>
    );
}