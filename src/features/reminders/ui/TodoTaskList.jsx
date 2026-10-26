/** Lista de recordatorios visibles según los filtros activos. */

import RemindCard from "./RemindCard";
import { getTaskPriority } from "../lib/taskFilters";

export default function TodoTaskList({
  tasks,
  userId,
  selectionMode,
  selectedTaskIds,
  onToggle,
  onEdit,
  onDelete,
  onDuplicate,
  onSelection,
}) {
  return (
    <div className="todolist-tasks">
      {tasks.map((task) => (
        <RemindCard
          key={task.id}
          task={task}
          priority={getTaskPriority(task)}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          isSelectionMode={selectionMode}
          isSelected={selectedTaskIds.has(task.id)}
          onSelection={onSelection}
        />
      ))}

      {tasks.length === 0 && (
        <div className="todolist-empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" aria-hidden="true">
            <path
              d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="9" y="3" width="6" height="4" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p>
            {!userId
              ? "Ingresa un ID para cargar recordatorios."
              : "No hay tareas para los filtros seleccionados."}
          </p>
        </div>
      )}
    </div>
  );
}
