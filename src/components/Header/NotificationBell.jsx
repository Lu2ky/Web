// ============================================================================
// Componente NotificationBell
// ============================================================================
// Campana de notificaciones con dropdown.
// Realiza polling cada 20 segundos para obtener notificaciones del usuario.
// Cierra dropdown al hacer click fuera.
// Muestra indicador si las notificaciones están silenciadas.
// ============================================================================

import { useState, useEffect, useRef } from "react";
import * as NotificationService from "../../services/notificationService";
import * as NotificationsSilenceService from "../../services/notificationsSilenceService";
import "../../styles/Header/NotificationBell.css";

export default function NotificationBell({ userId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const [deletingNotificationId, setDeletingNotificationId] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const containerRef = useRef(null);

    function getNotificationId(notification) {
        if (!notification || typeof notification !== "object") return "";

        const directCandidates = [
            notification.id,
            notification._id,
            notification.N_idNotificacion,
            notification.N_idNotification,
            notification.notificationId,
            notification.IdNotificacion,
        ];

        for (const candidate of directCandidates) {
            if (candidate !== null && candidate !== undefined && String(candidate).trim() !== "") {
                return String(candidate).trim();
            }
        }

        for (const [key, value] of Object.entries(notification)) {
            if (
                value !== null &&
                value !== undefined &&
                /id/i.test(key) &&
                /(noti|notif|notification)/i.test(key) &&
                String(value).trim() !== ""
            ) {
                return String(value).trim();
            }
        }

        return "";
    }

    async function refreshNotifications() {
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
    }

    // Carga notificaciones inmediatamente y luego cada 20 segundos (polling)
    useEffect(() => {
        // Cargar de inmediato
        refreshNotifications();
        
        // Configurar intervalo para recargar cada 20 segundos
        const intervalId = setInterval(refreshNotifications, 20000);
        
        // Limpiar intervalo al desmontar o cuando cambie userId
        return () => clearInterval(intervalId);
    }, [userId]);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleCloseUnrelatedUi = (event) => {
            const allowOpenUi = Array.isArray(event?.detail?.allowOpenUi) ? event.detail.allowOpenUi : [];
            if (!allowOpenUi.includes("dropdown-notifications")) {
                setIsOpen(false);
            }
        };

        window.addEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
        return () => window.removeEventListener("onboarding:close-unrelated-ui", handleCloseUnrelatedUi);
    }, []);

    const toggle = () => {
        setIsOpen((prev) => {
            const nextState = !prev;
            if (nextState) {
                window.dispatchEvent(new CustomEvent("onboarding:notifications-opened"));
            }
            return nextState;
        });
    };

    const unreadCount = notifications.filter((n) => !n.read).length;
    const orderedNotifications = [...notifications].sort((a, b) => {
        const aRead = Boolean(a?.read);
        const bRead = Boolean(b?.read);
        if (aRead === bRead) return 0;
        return aRead ? 1 : -1;
    });

    const tryMarkNotificationAsRead = async (notificationId) => {
        if (!notificationId) {
            return false;
        }

        const result = await NotificationService.acknowledgeNotifications([notificationId], userId);
        const refreshedItems = await refreshNotifications();

        const persisted = !refreshedItems.some((item) => {
            const currentId = getNotificationId(item);
            return currentId === notificationId && !item.read;
        });

        if (!persisted && result?.logicalError) {
            console.warn("Backend reporto error logico y el GET confirmo que no persistio", {
                notificationId,
                response: result?.response,
            });
        }

        return persisted;
    };

    const handleDeleteNotification = async (notification) => {
        if (isDeletingAll || deletingNotificationId) {
            return;
        }

        const notificationId = getNotificationId(notification);
        if (!notificationId) {
            console.warn("Notificacion sin N_idNotificacion, no se puede marcar como leida", notification);
            return;
        }

        try {
            setDeletingNotificationId(notificationId);
            // Marcar como leida en UI inmediatamente; el backend persiste este estado via POST.
            setNotifications((prev) =>
                prev.map((n) =>
                    getNotificationId(n) === notificationId ? { ...n, read: true } : n
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
    };

    const handleDeleteAllNotifications = async () => {
        if (isDeletingAll || deletingNotificationId || unreadCount === 0) {
            return;
        }

        try {
            setIsDeletingAll(true);
            const notificationIds = [...new Set(
                notifications
                    .filter((notification) => !notification.read)
                    .map((notification) => getNotificationId(notification))
                    .filter(Boolean)
            )];

            if (notificationIds.length === 0) {
                return;
            }

            setNotifications((prev) =>
                prev.map((notification) =>
                    notificationIds.includes(getNotificationId(notification))
                        ? { ...notification, read: true }
                        : notification
                )
            );

            const result = await NotificationService.acknowledgeNotifications(notificationIds, userId);

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
    };

    return (
        <div className="notification-bell-container" ref={containerRef} data-onboarding-id="notification-bell">
            <button
                className={`notification-bell-button ${isMuted ? 'muted' : ''}`}
                onClick={toggle}
                aria-haspopup="true"
                aria-expanded={isOpen}
                title={isMuted ? "Notificaciones silenciadas" : "Notificaciones"}
            >
                {/* SVG de campana con punto para notificaciones no leídas */}
                {isMuted ? (
                    // Campana silenciada con tacha
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell-off-icon lucide-bell-off">
                        <path d="M13.73 21a2 2 0 0 1-3.46 0M18.63 13A17.887 17.887 0 0 1 18 8"/>
                        <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-1 9-2.16 10.332a1 1 0 0 0-.844 1.668c.536.256 1.1.656 1.626 1M3 3l18 18"/>
                    </svg>
                ) : unreadCount > 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell-dot-icon lucide-bell-dot">
                        <path d="M10.268 21a2 2 0 0 0 3.464 0"/>
                        <path d="M11.68 2.009A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673c-.824-.85-1.678-1.731-2.21-3.348"/>
                        <circle cx="18" cy="5" r="3"/>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell-icon lucide-bell">
                        <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                        <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
                    </svg>
                )}
                {!isMuted && unreadCount > 0 && <span className="notification-bell-badge">{unreadCount}</span>}
                {isMuted && <span className="notification-bell-muted-indicator">●</span>}
            </button>

            {isOpen && (
                <ul className="notification-dropdown" role="menu" data-onboarding-id="notification-dropdown">
                    {unreadCount > 0 && (
                        <li className="notification-actions" role="none">
                            <button
                                type="button"
                                className="notification-clear-all-button"
                                onClick={handleDeleteAllNotifications}
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
                        orderedNotifications.map((n) => {
                            const notificationId = getNotificationId(n);
                            const isDeletingItem = deletingNotificationId === notificationId;

                            return (
                                <li
                                    key={notificationId || JSON.stringify(n)}
                                    className={`notification-item ${n.read ? 'notification-read' : 'notification-unread'} ${isDeletingItem ? 'notification-deleting' : ''}`}
                                    role="menuitem"
                                    aria-disabled={isDeletingItem || isDeletingAll}
                                    onClick={() => {
                                        if (isDeletingItem || isDeletingAll) return;
                                        handleDeleteNotification(n);
                                    }}
                                >
                                    <span className="notification-title">{n.name || n.title || "(sin título)"}</span>
                                    {n.description && <span className="notification-description">{n.description}</span>}
                                    {n.dueDate && <span className="notification-date">{n.dueDate}</span>}
                                </li>
                            );
                        })
                    ) : (
                        <li className="notification-empty">No hay notificaciones</li>
                    )}
                </ul>
            )}
        </div>
    );
};
