function OnboardingStep({
	title,
	description,
	requirementText,
	currentStep,
	totalSteps,
	canContinue,
	validationMessage,
	onNext,
	onPrev,
	onSkip,
	isLastStep
}) {
	return (
		<div className="onboarding-step-card" role="dialog" aria-modal="true" aria-label="Guía interactiva">
			<div className="onboarding-step-header">
				<span className="onboarding-step-badge">
					Paso {currentStep + 1} de {totalSteps}
				</span>
				<h3>{title}</h3>
			</div>

			<p className="onboarding-step-description">{description}</p>

			{requirementText && (
				<p className={`onboarding-step-requirement ${canContinue ? "is-complete" : ""}`}>
					{canContinue ? "✅ Acción completada" : `⏳ ${requirementText}`}
				</p>
			)}

			{validationMessage && <p className="onboarding-step-note">{validationMessage}</p>}

			<div className="onboarding-step-progress" aria-hidden="true">
				<div
					className="onboarding-step-progress-bar"
					style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
				/>
			</div>

			<div className="onboarding-step-actions">
				<button
					type="button"
					className="onboarding-btn onboarding-btn-secondary"
					onClick={onSkip}
				>
					Saltar
				</button>

				<div className="onboarding-step-actions-right">
					<button
						type="button"
						className="onboarding-btn onboarding-btn-tertiary"
						onClick={onPrev}
						disabled={currentStep === 0}
					>
						Anterior
					</button>
					<button type="button" className="onboarding-btn onboarding-btn-primary" onClick={onNext}>
						{isLastStep ? "Finalizar" : canContinue ? "Siguiente" : "Completa acción"}
					</button>
				</div>
			</div>
		</div>
	);
}

export default OnboardingStep;
