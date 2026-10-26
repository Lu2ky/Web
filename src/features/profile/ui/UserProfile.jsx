import "./UserProfile.css";
import { useUserProfile } from "../model/useUserProfile";
import ProfileInfoSection from "./profile/ProfileInfoSection";
import PasswordChangeSection from "./profile/PasswordChangeSection";
import OnboardingResetSection from "./profile/OnboardingResetSection";

export default function UserProfile({ userId }) {
  const profile = useUserProfile(userId);

  if (profile.loading) {
    return (
      <div className="user-profile">
        <p className="loading">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="user-profile" data-onboarding-id="profile-modal">
      {profile.error && <div className="alert alert-error" role="alert">{profile.error}</div>}
      {profile.success && <div className="alert alert-success" role="status">{profile.success}</div>}

      <ProfileInfoSection userData={profile.userData} />

      <PasswordChangeSection
        currentPassword={profile.currentPassword}
        setCurrentPassword={profile.setCurrentPassword}
        newPassword={profile.newPassword}
        setNewPassword={profile.setNewPassword}
        confirmPassword={profile.confirmPassword}
        setConfirmPassword={profile.setConfirmPassword}
        showCurrentPassword={profile.showCurrentPassword}
        setShowCurrentPassword={profile.setShowCurrentPassword}
        showNewPassword={profile.showNewPassword}
        setShowNewPassword={profile.setShowNewPassword}
        showConfirmPassword={profile.showConfirmPassword}
        setShowConfirmPassword={profile.setShowConfirmPassword}
        isChangingPassword={profile.isChangingPassword}
        passwordChecklist={profile.passwordChecklist}
        metCriteriaCount={profile.metCriteriaCount}
        checklistProgress={profile.checklistProgress}
        showMatchHint={profile.showMatchHint}
        passwordsMatch={profile.passwordsMatch}
        onSubmit={profile.handleChangePassword}
      />

      <OnboardingResetSection />
    </div>
  );
}
