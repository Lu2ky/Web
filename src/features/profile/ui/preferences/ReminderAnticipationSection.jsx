import { FaEdit, FaTimes, FaCheck } from "react-icons/fa";
import { formatAnticipation } from "../../lib/preferences";

export default function ReminderAnticipationSection({
  isEditing,
  hours,
  minutes,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  onHoursChange,
  onMinutesChange,
}) {
  return (
    <section className="preferences-section">
      <h3 className="preferences-section-title">Recordatorios</h3>

      <div className="pref-group">
        <label className="pref-label">Tiempo de Anticipación</label>
        <p className="pref-description">
          ¿Con cuánto tiempo de anticipación quieres ser recordado antes de que venza
          una tarea? (máximo 24 horas)
        </p>

        {isEditing ? (
          <form onSubmit={onSave} className="anticipation-edit-form">
            <div className="anticipation-input-wrapper">
              <div className="time-input-group">
                <label htmlFor="anticipation-hours" className="time-label">
                  Horas
                </label>
                <select
                  id="anticipation-hours"
                  value={hours}
                  onChange={(e) => onHoursChange(e.target.value)}
                  className="time-select"
                  disabled={isSaving}
                >
                  {[...Array(24)].map((_, i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>

              <div className="time-input-group">
                <label htmlFor="anticipation-minutes" className="time-label">
                  Minutos
                </label>
                <select
                  id="anticipation-minutes"
                  value={minutes}
                  onChange={(e) => onMinutesChange(e.target.value)}
                  className="time-select"
                  disabled={isSaving}
                >
                  {[...Array(60)].map((_, i) => (
                    <option key={i} value={i}>
                      {String(i).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="time-actions">
                <button
                  type="submit"
                  className="email-action-btn email-save-btn"
                  disabled={isSaving}
                  title="Guardar"
                >
                  <FaCheck />
                </button>
                <button
                  type="button"
                  className="email-action-btn email-cancel-btn"
                  onClick={onCancel}
                  disabled={isSaving}
                  title="Cancelar"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="anticipation-display-wrapper">
            <div className="pref-value">{formatAnticipation(hours, minutes)}</div>
            <button
              className="email-edit-button"
              onClick={onEdit}
              disabled={isSaving}
              title="Editar tiempo de anticipación"
            >
              <FaEdit />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
