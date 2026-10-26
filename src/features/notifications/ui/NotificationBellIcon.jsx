/**
 * Icono de la campana según estado: normal, con no leídas o silenciada.
 * El SVG es decorativo; la información accesible va en el botón que lo envuelve.
 */

export default function NotificationBellIcon({ isMuted, unreadCount }) {
  if (isMuted) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-bell-off-icon lucide-bell-off"
        aria-hidden="true"
      >
        <path d="M13.73 21a2 2 0 0 1-3.46 0M18.63 13A17.887 17.887 0 0 1 18 8" />
        <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-1 9-2.16 10.332a1 1 0 0 0-.844 1.668c.536.256 1.1.656 1.626 1M3 3l18 18" />
      </svg>
    );
  }

  if (unreadCount > 0) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-bell-dot-icon lucide-bell-dot"
        aria-hidden="true"
      >
        <path d="M10.268 21a2 2 0 0 0 3.464 0" />
        <path d="M11.68 2.009A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673c-.824-.85-1.678-1.731-2.21-3.348" />
        <circle cx="18" cy="5" r="3" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-bell-icon lucide-bell"
      aria-hidden="true"
    >
      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </svg>
  );
}
