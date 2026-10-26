/**
 * Configuración de Sesión
 * 
 * Configuración centralizada para el comportamiento del timeout por inactividad
 * Modifica estos ajustes para adaptar los parámetros en toda la aplicación
 */

export const SESSION_CONFIG = {
  // Timeout principal por inactividad (en minutos)
  // Después de este tiempo sin actividad, la sesión expira
  IDLE_TIMEOUT_MINUTES: 15,

  // Minuto de aviso por inactividad (en minutos)
  // El modal aparece al minuto X de inactividad
  // Debe ser menor o igual que IDLE_TIMEOUT_MINUTES
  WARNING_BEFORE_LOGOUT_MINUTES: 10,

  // Mostrar/ocultar modal de aviso
  SHOW_TIMEOUT_WARNING: true,

  // Eventos a rastrear como actividad del usuario
  // Estos eventos reinician el temporizador de inactividad
  ACTIVITY_EVENTS: [
    'mousemove',      // Movimiento de mouse
    'keydown',        // Entrada de teclado
    'click',          // Clics de mouse/touch
    'touchstart',     // Eventos táctiles
    'scroll',         // Desplazamiento de página
    'wheel',          // Desplazamiento de rueda del mouse
  ],

  // Opcional: manejadores o callbacks personalizados
  // onBeforeLogout: () => { /* limpieza */ },
  // onLogoutComplete: () => { /* analítica */ },
};

/**
 * Función de utilidad para obtener configuración de timeout
 * Permite sobrescribir por entorno si es necesario
 */
export function getSessionConfig() {
  // Ejemplo: sobrescribir con variables de entorno si hace falta
  return {
    ...SESSION_CONFIG,
    // IDLE_TIMEOUT_MINUTES: parseInt(process.env.REACT_APP_IDLE_TIMEOUT || SESSION_CONFIG.IDLE_TIMEOUT_MINUTES),
    // WARNING_BEFORE_LOGOUT_MINUTES: parseInt(process.env.REACT_APP_WARNING_MINUTES || SESSION_CONFIG.WARNING_BEFORE_LOGOUT_MINUTES),
  };
}
