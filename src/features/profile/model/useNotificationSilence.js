/**
 * Silenciamiento de notificaciones por correo.
 *
 * El estado real vive en el backend; aquí se guarda el reflejo local que usa la
 * UI y se confirma contra el servicio. Los mensajes se delegan al contenedor
 * para que decida cómo mostrarlos y cuándo limpiarlos.
 */

import { useState } from "react";
import * as notificationsSilenceService from "../../../shared/storage/notificationsSilence";

export function useNotificationSilence({ userId, onSuccess, onError }) {
  const [muteInfo, setMuteInfo] = useState(null);
  const [isSavingMute, setIsSavingMute] = useState(false);
  const [showMuteConfirmModal, setShowMuteConfirmModal] = useState(false);

  const loadMuteInfo = () => {
    try {
      setMuteInfo(notificationsSilenceService.getMuteStatus());
    } catch (err) {
      console.error("Error loading mute info:", err);
    }
  };

  const handleOpenMuteModal = () => {
    setShowMuteConfirmModal(true);
    onError("");
    onSuccess("");
  };

  const handleCancelMute = () => {
    setShowMuteConfirmModal(false);
  };

  const handleConfirmMute = async () => {
    setShowMuteConfirmModal(false);
    setIsSavingMute(true);
    onError("");
    onSuccess("");

    try {
      const result = await notificationsSilenceService.silenceNotifications(userId);

      if (result.success) {
        setMuteInfo(result.data);
        onSuccess("Notificaciones silenciadas correctamente");
      } else {
        onError(result.error || "Error al silenciar notificaciones");
      }
    } catch (err) {
      onError("Error al silenciar notificaciones");
      console.error(err);
    } finally {
      setIsSavingMute(false);
    }
  };

  const handleUnmute = async () => {
    setIsSavingMute(true);
    onError("");
    onSuccess("");

    try {
      const result = await notificationsSilenceService.activateNotifications(userId);

      if (result.success) {
        setMuteInfo(null);
        onSuccess("Notificaciones reactivadas correctamente");
      } else {
        onError(result.error || "Error al reactivar notificaciones");
      }
    } catch (err) {
      onError("Error al reactivar notificaciones");
      console.error(err);
    } finally {
      setIsSavingMute(false);
    }
  };

  return {
    muteInfo,
    isSavingMute,
    showMuteConfirmModal,
    loadMuteInfo,
    handleOpenMuteModal,
    handleCancelMute,
    handleConfirmMute,
    handleUnmute,
  };
}

export default useNotificationSilence;
