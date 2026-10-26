import EditButton from "../../../shared/ui/EditButton";
import { formatAcademicPeriodDate } from "../lib/academicPeriods";

/** Fila de periodo académico, en modo lectura o edición. */
export default function AcademicPeriodItem({
  period,
  isEditing,
  isSaving,
  isDeleting,
  editName,
  editStart,
  editEnd,
  onEditNameChange,
  onEditStartChange,
  onEditEndChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRequestDelete,
}) {
  if (isEditing) {
    return (
      <div className="academicPeriodListCard__editForm">
        <input
          type="text"
          value={editName}
          onChange={(event) => onEditNameChange(event.target.value)}
          maxLength={120}
          disabled={isSaving}
          placeholder="Nombre del periodo"
        />
        <input
          type="date"
          value={editStart}
          onChange={(event) => onEditStartChange(event.target.value)}
          disabled={isSaving}
        />
        <input
          type="date"
          value={editEnd}
          onChange={(event) => onEditEndChange(event.target.value)}
          disabled={isSaving}
        />
        <div className="academicPeriodListCard__editActions">
          <button type="button" onClick={onSaveEdit} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" onClick={onCancelEdit} disabled={isSaving}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="academicPeriodListCard__details">
        <p className="academicPeriodListCard__name">{period.nombre}</p>
        <p className="academicPeriodListCard__dates">
          {formatAcademicPeriodDate(period.start_date)} -{" "}
          {formatAcademicPeriodDate(period.end_date)}
        </p>
      </div>

      <div className="academicPeriodListCard__actions">
        <EditButton
          onClick={onStartEdit}
          title="Editar periodo"
          className="academicPeriodListCard__edit"
        />

        <button
          className="academicPeriodListCard__delete"
          onClick={onRequestDelete}
          aria-label="Eliminar periodo"
          title="Eliminar"
          type="button"
          disabled={isDeleting}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
            <path
              fillRule="evenodd"
              d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
            />
          </svg>
        </button>
      </div>
    </>
  );
}
