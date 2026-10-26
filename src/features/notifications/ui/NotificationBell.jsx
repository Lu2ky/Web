// ============================================================================
// Componente NotificationBell
// ============================================================================
// Campana de notificaciones con dropdown. El estado, el polling y las
// operaciones viven en `useNotifications`; aquí se compone la UI.
// ============================================================================

import "./NotificationBell.css";
import DropdownBase from "../../../shared/ui/DropdownBase";
import { useNotifications } from "../model/useNotifications";
import NotificationBellIcon from "./NotificationBellIcon";
import NotificationDropdownList from "./NotificationDropdownList";

export default function NotificationBell({ userId }) {
  const {
    isOpen,
    setIsOpen,
    openDropdownFromTrigger,
    orderedNotifications,
    unreadCount,
    isMuted,
    isDeletingAll,
    deletingNotificationId,
    handleDeleteAllNotifications,
    handleDeleteNotification,
  } = useNotifications(userId);

  return (
    <div className="notification-bell-container" data-onboarding-id="notification-bell">
      <DropdownBase
        open={isOpen}
        onOpenChange={(nextState) => setIsOpen(nextState)}
        roleMode="panel"
        className="notification-bell-dropdown-root"
        menuClassName="notification-dropdown-host"
        trigger={({ ref, isOpen: dropdownOpen }) => (
          <button
            ref={ref}
            type="button"
            className={`notification-bell-button ${isMuted ? "muted" : ""}`}
            onClick={openDropdownFromTrigger}
            aria-haspopup="menu"
            aria-expanded={dropdownOpen}
            aria-controls="notification-dropdown-list"
            title={isMuted ? "Notificaciones silenciadas" : "Notificaciones"}
          >
            <NotificationBellIcon isMuted={isMuted} unreadCount={unreadCount} />
            {!isMuted && unreadCount > 0 && (
              <span className="notification-bell-badge">{unreadCount}</span>
            )}
            {isMuted && <span className="notification-bell-muted-indicator">●</span>}
          </button>
        )}
      >
        {() => (
          <NotificationDropdownList
            orderedNotifications={orderedNotifications}
            unreadCount={unreadCount}
            isMuted={isMuted}
            isDeletingAll={isDeletingAll}
            deletingNotificationId={deletingNotificationId}
            onDeleteAll={handleDeleteAllNotifications}
            onDeleteNotification={handleDeleteNotification}
          />
        )}
      </DropdownBase>
    </div>
  );
}
