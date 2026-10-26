/**
 * Datos del perfil y cambio de contraseña.
 *
 * Valida la contraseña actual contra la API local y luego pide el cambio a la API.
 * El evento `onboarding:password-changed` mantiene el recorrido guiado.
 */

import { useEffect, useRef, useState } from "react";
import * as userService from "../../../shared/api/userService";
import { changePasswordLocal } from "../../../shared/api/authLocal";
import { getPasswordChecklist, validatePasswordComplexity } from "../lib/passwordPolicy";

export function useUserProfile(userId) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const transientTimersRef = useRef([]);

  const passwordChecklist = getPasswordChecklist(newPassword, currentPassword);
  const metCriteriaCount = passwordChecklist.filter((criteria) => criteria.met).length;
  const checklistProgress = Math.round(
    (metCriteriaCount / passwordChecklist.length) * 100
  );
  const showMatchHint = confirmPassword.length > 0;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const scheduleTransientUpdate = (callback, delayMs) => {
    const timerId = setTimeout(() => {
      callback();
      transientTimersRef.current = transientTimersRef.current.filter(
        (id) => id !== timerId
      );
    }, delayMs);

    transientTimersRef.current.push(timerId);
  };

  const loadUserData = async () => {
    if (!userId) {
      setError("Usuario no disponible");
      setLoading(false);
      return;
    }

    try {
      const data = await userService.getUserData(userId);
      if (data) {
        setUserData(Array.isArray(data) ? data[0] : data);
        setError("");
      } else {
        setError("No se pudieron cargar los datos del usuario");
      }
    } catch (err) {
      setError("Error al cargar los datos del usuario");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    return () => {
      transientTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      transientTimersRef.current = [];
    };
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword.trim()) {
      setError("Por favor ingresa tu contraseña actual");
      return;
    }

    if (!newPassword.trim()) {
      setError("Por favor ingresa una nueva contraseña");
      return;
    }

    if (!confirmPassword.trim()) {
      setError("Por favor confirma la nueva contraseña");
      return;
    }

    const policyError = validatePasswordComplexity(newPassword);
    if (policyError) {
      setError(policyError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (currentPassword === newPassword) {
      setError("La nueva contraseña debe ser diferente a la actual");
      return;
    }

    setIsChangingPassword(true);

    try {
      const authResult = await changePasswordLocal(currentPassword, newPassword);

      if (!authResult.success) {
        setError(authResult?.message || "La contraseña actual es incorrecta");
        return;
      }

      setSuccess("Contraseña cambiada exitosamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      window.dispatchEvent(new CustomEvent("onboarding:password-changed"));
      scheduleTransientUpdate(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Error al cambiar la contraseña");
      console.error(err);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return {
    userData,
    loading,
    error,
    success,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isChangingPassword,
    passwordChecklist,
    metCriteriaCount,
    checklistProgress,
    showMatchHint,
    passwordsMatch,
    handleChangePassword,
  };
}

export default useUserProfile;