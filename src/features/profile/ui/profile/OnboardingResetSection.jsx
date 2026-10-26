export default function OnboardingResetSection() {
  return (
    <section className="profile-section">
      <h3 className="profile-section-title">Guía de Inicio</h3>
      <p className="profile-section-description">
        Reinicia la guía de inicio para repasar todas las funciones disponibles.
      </p>
      <button
        type="button"
        className="profile-reset-onboarding-btn"
        onClick={() => window.dispatchEvent(new CustomEvent("onboarding:reset-requested"))}
        title="Reiniciar guía de inicio"
        aria-label="Reiniciar guía de inicio"
      >
        Reiniciar Guía
      </button>
    </section>
  );
}
