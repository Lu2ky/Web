import { createContext, useContext } from "react";
import { useOnboardingNavigation } from "./useOnboardingNavigation";

const OnboardingContext = createContext(null);

/**
 * Provider del recorrido guiado.
 *
 * El estado y la navegación viven en `useOnboardingNavigation`; aquí solo se
 * expone el contexto y los hooks de consumo.
 */
export function OnboardingProvider({ children, userId }) {
  const value = useOnboardingNavigation(userId);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error(
      "useOnboardingContext debe usarse dentro de OnboardingProvider. " +
        "Verifica que OnboardingProvider envuelva el árbol de componentes completo."
    );
  }
  return context;
}

/**
 * Variante segura para componentes que podrían renderizarse fuera del provider
 * durante desarrollo.
 */
export function useOnboardingContextSafe() {
  const context = useContext(OnboardingContext);

  if (!context) {
    return {
      isLoading: false,
      isOpen: false,
      steps: [],
      totalSteps: 0,
      currentStep: 0,
      canContinue: false,
      validationMessage: "",
      nextStep: () => {},
      prevStep: () => {},
      skip: () => {},
      complete: () => {},
      reset: () => {},
    };
  }

  return context;
}
