import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import '../../styles/addButton.css';
import { getTagsByUser } from '../../services/tagsService';
import { isReminderDateInPast, PAST_REMINDER_DATE_MESSAGE } from "./reminderDateValidation";

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
    const [tagType, setTagType] = useState('custom');
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
    const tagInputRef = useRef(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [dateText, setDateText] = useState('');
    const [timeText, setTimeText] = useState('');
    const [error, setError] = useState('');
    const [fetchedTags, setFetchedTags] = useState([]);

    const stringToDate = (dateValue) => {
        if (!dateValue) return new Date();
        if (dateValue instanceof Date) return dateValue;

        const raw = String(dateValue).trim();
        if (!raw) return new Date();

        const yyyyMmDd = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (yyyyMmDd) {
            const year = Number(yyyyMmDd[1]);
            const month = Number(yyyyMmDd[2]) - 1;
            const day = Number(yyyyMmDd[3]);
            return new Date(year, month, day);
        }

        const dateTime = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
        if (dateTime) {
            const year = Number(dateTime[1]);
            const month = Number(dateTime[2]) - 1;
            const day = Number(dateTime[3]);
            const hour = Number(dateTime[4]);
            const minute = Number(dateTime[5]);
            const second = Number(dateTime[6] || 0);
            return new Date(year, month, day, hour, minute, second);
        }

        const parsed = new Date(raw.replace(' ', 'T'));
        return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const parseDDMMYYYY = (str) => {
        if (!str) return null;
        const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (!m) return null;
        const day = Number(m[1]);
        const month = Number(m[2]) - 1;
        const year = Number(m[3]);
        const d = new Date(year, month, day);
        if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
        return d;
    };

    const getDatePart = (dateValue) => {
        if (!dateValue) return '';
        if (typeof dateValue === 'string') {
            const raw = dateValue.trim();
            const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (dateOnly) return `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}`;

            const dateTime = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?$/);
            if (dateTime) return `${dateTime[1]}-${dateTime[2]}-${dateTime[3]}`;
        }

        const parsed = stringToDate(dateValue);
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getTimePart = (dateValue) => {
        if (!dateValue) return '';
        if (typeof dateValue === 'string') {
            const raw = dateValue.trim();
            const dateTime = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?$/);
            if (dateTime) return `${dateTime[4]}:${dateTime[5]}`;
        }

        const parsed = stringToDate(dateValue);
        if (Number.isNaN(parsed.getTime())) return '';
        const hours = String(parsed.getHours()).padStart(2, '0');
        const minutes = String(parsed.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const buildDueDate = (datePart, timePart) => {
        if (!datePart) return '';
        if (!timePart) return datePart;
        return `${datePart} ${timePart}:00`;
    };

    useEffect(() => {
        if (formData.dueDate) {
            setDateText(formatDate(stringToDate(formData.dueDate)));
            setTimeText(getTimePart(formData.dueDate));
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

    // useEffect modificado para precargar datos cuando es duplicado
    useEffect(() => {
        if (isOpen) {
            setError('');
            if (onboardingId === "todo-duplicate-modal") {
                window.dispatchEvent(new CustomEvent("onboarding:todo-card-duplicate-clicked"));
            }
            setTagLabel('');
            setTagType('custom');
            
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

    if (!isOpen) return null;

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

        if (isReminderDateInPast(formData.dueDate)) {
            setError(PAST_REMINDER_DATE_MESSAGE);
            return;
        }

        // Incluir automáticamente cualquier etiqueta pendiente que quede en el input
        let finalTags = formData.tags;
        const pending = tagLabel.trim();
        if (pending && !finalTags.some(t => t.label === pending)) {
            finalTags = [...finalTags, { label: pending, type: tagType }];
        }

        const dataToSend = { ...formData, tags: finalTags };
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
        } catch (saveError) {
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

    const tagsSource = fetchedTags.length > 0 ? fetchedTags : availableTags;
    const filteredTags = tagsSource.filter(t =>
        t.label.toLowerCase().includes(tagLabel.toLowerCase())
    );

    return (
        <div
            className="modalOverlay"
            role="dialog"
            aria-modal="true"
            onClick={() => {
                setShowCalendar(false);
                setShowTagDropdown(false);
                onClose();
            }}
        >
            <div
                className="modalContainer"
                onClick={(e) => e.stopPropagation()}
                data-onboarding-id={onboardingId}
            >
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
                    onChange={(e) => {
                        setFormData(prev => ({ ...prev, name: e.target.value }));
                        if (onboardingNameTypedEvent && String(e.target.value || "").trim()) {
                            window.dispatchEvent(new CustomEvent(onboardingNameTypedEvent));
                        }
                    }}
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
                            const parsed = parseDDMMYYYY(v);
                            if (parsed) {
                                const y = parsed.getFullYear();
                                const mo = String(parsed.getMonth() + 1).padStart(2, '0');
                                const d = String(parsed.getDate()).padStart(2, '0');
                                const datePart = `${y}-${mo}-${d}`;
                                const nextDueDate = buildDueDate(datePart, timeText);
                                setFormData(prev => ({ ...prev, dueDate: nextDueDate }));
                                if (!isReminderDateInPast(nextDueDate)) {
                                    setError('');
                                }
                            }
                        }}
                        onBlur={() => {
                            const parsed = parseDDMMYYYY(dateText);
                            if (!parsed) setDateText(formatDate(stringToDate(formData.dueDate)));
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

                <h4>Hora límite</h4>
                <input
                    type="time"
                    value={timeText}
                    onChange={(e) => {
                        const nextTime = e.target.value;
                        setTimeText(nextTime);
                        const datePart = getDatePart(formData.dueDate);
                        if (datePart) {
                            const nextDueDate = buildDueDate(datePart, nextTime);
                            setFormData(prev => ({ ...prev, dueDate: nextDueDate }));
                            if (!isReminderDateInPast(nextDueDate)) {
                                setError('');
                            }
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
                                        onClick={() => handleRemoveTag(tag)}
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
                        title="Guardar recordatorio"
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
                                        className="tagActionBtn tagActionEdit"
                                        title="Editar etiqueta"
                                        aria-label="Editar etiqueta"
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setTagLabel(t.label);
                                            setTagType(t.type || 'custom');
                                            setShowTagDropdown(false);
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                    </button>
                                    <button
                                        className="tagActionBtn tagActionDelete"
                                        title="Eliminar de la tarea"
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            handleRemoveTag(t);
                                            setShowTagDropdown(false);
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
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