import "./UserPreferences.css";
import { useUserPreferences } from "../model/useUserPreferences";
import { getCurrentEmail } from "../lib/preferences";
import EmailPreferencesSection from "./preferences/EmailPreferencesSection";
import NotificationsPreferencesSection from "./preferences/NotificationsPreferencesSection";
import ReminderAnticipationSection from "./preferences/ReminderAnticipationSection";
import MuteNotificationsModal from "./preferences/MuteNotificationsModal";

export default function UserPreferences({ userId }) {
  const preferences = useUserPreferences(userId);

  if (preferences.loading) {
    return (
      <div className="user-preferences" data-onboarding-id="preferences-modal">
        <p className="loading">Cargando datos...</p>
      </div>
    );
  }

  const currentEmail = getCurrentEmail(preferences.userData) || "No disponible";

  return (
    <div className="user-preferences" data-onboarding-id="preferences-modal">
      {preferences.error && <div className="alert alert-error" role="alert">{preferences.error}</div>}
      {preferences.success && <div className="alert alert-success" role="status">{preferences.success}</div>}

      <EmailPreferencesSection
        currentEmail={currentEmail}
        isEditingEmail={preferences.isEditingEmail}
        newEmail={preferences.newEmail}
        isSavingEmail={preferences.isSavingEmail}
        onEdit={preferences.handleEditEmail}
        onCancel={preferences.handleCancelEmail}
        onSave={preferences.handleSaveEmail}
        onEmailInput={preferences.handleOnboardingEmailInput}
      />

      <NotificationsPreferencesSection
        muteInfo={preferences.muteInfo}
        isSavingMute={preferences.isSavingMute}
        onOpenMuteModal={preferences.handleOpenMuteModal}
        onUnmute={preferences.handleUnmute}
      />

      <MuteNotificationsModal
        isOpen={preferences.showMuteConfirmModal}
        isSavingMute={preferences.isSavingMute}
        onCancel={preferences.handleCancelMute}
        onConfirm={preferences.handleConfirmMute}
      />

      <ReminderAnticipationSection
        isEditing={preferences.isEditingAnticipation}
        hours={preferences.anticipationHours}
        minutes={preferences.anticipationMinutes}
        isSaving={preferences.isSavingAnticipation}
        onEdit={preferences.handleEditAnticipation}
        onCancel={preferences.handleCancelAnticipation}
        onSave={preferences.handleSaveAnticipation}
        onHoursChange={preferences.setAnticipationHours}
        onMinutesChange={preferences.setAnticipationMinutes}
      />
    </div>
  );
}
