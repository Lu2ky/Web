import { useState, useEffect, useRef } from "react";
import * as NotificationService from "../../services/notificationService";
import "../../styles/NotificationBell.css";

export default function NotificationBell({ userId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const containerRef = useRef(null);

    // carga notis cada 10 segundos
    useEffect(() => {
        async function load() {
            if (!userId) {
                setNotifications([]);
                return;
            }
            try {
                const items = await NotificationService.getNotifications(userId);
                setNotifications(Array.isArray(items) ? items : []);
            } catch (err) {
                console.error("Error cargando notificaciones:", err);
                setNotifications([]);
            }
        }
        
        // Load immediately
        load();
        
        // Set up interval to reload every 10 seconds
        const intervalId = setInterval(load, 10000);
        
        // Cleanup interval on unmount or when userId changes
        return () => clearInterval(intervalId);
    }, [userId]);

    // close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggle = () => setIsOpen((prev) => !prev);

    const unreadCount = notifications.filter(n => !n.read && !n.completed).length;

    const handleNotificationClick = (notificationId, notificationIndex) => {
        // Mark notification as read
        setNotifications(prev => 
            prev.map((n, idx) => 
                idx === notificationIndex ? { ...n, read: true } : n
            )
        );
    };

    return (
        <div className="notification-bell-container" ref={containerRef}>
            <button
                className="notification-bell-button"
                onClick={toggle}
                aria-haspopup="true"
                aria-expanded={isOpen}
                title="Notificaciones"
            >
                {/* bell SVG with dot for unread notifications */}
                {unreadCount > 0 ? (
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
                {unreadCount > 0 && <span className="notification-bell-badge">{unreadCount}</span>}
            </button>

            {isOpen && (
                <ul className="notification-dropdown" role="menu">
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
