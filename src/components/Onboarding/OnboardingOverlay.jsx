import { useEffect, useMemo, useState } from "react";
import useOnboarding from "../../hooks/useOnboarding";
import OnboardingStep from "./OnboardingStep";
import "../../styles/Onboarding.css";

const getElementRect = (element) => {
	if (!element) {
		return null;
	}
	const rect = element.getBoundingClientRect();
	
	if (rect.width <= 0 || rect.height <= 0) {
		return null;
	}

	// Buscar el modal parent para entender su posición
	let currentParent = element.parentElement;
	let modalContainer = null;
	while (currentParent) {
		if (currentParent.className?.includes("modal-container")) {
			modalContainer = currentParent;
			break;
		}
		currentParent = currentParent.parentElement;
	}

	if (modalContainer) {
		const modalRect = modalContainer.getBoundingClientRect();

		// Si el elemento está dentro del modal pero fuera de los límites del viewport
		// recalcular usando las coordenadas del modal como referencia
		if (rect.left > modalRect.right || rect.right < modalRect.left) {
			// El elemento debería estar dentro del modal, así que usar las coordenadas del modal
			const elementOffsetLeft = rect.left - modalRect.left;
			const elementOffsetTop = rect.top - modalRect.top;
			
			// Si el elemento está dentro del modal visualmente, pero sus coordenadas globales son incorrectas,
			// usar el offset dentro del modal para posicionar el spotlight en el modal
			if (elementOffsetLeft >= 0 && elementOffsetLeft <= modalRect.width &&
				elementOffsetTop >= 0 && elementOffsetTop <= modalRect.height) {
				// El elemento está dentro del modal, usar las coordenadas relativas al modal
				const result = {
					top: modalRect.top + elementOffsetTop - 8,
					left: modalRect.left + elementOffsetLeft - 8,
					width: rect.width + 16,
					height: rect.height + 16
				};
				return result;
			}
		}
	}

	// Por defecto, usar coordenadas relativas al viewport
	const top = Math.max(0, rect.top - 8);
	const left = Math.max(0, rect.left - 8);

	const result = {
		top,
		left,
		width: rect.width + 16,
		height: rect.height + 16
	};
	return result;
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

	// Detectar si debe cambiar a posición top por colisión
	const shouldForceTop = useMemo(() => {
		if (!targetRect || !current) return false;
		
		// Solo aplicar collision detection a pasos del TodoList
		const todoListSteps = [
			"todo-overview",
			"todo-add-reminder",
			"todo-filter",
			"todo-card-edit",
			"todo-card-duplicate",
			"todo-card-delete"
		];
		
		// Si no es un paso del TodoList, no forzar top
		if (!todoListSteps.includes(current.id)) return false;
		
		// En pantallas pequeñas (móvil), si el elemento está en la mitad inferior de la pantalla,
		// forzar posición top para evitar sobreposición con TodoList drawer
		const isMobile = window.innerWidth <= 768;
		if (!isMobile) return false;

		// Si el elemento está por debajo del 50% de la altura de la pantalla, forzar top
		const elementCenter = targetRect.top + targetRect.height / 2;
		const screenMidpoint = window.innerHeight * 0.5;
		
		return elementCenter > screenMidpoint;
	}, [targetRect, current]);

	// Determinar posición final del panel
	const panelPosition = useMemo(() => {
		// Si hay colisión detectada, usar top
		if (shouldForceTop) return "top-right";
		// Sino, usar la posición definida en el step
		return current?.panelPosition || "bottom-right";
	}, [shouldForceTop, current]);

	useEffect(() => {
		if (!targetElement) {
			return;
		}

		// Scroll el elemento en el viewport
		targetElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

		// Recalcular el layout después del scroll con delay para smooth scroll
		const scrollUpdateTimeout = setTimeout(() => {
			setLayoutTick((prev) => prev + 1);
		}, 600);

		const updateLayout = () => {
			setLayoutTick((prev) => prev + 1);
		};

		window.addEventListener("resize", updateLayout);
		window.addEventListener("scroll", updateLayout, true);

		return () => {
			clearTimeout(scrollUpdateTimeout);
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

			<div className={`onboarding-panel ${panelPosition === "top-right" ? "top-right" : ""} ${panelPosition === "top" ? "top" : ""}`}>
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
