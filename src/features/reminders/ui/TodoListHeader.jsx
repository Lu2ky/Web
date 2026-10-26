/** Cabecera de la lista: filtros, alta y barra de selección múltiple. */

import { Icon } from "../../../shared/ui/IconSystem";
import ToDoFilterButton from "./ToDoFilterButton";
import AddButton from "./AddButton";

export default function TodoListHeader({
  selectionMode,
  onToggleSelection,
  onOpenFilter,
  userId,
  onSaved,
  availableTags,
  selectedCount,
  totalCount,
  onSelectAll,
  onOpenBulkDelete,
}) {
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  return (
    <div className={`todolist-header${selectionMode ? " selection-mode" : ""}`}>
      <h2 className="todolist-title">To-Do List</h2>
      <div className="todolist-header-actions">
        {!selectionMode && (
          <>
            <ToDoFilterButton onClick={onOpenFilter} />
            <button
              className="todolist-selection-toggle-btn"
              onClick={onToggleSelection}
              title="Seleccionar múltiples tareas"
              aria-label="Seleccionar múltiples tareas"
              type="button"
            >
              <Icon name="selectMultiple" size="md" aria-hidden="true" />
            </button>
            <AddButton userId={userId} onToDoSaved={onSaved} availableTags={availableTags} />
          </>
        )}

        {selectionMode && (
          <div className="todolist-selection-bar">
            <button
              className="todolist-selection-cancel-btn"
              onClick={onToggleSelection}
              title="Cancelar selección"
              aria-label="Cancelar selección"
              type="button"
            >
              <Icon name="x" size="md" aria-hidden="true" />
            </button>
            <span className="todolist-selection-count">
              <span className="todolist-selection-count-number">{selectedCount}</span>
            </span>
            <button
              className="todolist-select-all-btn"
              onClick={onSelectAll}
              title={allSelected ? "Deseleccionar" : "Seleccionar todo"}
              aria-label={allSelected ? "Deseleccionar" : "Seleccionar todo"}
              type="button"
            >
              {allSelected ? "Deseleccionar" : "Seleccionar todo"}
            </button>
            <button
              className="todolist-bulk-delete-btn"
              onClick={onOpenBulkDelete}
              disabled={selectedCount === 0}
              title={selectedCount === 0 ? "Selecciona al menos una tarea" : "Eliminar seleccionadas"}
              aria-label="Eliminar tareas seleccionadas"
              type="button"
            >
              <Icon name="trash" size="md" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
