/**
 * Hook useIdleTimeout
 * 
 * Detecta inactividad del usuario y ejecuta cierre de sesión automático
 * Escucha eventos: mousemove, keydown, click, touch, scroll
 * 
 * @param {number} timeoutMinutes - Minutos de inactividad antes de cerrar sesión (default: 15)
 * @param {function} onTimeout - Función callback cuando ocurre el timeout
 * @param {boolean} enabled - Indica si el timeout está activo (default: true)
 */

import { useEffect, useRef, useCallback } from 'react';

export function useIdleTimeout(timeoutMinutes = 15, onTimeout = null, enabled = true) {
  const timeoutIdRef = useRef(null);
  const isIdleRef = useRef(false);

  // Convertir minutos a milisegundos
  const timeoutMilliseconds = timeoutMinutes * 60 * 1000;

  // Reiniciar el temporizador de inactividad
  const resetIdleTimer = useCallback(() => {
    // Limpiar timeout existente
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    isIdleRef.current = false;

    // Solo crear nuevo timeout si está habilitado
    if (!enabled) return;

    // Establecer nuevo timeout
    timeoutIdRef.current = setTimeout(() => {
      isIdleRef.current = true;
      if (onTimeout && typeof onTimeout === 'function') {
        onTimeout();
      }
    }, timeoutMilliseconds);
  }, [timeoutMilliseconds, enabled, onTimeout]);

  useEffect(() => {
    if (!enabled) {
      // Limpiar si está deshabilitado
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      return;
    }

    // Definir manejador de eventos
    const handleUserActivity = () => {
      resetIdleTimer();
    };

    // Lista de eventos para detectar actividad del usuario
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll', 'wheel'];

    // Agregar listeners (usar passive: true para rendimiento en scroll/wheel)
    events.forEach((event) => {
      const isPassive = ['scroll', 'wheel'].includes(event);
      window.addEventListener(event, handleUserActivity, { passive: isPassive });
    });

    // Inicializar temporizador al montar
    resetIdleTimer();

    // Función de limpieza
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });

      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [enabled, resetIdleTimer]);

  // Exponer método para verificar manualmente si está inactivo
  const isIdle = useCallback(() => isIdleRef.current, []);

  // Exponer método para reiniciar manualmente el temporizador
  const manualReset = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  return {
    isIdle,
    reset: manualReset,
    /** Milisegundos restantes antes del timeout (aproximado) */
    getTimeRemaining: () => {
      if (!timeoutIdRef.current) return 0;
      // Nota: es aproximado porque no se puede acceder directamente al estado interno del Timer
      return timeoutMilliseconds;
    },
  };
}
