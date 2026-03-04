import '../../styles/ToDoCard.css'

// Mapeo de colores por prioridad
const PRIORITY_CONFIG = {
    alta: {
        label: 'Alta',
        color: '#dc2626',
        bg: '#fef2f2',
        border: '#fecaca',
    },
    media: {
        label: 'Media',
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a',
    },
    baja: {
        label: 'Baja',
        color: '#16a34a',
        bg: '#f0fdf4',
        border: '#bbf7d0',
    },
}

// Formatear fecha de "2026-03-03" a "03/03/2026"
function formatDate(dateStr) {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
}

// Formatear hora de "14:00" a "02:00 p.m."
function formatTime(timeStr) {
    if (!timeStr) return ''
    const [hourStr, minute] = timeStr.split(':')
    let hour = parseInt(hourStr, 10)
    const suffix = hour >= 12 ? 'p.m.' : 'a.m.'
    if (hour === 0) hour = 12
    else if (hour > 12) hour -= 12
    return `${hour.toString().padStart(2, '0')}:${minute} ${suffix}`
}

const ToDoCard = ({
    task,
    onToggleComplete,
    onEdit,
    onDelete,
}) => {
    const {
        id,
        title,
        description,
        dueDate,
        dueTime,
        priority,
        completed,
        tags = [],
    } = task

    const priorityKey = priority?.toLowerCase() || 'media'
    const priorityStyle = PRIORITY_CONFIG[priorityKey] || PRIORITY_CONFIG.media

    const formattedDate = formatDate(dueDate)
    const formattedTime = formatTime(dueTime)
    const dateTimeStr = [formattedDate, formattedTime].filter(Boolean).join(' ')

    return (
        <div
            className={`todo-card ${completed ? 'todo-card--completed' : ''}`}
            style={{ borderLeftColor: priorityStyle.color }}
        >
            {/* Fila superior: checkbox + info + prioridad */}
            <div className="todo-card__top">
                {/* Botón de completado */}
                <button
                    className={`todo-card__checkbox ${completed ? 'todo-card__checkbox--checked' : ''}`}
                    onClick={() => onToggleComplete?.(id, !completed)}
                    aria-label={completed ? 'Marcar como pendiente' : 'Marcar como completado'}
                >
                    {completed && (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    )}
                </button>

                {/* Info central */}
                <div className="todo-card__info">
                    <h3 className={`todo-card__title ${completed ? 'todo-card__title--completed' : ''}`}>
                        {title}
                    </h3>
                    {description && (
                        <p className="todo-card__description">{description}</p>
                    )}
                    {dateTimeStr && (
                        <div className="todo-card__date">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 6v10h14V10H5zm2-6v2h2V4h2v2h2V4h2v2h2V4h2v2h-2v-2" />
                                <rect x="3" y="4" width="18" height="4" rx="1" />
                                <rect x="3" y="8" width="18" height="12" rx="0" />
                            </svg>
                            <span>{dateTimeStr}</span>
                        </div>
                    )}
                </div>

                {/* Badge de prioridad */}
                <span
                    className="todo-card__priority"
                    style={{
                        color: priorityStyle.color,
                        backgroundColor: priorityStyle.bg,
                        borderColor: priorityStyle.border,
                    }}
                >
                    {priorityStyle.label}
                </span>
            </div>

            {/* Fila inferior: tags + acciones */}
            <div className="todo-card__bottom">
                {/* Tags / Etiquetas */}
                <div className="todo-card__tags">
                    {tags.map((tag) => (
                        <span
                            key={tag.id}
                            className="todo-card__tag"
                            style={{
                                color: priorityStyle.color,
                                backgroundColor: priorityStyle.bg,
                                borderColor: priorityStyle.border,
                            }}
                        >
                            {tag.label}
                        </span>
                    ))}
                </div>

                {/* Botones de acción */}
                <div className="todo-card__actions">
                    {/* Editar */}
                    <button
                        className="todo-card__action-btn"
                        onClick={() => onEdit?.(task)}
                        aria-label="Editar tarea"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>

                    {/* Eliminar */}
                    <button
                        className="todo-card__action-btn todo-card__action-btn--delete"
                        onClick={() => onDelete?.(id)}
                        aria-label="Eliminar tarea"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ToDoCard;