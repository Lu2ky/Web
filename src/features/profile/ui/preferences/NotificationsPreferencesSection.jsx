import { FaTimes } from "react-icons/fa";

export default function NotificationsPreferencesSection({
  muteInfo,
  isSavingMute,
  onOpenMuteModal,
  onUnmute,
}) {
  return (
    <section className="preferences-section">
      <h3 className="preferences-section-title">Notificaciones</h3>

      <div className="pref-group">
        <label className="pref-label">Notificaciones por Correo</label>
        <p className="pref-description">
          Recibe actualizaciones importantes en tu correo electrónico
        </p>
      </div>

      <div className="pref-group">
        <label className="pref-label">Silenciar Notificaciones</label>

        {muteInfo?.enabled ? (
          <div className="mute-status-badge">
            <span className="mute-status-indicator">●</span>
            <div className="mute-status-content">
              <p className="mute-status-text">Notificaciones silenciadas</p>
            </div>
            <button
              type="button"
              className="email-action-btn email-cancel-btn"
              onClick={onUnmute}
              title="Reactivar notificaciones"
              disabled={isSavingMute}
            >
              <FaTimes />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="mute-toggle-btn"
            onClick={onOpenMuteModal}
            disabled={isSavingMute}
          >
            Silenciar Notificaciones
          </button>
        )}
      </div>
    </section>
  );
}
