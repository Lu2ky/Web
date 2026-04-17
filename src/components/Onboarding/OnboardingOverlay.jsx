import { useEffect, useMemo, useState } from "react";
import useOnboarding from "../../hooks/useOnboarding";
import OnboardingStep from "./OnboardingStep";
import "../../styles/Onboarding.css";

const getElementRect = (element) => {
	if (!element) return null;
	const rect = element.getBoundingClientRect();
	if (rect.width <= 0 || rect.height <= 0) return null;

	return {
		top: Math.max(0, rect.top + window.scrollY - 8),
		left: Math.max(0, rect.left + window.scrollX - 8),
		width: rect.width + 16,
		height: rect.height + 16
	};
};

function OnboardingOverlay() {
	const {
		isLoading,
		isOpen,
		steps,
		currentStep,
		totalSteps,
		canContinue,
		validationMessage,
		nextStep,
		prevStep,
		skip
	} = useOnboarding();
	const [layoutTick, setLayoutTick] = useState(0);

	const current = useMemo(() => steps[currentStep] ?? null, [steps, currentStep]);
	const targetElement = useMemo(() => {
		if (!isOpen || !current?.targetSelector) return null;
		return document.querySelector(current.targetSelector);
	}, [isOpen, current]);
	const targetRect = useMemo(() => getElementRect(targetElement), [targetElement, layoutTick]);

	useEffect(() => {
		const handleStepChanged = () => {
			setLayoutTick((prev) => prev + 1);
		};

		window.addEventListener("onboarding:step-changed", handleStepChanged);
		return () => window.removeEventListener("onboarding:step-changed", handleStepChanged);
	}, []);

	useEffect(() => {
		if (!targetElement) {
			return;
		}

		targetElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

		const updateLayout = () => {
			setLayoutTick((prev) => prev + 1);
		};

		window.addEventListener("resize", updateLayout);
		window.addEventListener("scroll", updateLayout, true);

		return () => {
			window.removeEventListener("resize", updateLayout);
			window.removeEventListener("scroll", updateLayout, true);
		};
	}, [targetElement]);

	if (isLoading) return null;

	if (!isOpen) {
		return null;
	}

	if (!current) return null;

	return (
		<div className="onboarding-overlay" aria-hidden="false">
			<div className="onboarding-backdrop" />
			{targetRect && (
				<div
					className="onboarding-spotlight"
					style={{
						top: `${targetRect.top}px`,
						left: `${targetRect.left}px`,
						width: `${targetRect.width}px`,
						height: `${targetRect.height}px`
					}}
				/>
			)}

			<div className={`onboarding-panel ${current.panelPosition === "top-right" ? "top-right" : ""}`}>
				<OnboardingStep
					title={current.title}
					description={current.description}
					requirementText={current.requirementText}
					currentStep={currentStep}
					totalSteps={totalSteps}
					canContinue={canContinue}
					validationMessage={validationMessage}
					onNext={nextStep}
					onPrev={prevStep}
					onSkip={skip}
					isLastStep={currentStep === totalSteps - 1}
				/>
			</div>
		</div>
	);
}

export default OnboardingOverlay;
