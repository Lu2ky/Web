import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import '../../styles/addButton.css';
import { deleteTag, getTagsByUser } from '../../services/tagsService';
import {
    stringToDate,
    formatDateDMY,
    parseDateDMY,
    getDatePart,
    getTimePart,
    buildDateTime
} from '../../utils/dateTimeFormatter';

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
    const [tagType, setTagType] = useState('custom');
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
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
        if (showTagDropdown && tagInputRef.current) {
            const rect = tagInputRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        }
    }, [showTagDropdown]);

    useEffect(() => {
        if (isOpen) {
            setError('');
            setTagLabel('');
            setTagType('custom');
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

    if (!isOpen) return null;

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
            finalTags = [...finalTags, { label: pending, type: tagType }];
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
                tags: [...prev.tags, { label, type: tagType }]
            }));
            setError(''); // Limpiar error si se agrega exitosamente
        }
        setTagLabel('');
        setTagType('custom');
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
        <div
            className="modalOverlay"
            role="dialog"
            aria-modal="true"
        >
            <div className="modalContainer" onClick={(e) => e.stopPropagation()} data-onboarding-id="todo-edit-modal">
                <h2>{title}</h2>

                <button
                    className="modalClose"
                    onClick={() => {
                        setShowCalendar(false);
                        onClose();
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
                    name="name"
                    placeholder="Nombre del recordatorio"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                />

                <textarea
                    name="description"
                    placeholder="Descripción"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />

                <h4>Fecha límite</h4>
                <div className="dateInputContainer">
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="dd/mm/aaaa"
                        maxLength="10"
                        value={dateText}
                        onChange={(e) => {
                            let v = e.target.value;
                            v = v.replace(/[^0-9]/g, '');
                            if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2);
                            if (v.length >= 5) v = v.slice(0, 5) + '/' + v.slice(5);
                            v = v.slice(0, 10);
                            setDateText(v);
                            const parsed = parseDateDMY(v);
                            if (parsed) {
                                const datePart = `${parsed.year}-${parsed.month}-${parsed.day}`;
                                setFormData(prev => ({ ...prev, dueDate: buildDateTime(datePart, timeText) }));
                            }
                        }}
                        onBlur={() => {
                            const parsed = parseDateDMY(dateText);
                            if (!parsed) {
                                const dateObj = stringToDate(formData.dueDate);
                                setDateText(formatDateDMY(dateObj));
                            }
                        }}
                    />
                    <button
                        type="button"
                        className="calendarToggle"
                        aria-label="Abrir Calendario"
                        title="Abrir calendario"
                        onClick={() => setShowCalendar(!showCalendar)}
                    >
                        📅
                    </button>
                </div>

                <h4>Hora límite</h4>
                <input
                    type="time"
                    value={timeText}
                    onChange={(e) => {
                        const nextTime = e.target.value;
                        setTimeText(nextTime);
                        const datePart = getDatePart(formData.dueDate);
                        if (datePart) {
                            setFormData(prev => ({ ...prev, dueDate: buildDateTime(datePart, nextTime) }));
                        }
                    }}
                />

                {showCalendar && (
                    <div className="calendarWrapper">
                        <Calendar
                            onChange={handleDateFromCalendar}
                            value={formData.dueDate ? stringToDate(formData.dueDate) : new Date()}
                            locale="es-ES"
                        />
                    </div>
                )}

                <h4>Prioridad</h4>
                <div className="priorityGroup">
                    {["alta", "media", "baja"].map((level) => (
                        <button
                            key={level}
                            type="button"
                            className={`priorityButton priority-${level} ${formData.priority === level ? "priorityActive" : ""}`}
                            onClick={() =>
                                setFormData((prev) => ({
                                    ...prev,
                                    priority: prev.priority === level ? "" : level
                                }))
                            }
                            title={`Establecer prioridad como ${level}`}
                            aria-label={`Prioridad ${level}`}
                        >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                    ))}
                </div>

                <h4>Etiquetas</h4>
                <div className="tagsSection">
                    {formData.tags.length > 0 && (
                        <div className="tagChips">
                            {formData.tags.map((tag, index) => (
                                <span key={index} className={`tagChip ${tag.type}`}>
                                    {tag.label}
                                    <button
                                        type="button"
                                        className="tagChipRemove"
                                        onClick={() => {
                                            void handleDeleteTag(tag);
                                        }}
                                        aria-label={`Quitar ${tag.label}`}                                        title={`Quitar etiqueta ${tag.label}`}                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="tagInputRow">
                        <div className="tagInputWrapper">
                            <input
                                ref={tagInputRef}
                                type="text"
                                placeholder="Etiqueta"
                                value={tagLabel}
                                onChange={(e) => {
                                    setTagLabel(e.target.value);
                                    setShowTagDropdown(true);
                                }}
                                onFocus={() => setShowTagDropdown(true)}
                                onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddTag();
                                        setShowTagDropdown(false);
                                    }
                                    if (e.key === 'Escape') setShowTagDropdown(false);
                                }}
                            />
                        </div>

                        <button
                            type="button"
                            className="addTagButton"
                            onClick={handleAddTag}
                            disabled={formData.tags.length >= 5}
                            title={formData.tags.length >= 5 ? "Límite de 5 etiquetas alcanzado" : "Agregar etiqueta"}
                            aria-label="Agregar etiqueta"
                        >
                            +
                        </button>
                    </div>
                </div>

                <div className="modalActions">
                    <button
                        className="cancelButton"
                        onClick={() => {
                            setShowCalendar(false);
                            onClose();
                        }}
                        type="button"
                        title="Cancelar y descartar cambios"
                        aria-label="Cancelar"
                    >
                        Cancelar
                    </button>

                    <button
                        className="saveButton"
                        onClick={handleSave}
                        disabled={!formData.name.trim()}
                        type="button"
                        title="Guardar cambios del recordatorio"
                        aria-label="Guardar"
                    >
                        Guardar
                    </button>
                </div>
            </div>

            {showTagDropdown && filteredTags.length > 0 && createPortal(
                <div
                    className="tagDropdown"
                    style={{
                        top: dropdownPos.top,
                        left: dropdownPos.left,
                        width: dropdownPos.width
                    }}
                >
                    <div className="tagDropdownList">
                        {filteredTags.map(t => (
                            <div
                                key={t.id ?? t.label}
                                className="tagDropdownItem"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Add tag directly to formData
                                    const label = t.label.trim();
                                    if (label) {
                                        // Validar límite antes de agregar
                                        if (formData.tags.length >= 5) {
                                            setError('No puedes agregar más de 5 etiquetas');
                                            setShowTagDropdown(false);
                                            return;
                                        }
                                        setFormData(prev => {
                                            const exists = prev.tags.some(tag => tag.label === label);
                                            if (exists) return prev;
                                            setError(''); // Limpiar error si se agrega exitosamente
                                            return { ...prev, tags: [...prev.tags, { label, type: t.type || 'custom' }] };
                                        });
                                    }
                                    setTagLabel('');
                                    setTagType('custom');
                                    setShowTagDropdown(false);
                                }}
                            >
                                <span className="tagDropdownItemLabel">{t.label}</span>

                                <div className="tagDropdownItemActions">
                                    <button
                                        className="tagActionBtn tagActionDelete"
                                        title="Eliminar etiqueta"
                                        aria-label="Eliminar etiqueta"
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            void handleDeleteTag(t);
                                            setShowTagDropdown(false);
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}