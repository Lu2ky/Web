/**
 * Estado de la campana de notificaciones.
 *
 * Carga inicial + polling cada 20 segundos, marcado de leídas y descarte
 * optimista con confirmación contra el GET. La campana no conoce la API: todo
 * pasa por `NotificationService`.
 */

import { useCallback, useEffect, useState } from "react";
import * as NotificationService from "../../../shared/api/notificationService";
import * as NotificationsSilenceService from "../../../shared/storage/notificationsSilence";
import { getNotificationId } from "../lib/notificationId";

const POLL_INTERVAL_MS = 20000;

export function useNotifications(userId) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deletingNotificationId, setDeletingNotificationId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const refreshNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setIsMuted(false);
      return [];
    }

    try {
      const items = await NotificationService.getNotifications(userId);
      const normalized = Array.isArray(items) ? items : [];
      setNotifications(normalized);

      const muteStatus = NotificationsSilenceService.getMuteStatus();
      setIsMuted(muteStatus !== null);

      return normalized;
    } catch (err) {
      console.error("Error cargando notificaciones:", err);
      setNotifications([]);
      setIsMuted(false);
      return [];
    }
  }, [userId]);

  useEffect(() => {
    refreshNotifications();
    const intervalId = setInterval(refreshNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [refreshNotifications]);

  useEffect(() => {
    const handleCloseUnrelatedUi = (event) => {
      const allowOpenUi = Array.isArray(event?.detail?.allowOpenUi)
        ? event.detail.allowOpenUi
        : [];
      if (!allowOpenUi.includes("dropdown-notifications")) {
        setIsOpen(false);
      }
    };

    window.addEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
    return () =>
      window.removeEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
  }, []);

  const openDropdownFromTrigger = useCallback(() => {
    setIsOpen((prev) => {
      const nextState = !prev;
      if (nextState) {
        window.dispatchEvent(new CustomEvent("onboarding:notifications-opened"));
      }
      return nextState;
    });
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  // Las no leídas primero, conservando el orden original dentro de cada grupo.
  const orderedNotifications = [...notifications].sort((a, b) => {
    const aRead = Boolean(a?.read);
    const bRead = Boolean(b?.read);
    if (aRead === bRead) return 0;
    return aRead ? 1 : -1;
  });

  const tryMarkNotificationAsRead = useCallback(
    async (notificationId) => {
      if (!notificationId) return false;

      const result = await NotificationService.acknowledgeNotifications(
        [notificationId],
        userId
      );
      const refreshedItems = await refreshNotifications();

      const persisted = !refreshedItems.some((item) => {
        const currentId = getNotificationId(item);
        return currentId === notificationId && !item.read;
      });

      if (!persisted && result?.logicalError) {
        console.warn(
          "Backend reporto error logico y el GET confirmo que no persistio",
          { notificationId, response: result?.response }
        );
      }

      return persisted;
    },
    [refreshNotifications, userId]
  );

  const handleDeleteNotification = useCallback(
    async (notification) => {
      if (isDeletingAll || deletingNotificationId) return;

      const notificationId = getNotificationId(notification);
      if (!notificationId) {
        console.warn("Notificacion sin id, no se puede marcar como leida", notification);
        return;
      }

      try {
        setDeletingNotificationId(notificationId);
        // Optimista: el backend persiste el estado con acknowledge.
        setNotifications((prev) =>
          prev.map((item) =>
            getNotificationId(item) === notificationId ? { ...item, read: true } : item
          )
        );

        const deleted = await tryMarkNotificationAsRead(notificationId);
        if (!deleted) {
          console.warn("La notificacion individual sigue presente despues del borrado");
          await refreshNotifications();
        }
      } catch (err) {
        console.error("Error eliminando notificacion:", err, {
          notificationId,
          notification,
        });
        await refreshNotifications();
      } finally {
        setDeletingNotificationId(null);
      }
    },
    [deletingNotificationId, isDeletingAll, refreshNotifications, tryMarkNotificationAsRead]
  );

  const handleDeleteAllNotifications = useCallback(async () => {
    if (isDeletingAll || deletingNotificationId || unreadCount === 0) return;

    try {
      setIsDeletingAll(true);
      const notificationIds = [
        ...new Set(
          notifications
            .filter((notification) => !notification.read)
            .map((notification) => getNotificationId(notification))
            .filter(Boolean)
        ),
      ];

      if (notificationIds.length === 0) return;

      setNotifications((prev) =>
        prev.map((notification) =>
          notificationIds.includes(getNotificationId(notification))
            ? { ...notification, read: true }
            : notification
        )
      );

      const result = await NotificationService.acknowledgeNotifications(
        notificationIds,
        userId
      );

      const latestItems = await refreshNotifications();
      const stillVisibleCount = latestItems.filter((item) => {
        const currentId = getNotificationId(item);
        return notificationIds.includes(currentId) && !item.read;
      }).length;

      if (stillVisibleCount > 0) {
        console.warn("El backend devolvio notificaciones despues del borrado masivo");
      }

      if (stillVisibleCount > 0 && result?.logicalError) {
        console.warn("Backend reporto error logico en marcado masivo", {
          notificationIds,
          response: result?.response,
        });
      }
    } catch (err) {
      console.error("Error eliminando notificaciones:", err);
    } finally {
      setIsDeletingAll(false);
    }
  }, [
    deletingNotificationId,
    isDeletingAll,
    notifications,
    refreshNotifications,
    unreadCount,
    userId,
  ]);

  return {
    isOpen,
    setIsOpen,
    openDropdownFromTrigger,
    notifications,
    orderedNotifications,
    unreadCount,
    isMuted,
    isDeletingAll,
    deletingNotificationId,
    handleDeleteAllNotifications,
    handleDeleteNotification,
    refreshNotifications,
    getNotificationId,
  };
}

export default useNotifications;
