/**
 * Máquina de estados del onboarding.
 *
 * Separa la navegación (pasos, progreso y persistencia) del contexto React.
 * El provider solo publica el resultado.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getOnboardingCompletionStatus,
  resetOnboardingCompletion,
  saveOnboardingCompletion,
} from "../api/onboardingService";
import {
  ONBOARDING_STEPS,
  getInitialCompletedActions,
} from "../config/onboardingSteps";
import { useOnboardingEvents } from "./useOnboardingEvents";

export function useOnboardingNavigation(userId) {
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedActions, setCompletedActions] = useState(getInitialCompletedActions);
  const [validationMessage, setValidationMessage] = useState("");
  const preventAutoAdvanceOnceRef = useRef(false);

  const steps = ONBOARDING_STEPS;
  const totalSteps = steps.length;

  useEffect(() => {
    let isDisposed = false;

    const initializeOnboarding = async () => {
      const trimmedUserId = String(userId || "").trim();
      if (!trimmedUserId) {
        setIsOpen(false);
        setCurrentStep(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const remoteStatus = await getOnboardingCompletionStatus(trimmedUserId);
      const isCompleted = remoteStatus === true || Number(remoteStatus) === 1;

      if (isDisposed) return;

      setCurrentStep(0);
      setCompletedActions(getInitialCompletedActions());
      setValidationMessage("");
      setIsOpen(!isCompleted);
      setIsLoading(false);
    };

    void initializeOnboarding();

    return () => {
      isDisposed = true;
    };
  }, [userId]);

  const markAction = useCallback((actionKey) => {
    setCompletedActions((prev) => ({ ...prev, [actionKey]: true }));
    setValidationMessage("");
  }, []);

  const currentStepData = steps[currentStep] ?? null;
  const allowOpenUi = useMemo(
    () => currentStepData?.allowOpenUi ?? [],
    [currentStepData]
  );
  const requiredAction = currentStepData?.requiredAction;
  const canContinue = !requiredAction || Boolean(completedActions[requiredAction]);

  const complete = useCallback(() => {
    const trimmedUserId = String(userId || "").trim();
    if (!trimmedUserId) {
      setIsOpen(false);
      return;
    }

    setIsOpen(false);

    void (async () => {
      await saveOnboardingCompletion(trimmedUserId);
      const refreshedRemoteStatus = await getOnboardingCompletionStatus(trimmedUserId);
      const hasRemoteStatus =
        refreshedRemoteStatus !== null && refreshedRemoteStatus !== undefined;

      if (!hasRemoteStatus) return;

      const refreshedRemoteCompleted =
        refreshedRemoteStatus === true || Number(refreshedRemoteStatus) === 1;

      setIsOpen(!refreshedRemoteCompleted);
    })();
  }, [userId]);

  const nextStep = useCallback(() => {
    if (!canContinue) {
      setValidationMessage(
        currentStepData?.requirementText ||
          "Completa la acción indicada para continuar."
      );
      return;
    }

    setValidationMessage("");
    setCurrentStep((prev) => {
      if (prev >= totalSteps - 1) {
        complete();
        return prev;
      }
      return prev + 1;
    });
  }, [canContinue, complete, currentStepData, totalSteps]);

  const prevStep = useCallback(() => {
    preventAutoAdvanceOnceRef.current = true;
    setValidationMessage("");
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const skip = useCallback(() => {
    complete();
  }, [complete]);

  const reset = useCallback(() => {
    const trimmedUserId = String(userId || "").trim();
    setValidationMessage("");
    setCurrentStep(0);
    setCompletedActions(getInitialCompletedActions());

    if (!trimmedUserId) {
      setIsOpen(true);
      return;
    }

    setIsOpen(true);
    void resetOnboardingCompletion(trimmedUserId);
  }, [userId]);

  useOnboardingEvents({ onAction: markAction, onReset: reset });

  // Publica el estado para los componentes que escuchan por evento.
  useEffect(() => {
    const emitState = () => {
      window.dispatchEvent(
        new CustomEvent("onboarding:state-changed", {
          detail: {
            isOpen,
            currentStepId: currentStepData?.id ?? null,
          },
        })
      );
    };

    emitState();
    window.addEventListener("onboarding:state-request", emitState);

    return () => {
      window.removeEventListener("onboarding:state-request", emitState);
    };
  }, [isOpen, currentStepData]);

  // Cierra la UI que no pertenece al paso actual.
  useEffect(() => {
    if (!isOpen) return;

    window.dispatchEvent(
      new CustomEvent("onboarding:close-unrelated-ui", {
        detail: { allowOpenUi },
      })
    );
  }, [isOpen, currentStep, allowOpenUi]);

  // En móvil, el paso de tareas abre el drawer; el del calendario lo cierra.
  useEffect(() => {
    if (!isOpen) return;

    const step = steps[currentStep];
    if (step?.id === "todo-overview" && window.innerWidth <= 768) {
      window.dispatchEvent(new CustomEvent("onboarding:open-todo-drawer"));
    }
  }, [isOpen, currentStep, steps]);

  useEffect(() => {
    if (!isOpen) return;

    const step = steps[currentStep];
    if (step?.id === "calendar-explore" && window.innerWidth <= 768) {
      window.dispatchEvent(new CustomEvent("onboarding:close-todo-drawer"));
    }
  }, [isOpen, currentStep, steps]);

  // Avance automático tras cumplir la acción requerida.
  useEffect(() => {
    if (!isOpen || !currentStepData?.autoAdvance || !requiredAction || !canContinue) {
      return;
    }

    if (preventAutoAdvanceOnceRef.current) {
      preventAutoAdvanceOnceRef.current = false;
      return;
    }

    const timerId = setTimeout(() => {
      setValidationMessage("");
      setCurrentStep((prev) => {
        if (prev >= totalSteps - 1) {
          complete();
          return prev;
        }
        return prev + 1;
      });
    }, 450);

    return () => clearTimeout(timerId);
  }, [isOpen, currentStepData, requiredAction, canContinue, totalSteps, complete]);

  return useMemo(
    () => ({
      isLoading,
      isOpen,
      steps,
      totalSteps,
      currentStep,
      canContinue,
      validationMessage,
      nextStep,
      prevStep,
      skip,
      complete,
      reset,
    }),
    [
      isLoading,
      isOpen,
      steps,
      totalSteps,
      currentStep,
      canContinue,
      validationMessage,
      nextStep,
      prevStep,
      skip,
      complete,
      reset,
    ]
  );
}

export default useOnboardingNavigation;
