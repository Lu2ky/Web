import MessageConfirmation from "../../../shared/ui/MessageConfirmation";
import "./styles/AcademicPeriodListCard.css";
import { useAcademicPeriods } from "../model/useAcademicPeriods";
import AcademicPeriodItem from "./AcademicPeriodItem";

function AcademicPeriodListCard({ userId = null, refreshToken = 0 }) {
  const state = useAcademicPeriods({ userId, refreshToken });

  return (
    <section className="academicPeriodListCard" aria-labelledby="period-list-title">
      <header className="academicPeriodListCard__header">
        <h2 id="period-list-title">Periodos academicos registrados</h2>
        <button
          className="academicPeriodListCard__refresh"
          type="button"
          onClick={state.loadPeriods}
          disabled={state.isLoading || state.isSaving || state.isDeleting}
        >
          {state.isLoading ? "Actualizando..." : "Actualizar"}
        </button>
      </header>

      {state.error ? (
        <p className="academicPeriodListCard__message academicPeriodListCard__message--error">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="academicPeriodListCard__message academicPeriodListCard__message--success">
          {state.success}
        </p>
      ) : null}

      {state.isLoading ? (
        <p className="academicPeriodListCard__state">Cargando periodos...</p>
      ) : null}

      {!state.isLoading && state.periods.length === 0 ? (
        <p className="academicPeriodListCard__state">
          Aun no hay periodos academicos registrados.
        </p>
      ) : null}

      {!state.isLoading && state.periods.length > 0 ? (
        <ul className="academicPeriodListCard__list">
          {state.periods.map((period) => (
            <li key={period.id} className="academicPeriodListCard__item">
              <AcademicPeriodItem
                period={period}
                isEditing={state.editingId === period.id}
                isSaving={state.isSaving}
                isDeleting={state.isDeleting}
                editName={state.editName}
                editStart={state.editStart}
                editEnd={state.editEnd}
                onEditNameChange={state.setEditName}
                onEditStartChange={state.setEditStart}
                onEditEndChange={state.setEditEnd}
                onStartEdit={() => state.startEdit(period)}
                onCancelEdit={state.cancelEdit}
                onSaveEdit={state.saveEdit}
                onRequestDelete={() => state.setDeleteTarget(period)}
              />
            </li>
          ))}
        </ul>
      ) : null}

      <MessageConfirmation
        isOpen={Boolean(state.deleteTarget)}
        onClose={() => state.setDeleteTarget(null)}
        onConfirm={state.confirmDelete}
        title="Eliminar periodo academico"
        description={`Se eliminara el periodo ${
          state.deleteTarget?.nombre || ""
        }. Esta accion no se puede deshacer.`}
        confirmText={state.isDeleting ? "Eliminando..." : "Si, eliminar"}
        cancelText="No, mantener"
      />
    </section>
  );
}

export default AcademicPeriodListCard;
