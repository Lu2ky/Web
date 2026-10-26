/**
 * Lista desplegable de notificaciones.
 *
 * Cada item se marca como leído al hacer click. Mientras hay una operación en
 * curso se bloquean los clicks para evitar dobles envíos.
 */

import getNotificationId from "../lib/notificationId";

export default function NotificationDropdownList({
  orderedNotifications,
  unreadCount,
  isMuted,
  isDeletingAll,
  deletingNotificationId,
  onDeleteAll,
  onDeleteNotification,
}) {
  return (
    <ul
      id="notification-dropdown-list"
      className="notification-dropdown"
      role="menu"
      data-onboarding-id="notification-dropdown"
    >
      {unreadCount > 0 && (
        <li className="notification-actions" role="none">
          <button
            type="button"
            className="notification-clear-all-button"
            onClick={onDeleteAll}
            disabled={isDeletingAll || Boolean(deletingNotificationId)}
          >
            {isDeletingAll ? "Marcando..." : "Marcar todas"}
          </button>
        </li>
      )}

      {isMuted && (
        <li className="notification-status-muted">
          <span className="muted-badge">Notificaciones silenciadas</span>
        </li>
      )}

      {orderedNotifications.length > 0 ? (
        orderedNotifications.map((notification) => {
          const notificationId = getNotificationId(notification);
          const isDeletingItem = deletingNotificationId === notificationId;

          return (
            <li
              key={notificationId || JSON.stringify(notification)}
              className={`notification-item ${
                notification.read ? "notification-read" : "notification-unread"
              } ${isDeletingItem ? "notification-deleting" : ""}`}
              role="menuitem"
              aria-disabled={isDeletingItem || isDeletingAll}
              onClick={() => {
                if (isDeletingItem || isDeletingAll) return;
                onDeleteNotification(notification);
              }}
            >
              <span className="notification-title">
                {notification.name || notification.title || "(sin título)"}
              </span>
              {notification.description && (
                <span className="notification-description">{notification.description}</span>
              )}
              {notification.dueDate && (
                <span className="notification-date">{notification.dueDate}</span>
              )}
            </li>
          );
        })
      ) : (
        <li className="notification-empty">No hay notificaciones</li>
      )}
    </ul>
  );
}
