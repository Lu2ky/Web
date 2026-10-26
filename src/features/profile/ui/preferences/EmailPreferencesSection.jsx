import { FaEdit, FaTimes, FaCheck } from "react-icons/fa";

export default function EmailPreferencesSection({
  currentEmail,
  isEditingEmail,
  newEmail,
  isSavingEmail,
  onEdit,
  onCancel,
  onSave,
  onEmailInput,
}) {
  return (
    <section className="preferences-section" data-onboarding-id="preferences-email-section">
      <h3 className="preferences-section-title">Correo Electrónico</h3>

      <div className="pref-group">
        <label className="pref-label">Correo Principal</label>
        {isEditingEmail ? (
          <form onSubmit={onSave} className="email-edit-form">
            <div className="email-input-wrapper" data-onboarding-id="preferences-email-input">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => onEmailInput(e.target.value)}
                placeholder="nuevo.email@upb.edu"
                className="form-input email-input"
                disabled={isSavingEmail}
              />
              <button
                type="submit"
                className="email-action-btn email-save-btn"
                disabled={isSavingEmail}
                title="Guardar"
                data-onboarding-id="preferences-email-save-button"
              >
                <FaCheck />
              </button>
              <button
                type="button"
                className="email-action-btn email-cancel-btn"
                onClick={onCancel}
                disabled={isSavingEmail}
                title="Cancelar"
              >
                <FaTimes />
              </button>
            </div>
          </form>
        ) : (
          <div className="email-display-wrapper">
            <div className="pref-value">{currentEmail}</div>
            <button
              className="email-edit-button"
              onClick={onEdit}
              disabled={isSavingEmail}
              title="Editar correo"
              data-onboarding-id="preferences-email-edit-button"
            >
              <FaEdit />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
