import {
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaRegCircle,
  FaExclamationCircle,
} from "react-icons/fa";

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggleVisibility,
  disabled,
  placeholder,
}) {
  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <div className="password-input-wrapper">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="form-input"
          disabled={disabled}
        />
        <button
          type="button"
          className="password-toggle-btn"
          onClick={onToggleVisibility}
          disabled={disabled}
          title="Mostrar/ocultar contraseña"
          aria-label="Alternar visibilidad de contraseña"
        >
          {visible ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
  );
}

export default function PasswordChangeSection({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  isChangingPassword,
  passwordChecklist,
  metCriteriaCount,
  checklistProgress,
  showMatchHint,
  passwordsMatch,
  onSubmit,
}) {
  return (
    <section className="profile-section" data-onboarding-id="password-change-section">
      <h3 className="profile-section-title">Cambiar Contraseña</h3>

      <form onSubmit={onSubmit} className="password-form">
        <PasswordField
          id="currentPassword"
          label="Contraseña Actual"
          value={currentPassword}
          onChange={setCurrentPassword}
          visible={showCurrentPassword}
          onToggleVisibility={() => setShowCurrentPassword(!showCurrentPassword)}
          disabled={isChangingPassword}
          placeholder="Ingresa tu contraseña actual"
        />

        <PasswordField
          id="newPassword"
          label="Nueva Contraseña"
          value={newPassword}
          onChange={setNewPassword}
          visible={showNewPassword}
          onToggleVisibility={() => setShowNewPassword(!showNewPassword)}
          disabled={isChangingPassword}
          placeholder="Ingresa una nueva contraseña"
        />

        <div className="password-checklist" aria-live="polite">
          <div className="password-checklist-header">
            <span className="password-checklist-title">Criterios de seguridad</span>
            <span className="password-checklist-score">
              {metCriteriaCount}/{passwordChecklist.length}
            </span>
          </div>

          <div className="password-checklist-progress-track" aria-hidden="true">
            <span
              className="password-checklist-progress-fill"
              style={{ width: `${checklistProgress}%` }}
            />
          </div>

          <ul className="password-checklist-list">
            {passwordChecklist.map((criteria) => (
              <li
                key={criteria.id}
                className={`password-checklist-item ${criteria.met ? "met" : "pending"}`}
              >
                <span className="password-checklist-icon" aria-hidden="true">
                  {criteria.met ? <FaCheckCircle /> : <FaRegCircle />}
                </span>
                <span>{criteria.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <PasswordField
          id="confirmPassword"
          label="Confirmar Nueva Contraseña"
          value={confirmPassword}
          onChange={setConfirmPassword}
          visible={showConfirmPassword}
          onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
          disabled={isChangingPassword}
          placeholder="Confirma tu nueva contraseña"
        />

        {showMatchHint && (
          <p className={`password-match-hint ${passwordsMatch ? "match" : "no-match"}`}>
            <span aria-hidden="true">
              {passwordsMatch ? <FaCheckCircle /> : <FaExclamationCircle />}
            </span>
            {passwordsMatch
              ? "Las contraseñas coinciden"
              : "Las contraseñas no coinciden"}
          </p>
        )}

        <button
          type="submit"
          className="profile-submit-btn"
          disabled={isChangingPassword}
          title="Confirmar cambio de contraseña"
          aria-label="Cambiar contraseña"
        >
          {isChangingPassword ? "Actualizando..." : "Cambiar Contraseña"}
        </button>
      </form>
    </section>
  );
}
