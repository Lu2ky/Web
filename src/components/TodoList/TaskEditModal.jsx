import React, { useState } from 'react';
import '../../styles/TaskEditModal.css';

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

    const [newTag, setNewTag] = useState('');
    const [newTagType, setNewTagType] = useState('custom');

    if (!isOpen) return null;

    const handleSave = () => {
        if (formData.name.trim()) {
            onSave(formData);
            onClose();
        }
    };

    const handleAddTag = () => {
        const label = newTag.trim();
        const type = newTagType || 'custom';
        if (!label) return;
        const exists = formData.tags.some(t => t.label === label && t.type === type);
        if (!exists) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, { label, type }]
            }));
        }
        setNewTag('');
    };

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => !(tag.label === tagToRemove.label && tag.type === tagToRemove.type))
        }));
    };

    const CloseIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    );

    const EditIcon = () => (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
    );

    return (
        <div className="task-edit-modal-overlay" onClick={onClose}>
            <div className="task-edit-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Barra decorativa */}
                <div className="task-edit-modal-gradient-bar" />
                
                <div className="task-edit-modal-content">
                    {/* Botón de cierre */}
                    <div className="task-edit-modal-close-container">
                        <button className="task-edit-modal-close-btn" onClick={onClose}>
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Icono central y título */}
                    <div className="task-edit-modal-header">
                        <div className="task-edit-modal-icon-container">
                            <EditIcon />
                        </div>
                        
                        <h3 className="task-edit-modal-title">
                            {title}
                        </h3>
                    </div>

                    {/* Formulario */}
                    <div className="task-edit-modal-form">
                        {/* Nombre */}
                        <div className="task-edit-modal-field">
                            <label className="task-edit-modal-label">Nombre *</label>
                            <input
                                type="text"
                                className="task-edit-modal-input"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Nombre de la tarea..."
                            />
                        </div>

                        {/* Fecha límite */}
                        <div className="task-edit-modal-field">
                            <label className="task-edit-modal-label">Fecha límite</label>
                            <input
                                type="date"
                                className="task-edit-modal-input"
                                value={formData.dueDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                            />
                        </div>

                        {/* Prioridad */}
                        <div className="task-edit-modal-field">
                            <label className="task-edit-modal-label">Prioridad</label>
                            <select
                                className="task-edit-modal-select"
                                value={formData.priority}
                                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                            >
                                <option value="baja">Baja</option>
                                <option value="media">Media</option>
                                <option value="alta">Alta</option>
                            </select>
                        </div>

                        {/* Etiquetas */}
                        <div className="task-edit-modal-field">
                            <label className="task-edit-modal-label">Etiquetas</label>
                            <div className="task-edit-modal-tags-input">
                                <input
                                    type="text"
                                    className="task-edit-modal-input"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="Agregar etiqueta..."
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                />
                                <select
                                    className="task-edit-modal-select"
                                    value={newTagType}
                                    onChange={(e) => setNewTagType(e.target.value)}
                                >
                                    <option value="custom">Personal</option>
                                    <option value="subject">Materia</option>
                                    <option value="category">Categoría</option>
                                    <option value="priority-high">Prioridad Alta</option>
                                    <option value="priority-medium">Prioridad Media</option>
                                    <option value="priority-low">Prioridad Baja</option>
                                </select>
                                <button 
                                    type="button" 
                                    className="task-edit-modal-add-tag-btn"
                                    onClick={handleAddTag}
                                >
                                    +
                                </button>
                            </div>
                            
                            {/* Tags existentes */}
                            <div className="task-edit-modal-tags-list">
                                {formData.tags.map((tag, index) => (
                                    <span key={index} className={`task-edit-modal-tag ${tag.type}`}>
                                        {tag.label}
                                        <button 
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="task-edit-modal-tag-remove"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="task-edit-modal-actions">
                        <button className="task-edit-modal-cancel-btn" onClick={onClose}>
                            Cancelar
                        </button>
                        
                        <button 
                            className="task-edit-modal-save-btn" 
                            onClick={handleSave}
                            disabled={!formData.name.trim()}
                        >
                            Guardar
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="task-edit-modal-footer">
                    <span className="task-edit-modal-footer-text">
                        Editor de Tareas • UPB Planner
                    </span>
                </div>
            </div>
        </div>
    );
}