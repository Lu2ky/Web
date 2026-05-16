import React, { useRef } from 'react';
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import '../../styles/addButton.css';

export default function TaskFormContent({
    formData,
    setFormData,
    tagLabel,
    setTagLabel,
    showTagDropdown,
    setShowTagDropdown,
    showCalendar,
    setShowCalendar,
    dateText,
    setDateText,
    timeText,
    setTimeText,
    error,
    fetchedTags,
    availableTags,
    onboardingNameTypedEvent,
    handleAddTag,
    handleDeleteTag,
    handleDateFromCalendar,
    formatDate,
    stringToDate,
    parseDDMMYYYY,
    buildDueDate,
    isReminderDateInPast,
}) {
    const tagInputRef = useRef(null);

    const tagsSource = fetchedTags.length > 0 ? fetchedTags : availableTags;
    const filteredTags = tagsSource.filter(t =>
        t.label.toLowerCase().includes(tagLabel.toLowerCase())
    );

    return (
        <>
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
                    const datePart = stringToDate(formData.dueDate ? formData.dueDate : '');
                    if (datePart && formData.dueDate) {
                        const year = datePart.getFullYear();
                        const month = String(datePart.getMonth() + 1).padStart(2, '0');
                        const day = String(datePart.getDate()).padStart(2, '0');
                        const dateParts = `${year}-${month}-${day}`;
                        const nextDueDate = buildDueDate(dateParts, nextTime);
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
                                    onClick={() => {
                                        void handleDeleteTag(tag);
                                    }}
                                    aria-label={`Quitar ${tag.label}`}
                                    title={`Quitar etiqueta ${tag.label}`}
                                >
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
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddTag();
                                    setShowTagDropdown(false);
                                }
                                if (e.key === 'Escape') setShowTagDropdown(false);
                            }}
                        />
                        {filteredTags.length > 0 && showTagDropdown && (
                            <div className="tagDropdown">
                                {filteredTags.map(t => (
                                    <div
                                        key={t.id || t.label}
                                        className="tagDropdownItem"
                                        onClick={() => {
                                            if (!formData.tags.some(tag => tag.label === t.label)) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    tags: [...prev.tags, { label: t.label, type: t.type || 'system' }]
                                                }));
                                            }
                                            setTagLabel('');
                                            setShowTagDropdown(false);
                                        }}
                                    >
                                        {t.label}
                                    </div>
                                ))}
                            </div>
                        )}
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
        </>
    );
}
