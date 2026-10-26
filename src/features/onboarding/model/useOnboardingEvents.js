/** Conecta los eventos globales de onboarding con el estado del provider. */

import { useEffect } from "react";
import { ONBOARDING_EVENT_ACTIONS } from "../config/onboardingEvents";

export function useOnboardingEvents({ onAction, onReset }) {
  useEffect(() => {
    const listeners = [];

    const register = (eventName, handler) => {
      window.addEventListener(eventName, handler);
      listeners.push([eventName, handler]);
    };

    for (const [eventName, actionKey] of Object.entries(ONBOARDING_EVENT_ACTIONS)) {
      // Se difiere para no actualizar estado durante el render de otro componente.
      register(eventName, () => Promise.resolve().then(() => onAction(actionKey)));
    }

    register("onboarding:reset-requested", () => onReset());

    return () => {
      for (const [eventName, handler] of listeners) {
        window.removeEventListener(eventName, handler);
      }
    };
  }, [onAction, onReset]);
}

export default useOnboardingEvents;
