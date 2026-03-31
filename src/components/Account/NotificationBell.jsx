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
import "../../styles/NotificationBell.css";

export default function NotificationBell({ userId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isMuted, setIsMuted] = useState(false);
    const containerRef = useRef(null);

    // Carga notificaciones inmediatamente y luego cada 10 segundos (polling)
    // También verifica el estado de silenciamiento
    useEffect(() => {
        async function load() {
            if (!userId) {
                setNotifications([]);
                setIsMuted(false);
                return;
            }
            try {
                const items = await NotificationService.getNotifications(userId);
                setNotifications(Array.isArray(items) ? items : []);
                
                // Verificar si las notificaciones están silenciadas
                const muteStatus = NotificationsSilenceService.getMuteStatus();
                setIsMuted(muteStatus !== null);
            } catch (err) {
                console.error("Error cargando notificaciones:", err);
                setNotifications([]);
            }
        }
        
        // Cargar de inmediato
        load();
        
        // Configurar intervalo para recargar cada 20 segundos
        const intervalId = setInterval(load, 20000);
        
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

    const unreadCount = notifications.filter(n => !n.read && !n.completed).length;

    const handleNotificationClick = (notificationId, notificationIndex) => {
        // Marcar notificación como leída
        setNotifications(prev => 
            prev.map((n, idx) => 
                idx === notificationIndex ? { ...n, read: true } : n
            )
        );
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
                    {isMuted && (
                        <li className="notification-status-muted">
                            <span className="muted-badge">Notificaciones silenciadas</span>
                        </li>
                    )}
                    {notifications.length > 0 ? (
                        notifications.map((n, idx) => (
                            <li 
                                key={n.id || n._id || JSON.stringify(n)} 
                                className={`notification-item ${n.read ? 'notification-read' : 'notification-unread'}`}
                                role="menuitem"
                                onClick={() => handleNotificationClick(n.id, idx)}
                            >
                                <span className="notification-title">{n.name || n.title || "(sin título)"}</span>
                                {n.description && <span className="notification-description">{n.description}</span>}
                                {n.dueDate && <span className="notification-date">{n.dueDate}</span>}
                            </li>
                        ))
                    ) : (
                        <li className="notification-empty">No hay notificaciones</li>
                    )}
                </ul>
            )}
        </div>
    );
}
