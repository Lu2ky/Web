import React, { useState, useEffect } from 'react';
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import '../../styles/addButton.css';

export default function TaskEditModal({ 
    isOpen, 
    onClose, 
    onSave,
    task = null, // Si es null, es para crear nueva tarea
    title = "Editar Tarea"
}) {
    const normalizeTags = (tags) => {
        if (!tags) return [];
        return tags.map(t => (typeof t === 'string' ? { label: t, type: 'custom' } : t));
    };

    const [formData, setFormData] = useState({
        name: task?.name || '',
        dueDate: task?.dueDate || '',
        tags: normalizeTags(task?.tags) || [],
        priority: task?.priority || 'media'
    });

    const [tagLabel, setTagLabel] = useState('');
    const [tagType, setTagType] = useState('custom');
    const [showCalendar, setShowCalendar] = useState(false);
    const [dateText, setDateText] = useState('');
    const [error, setError] = useState('');

    // Convertir string de fecha a objeto Date para el calendario
    const stringToDate = (dateStr) => {
        if (!dateStr) return new Date();
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    // Formatear fecha como dd/mm/aaaa
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Parsear dd/mm/aaaa a Date (o null si inválida)
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

    // Sincronizar dateText con formData.dueDate
    useEffect(() => {
        if (formData.dueDate) {
            setDateText(formatDate(stringToDate(formData.dueDate)));
        }
    }, [formData.dueDate]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!formData.name.trim()) {
            setError('El nombre es obligatorio');
            return;
        }
        onSave(formData);
        onClose();
    };

    const handleAddTag = () => {
        const label = tagLabel.trim();
        if (!label) return;
        const exists = formData.tags.some(t => t.label === label);
        if (!exists) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, { label, type: tagType }]
            }));
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
        setFormData(prev => ({ ...prev, dueDate: `${year}-${month}-${day}` }));
        setShowCalendar(false);
    };

    return (
        <div
            className="modalOverlay"
            role="dialog"
            aria-modal="true"
            onClick={() => {
                setShowCalendar(false);
                onClose();
            }}
        >
            <div className="modalContainer" onClick={(e) => e.stopPropagation()}>
                <h2>{title}</h2>

                <button
                    className="modalClose"
                    onClick={() => {
                        setShowCalendar(false);
                        onClose();
                    }}
                >
                    X
                </button>

                {error && <p className="errorMessage">{error}</p>}
                
                <input
                    type="text"
                    name="name"
                    placeholder="Nombre de la tarea"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
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
                            // Solo permitir dígitos
                            v = v.replace(/[^0-9]/g, '');
                            // Insertar barras automáticamente
                            if (v.length >= 2) {
                                v = v.slice(0, 2) + '/' + v.slice(2);
                            }
                            if (v.length >= 5) {
                                v = v.slice(0, 5) + '/' + v.slice(5);
                            }
                            // Limitar a máximo 10 caracteres
                            v = v.slice(0, 10);
                            setDateText(v);
                            const parsed = parseDDMMYYYY(v);
                            if (parsed) {
                                const y = parsed.getFullYear();
                                const m = String(parsed.getMonth() + 1).padStart(2, '0');
                                const d = String(parsed.getDate()).padStart(2, '0');
                                setFormData(prev => ({ ...prev, dueDate: `${y}-${m}-${d}` }));
                            }
                        }}
                        onBlur={() => {
                            const parsed = parseDDMMYYYY(dateText);
                            if (!parsed) {
                                setDateText(formatDate(formData.dueDate));
                            }
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
                                        aria-label={`Quitar ${tag.label}`}
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="tagInputRow">
                        <input
                            type="text"
                            placeholder="Etiqueta"
                            value={tagLabel}
                            onChange={(e) => setTagLabel(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddTag();
                                }
                            }}
                        />
                        <select
                            value={tagType}
                            onChange={(e) => setTagType(e.target.value)}
                        >
                            <option value="subject">Materia</option>
                            <option value="category">Categoría</option>
                            <option value="priority-high">Prioridad Alta</option>
                            <option value="priority-medium">Prioridad Media</option>
                            <option value="priority-low">Prioridad Baja</option>
                            <option value="custom">Personalizado</option>
                        </select>
                        <button
                            type="button"
                            className="addTagButton"
                            onClick={handleAddTag}
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
                    >
                        Cancelar
                    </button>

                    <button
                        className="saveButton"
                        onClick={handleSave}
                        disabled={!formData.name.trim()}
                    >
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
}