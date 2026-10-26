/**
 * Estado y acciones de las preferencias del usuario: correo, anticipación de
 * recordatorios y silenciamiento de notificaciones.
 */

import { useEffect, useRef, useState } from "react";
import * as userService from "../../../shared/api/userService";
import {
  getCurrentEmail,
  isValidEmail,
  parseAnticipationMinutes,
} from "../lib/preferences";
import { useNotificationSilence } from "./useNotificationSilence";

export function useUserPreferences(userId) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  const [isEditingAnticipation, setIsEditingAnticipation] = useState(false);
  const [anticipationHours, setAnticipationHours] = useState(0);
  const [anticipationMinutes, setAnticipationMinutes] = useState(0);
  const [isSavingAnticipation, setIsSavingAnticipation] = useState(false);

  const transientTimersRef = useRef([]);

  const scheduleTransientUpdate = (callback, delayMs) => {
    const timerId = setTimeout(() => {
      callback();
      transientTimersRef.current = transientTimersRef.current.filter(
        (id) => id !== timerId
      );
    }, delayMs);

    transientTimersRef.current.push(timerId);
  };

  const notifySuccess = (message) => {
    setSuccess(message);
    if (message) scheduleTransientUpdate(() => setSuccess(""), 3000);
  };

  const notifyError = (message) => {
    setError(message);
    if (message) scheduleTransientUpdate(() => setError(""), 4000);
  };

  const notificationSilence = useNotificationSilence({
    userId,
    onSuccess: notifySuccess,
    onError: notifyError,
  });

  const loadUserData = async () => {
    if (!userId) {
      setError("Usuario no disponible");
      setLoading(false);
      return;
    }

    try {
      const data = await userService.getUserData(userId);
      if (!data) {
        setError("No se pudieron cargar los datos del usuario");
        return;
      }

      const currentUser = Array.isArray(data) ? data[0] : data;
      setUserData(currentUser);
      setNewEmail(getCurrentEmail(currentUser));

      const totalMinutes = parseAnticipationMinutes(currentUser);
      setAnticipationHours(Math.floor(totalMinutes / 60));
      setAnticipationMinutes(totalMinutes % 60);
      setError("");
    } catch (err) {
      setError("Error al cargar los datos del usuario");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
    notificationSilence.loadMuteInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    return () => {
      transientTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      transientTimersRef.current = [];
    };
  }, []);

  const handleEditEmail = () => {
    setIsEditingEmail(true);
    setError("");
    setSuccess("");
    window.dispatchEvent(new CustomEvent("onboarding:preferences-email-edit-opened"));
  };

  const handleCancelEmail = () => {
    setIsEditingEmail(false);
    setNewEmail(getCurrentEmail(userData));
    setError("");
  };

  const handleOnboardingEmailInput = (value) => {
    setNewEmail(value);

    const trimmedValue = String(value || "").trim();
    if (trimmedValue && isValidEmail(trimmedValue)) {
      window.dispatchEvent(new CustomEvent("onboarding:preferences-email-typed"));
    }
  };

  const handleSaveEmail = async (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("onboarding:preferences-email-saved"));
    setError("");
    setSuccess("");

    const emailToSave = newEmail.trim();

    if (!emailToSave) {
      setError("Por favor ingresa un correo electrónico");
      return;
    }

    if (!isValidEmail(emailToSave)) {
      setError("Por favor ingresa un correo electrónico válido");
      return;
    }

    const currentEmail = getCurrentEmail(userData);
    if (emailToSave === currentEmail) {
      setError("El correo nuevo debe ser diferente al actual");
      return;
    }

    setIsSavingEmail(true);

    try {
      const result = await userService.updateUserEmail(userId, emailToSave);

      if (result && (result.success || result.status === "success" || result.ok === true)) {
        setSuccess("Correo actualizado exitosamente");
        setUserData({ ...userData, email: emailToSave, correo: emailToSave });
        setIsEditingEmail(false);
        scheduleTransientUpdate(() => setSuccess(""), 3000);
      } else {
        setError(result?.message || "Error al actualizar el correo");
      }
    } catch (err) {
      setError(err?.message || "Error al actualizar el correo");
      console.error(err);
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleEditAnticipation = () => {
    setIsEditingAnticipation(true);
    setError("");
    setSuccess("");
  };

  const handleCancelAnticipation = () => {
    setIsEditingAnticipation(false);
    const totalMinutes = parseAnticipationMinutes(userData);
    setAnticipationHours(Math.floor(totalMinutes / 60));
    setAnticipationMinutes(totalMinutes % 60);
    setError("");
  };

  const handleSaveAnticipation = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const hours = parseInt(anticipationHours) || 0;
    const minutes = parseInt(anticipationMinutes) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes < 0) {
      setError("El tiempo de anticipación no puede ser negativo");
      return;
    }

    if (totalMinutes > 1440) {
      setError("El tiempo de anticipación no puede ser mayor a 24 horas");
      return;
    }

    if (totalMinutes === parseAnticipationMinutes(userData)) {
      setError("El nuevo tiempo debe ser diferente al actual");
      return;
    }

    setIsSavingAnticipation(true);

    try {
      const result = await userService.updateReminderAnticipation(userId, totalMinutes);

      if (result && (result.success || result.status === "success" || result.ok === true)) {
        setSuccess("Tiempo de anticipación actualizado exitosamente");
        setUserData({
          ...userData,
          antelacionNotis: totalMinutes,
          tiempoMute: totalMinutes,
        });
        window.dispatchEvent(
          new CustomEvent("preferences:anticipation-updated", {
            detail: {
              userId,
              minutes: totalMinutes,
              at: new Date().toISOString(),
            },
          })
        );
        setIsEditingAnticipation(false);
        scheduleTransientUpdate(() => setSuccess(""), 3000);
      } else {
        setError(result?.message || "Error al actualizar el tiempo de anticipación");
      }
    } catch (err) {
      setError(err?.message || "Error al actualizar el tiempo de anticipación");
      console.error(err);
    } finally {
      setIsSavingAnticipation(false);
    }
  };

  return {
    userData,
    loading,
    error,
    success,
    isEditingEmail,
    newEmail,
    isSavingEmail,
    handleEditEmail,
    handleCancelEmail,
    handleSaveEmail,
    handleOnboardingEmailInput,
    muteInfo: notificationSilence.muteInfo,
    isSavingMute: notificationSilence.isSavingMute,
    showMuteConfirmModal: notificationSilence.showMuteConfirmModal,
    handleOpenMuteModal: notificationSilence.handleOpenMuteModal,
    handleCancelMute: notificationSilence.handleCancelMute,
    handleConfirmMute: notificationSilence.handleConfirmMute,
    handleUnmute: notificationSilence.handleUnmute,
    isEditingAnticipation,
    anticipationHours,
    setAnticipationHours,
    anticipationMinutes,
    setAnticipationMinutes,
    isSavingAnticipation,
    handleEditAnticipation,
    handleCancelAnticipation,
    handleSaveAnticipation,
  };
}

export default useUserPreferences;
