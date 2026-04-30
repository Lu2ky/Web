import React, { useState } from 'react';
import '../../styles/addButton.css';
import DropdownBase from '../Templates/DropdownBase';

export default function FilterFormContent({
    filters,
    setFilters,
    availableTags = []
}) {
    const [openFilter, setOpenFilter] = useState(null);

    const statusOptions = [
        { value: 'all', label: 'Todas' },
        { value: 'pending', label: 'Pendientes' },
        { value: 'completed', label: 'Completadas' }
    ];

    const priorityOptions = [
        { value: 'all', label: 'Todas' },
        { value: 'alta', label: 'Alta' },
        { value: 'media', label: 'Media' },
        { value: 'baja', label: 'Baja' }
    ];

    return (
        <>
            <label>Estado</label>
            <DropdownBase
                open={openFilter === 'status'}
                onOpenChange={(isOpen) => setOpenFilter(isOpen ? 'status' : null)}
                closeOnEscape={true}
                closeOnSelect={false}
                roleMode="listbox"
                menuClassName="filterDropdown"
                trigger={({ ref, isOpen, ...attrs }) => (
                    <button
                        ref={ref}
                        {...attrs}
                        className="filterTrigger"
                        type="button"
                    >
                        {statusOptions.find(opt => opt.value === filters.status)?.label || 'Seleccionar'}
                    </button>
                )}
            >
                {({ close }) => (
                    <div className="filterDropdownList">
                        {statusOptions.map(opt => (
                            <div
                                key={opt.value}
                                className={`filterOption ${filters.status === opt.value ? 'active' : ''}`}
                                onClick={() => {
                                    setFilters(prev => ({ ...prev, status: opt.value }));
                                    close();
                                }}
                            >
                                {opt.label}
                            </div>
                        ))}
                    </div>
                )}
            </DropdownBase>

            <label>Prioridad</label>
            <DropdownBase
                open={openFilter === 'priority'}
                onOpenChange={(isOpen) => setOpenFilter(isOpen ? 'priority' : null)}
                closeOnEscape={true}
                closeOnSelect={false}
                roleMode="listbox"
                menuClassName="filterDropdown"
                trigger={({ ref, isOpen, ...attrs }) => (
                    <button
                        ref={ref}
                        {...attrs}
                        className="filterTrigger"
                        type="button"
                    >
                        {priorityOptions.find(opt => opt.value === filters.priority)?.label || 'Seleccionar'}
                    </button>
                )}
            >
                {({ close }) => (
                    <div className="filterDropdownList">
                        {priorityOptions.map(opt => (
                            <div
                                key={opt.value}
                                className={`filterOption ${filters.priority === opt.value ? 'active' : ''}`}
                                onClick={() => {
                                    setFilters(prev => ({ ...prev, priority: opt.value }));
                                    close();
                                }}
                            >
                                {opt.label}
                            </div>
                        ))}
                    </div>
                )}
            </DropdownBase>

            <label>Etiqueta</label>
            {availableTags && availableTags.length > 0 ? (
                <DropdownBase
                    open={openFilter === 'tag'}
                    onOpenChange={(isOpen) => setOpenFilter(isOpen ? 'tag' : null)}
                    closeOnEscape={true}
                    closeOnSelect={false}
                    roleMode="listbox"
                    menuClassName="filterDropdown"
                    trigger={({ ref, isOpen, ...attrs }) => (
                        <button
                            ref={ref}
                            {...attrs}
                            className="filterTrigger"
                            type="button"
                        >
                            {availableTags.find(t => t.label === filters.tag)?.label || 'Seleccionar'}
                        </button>
                    )}
                >
                    {({ close }) => (
                        <div className="filterDropdownList">
                            <div
                                className={`filterOption ${filters.tag === '' ? 'active' : ''}`}
                                onClick={() => {
                                    setFilters(prev => ({ ...prev, tag: '' }));
                                    close();
                                }}
                            >
                                Todas
                            </div>
                            {availableTags.map(t => (
                                <div
                                    key={t.id}
                                    className={`filterOption ${filters.tag === t.label ? 'active' : ''}`}
                                    onClick={() => {
                                        setFilters(prev => ({ ...prev, tag: t.label }));
                                        close();
                                    }}
                                >
                                    {t.label}
                                </div>
                            ))}
                        </div>
                    )}
                </DropdownBase>
            ) : (
                <input
                    type="text"
                    placeholder="Ej: Mathematics"
                    value={filters.tag}
                    onChange={e => setFilters(prev => ({ ...prev, tag: e.target.value }))}
                />
            )}
        </>
    );
}
