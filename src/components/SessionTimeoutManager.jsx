/**
 * Componente SessionTimeoutManager
 * 
 * Envuelve rutas protegidas/app y gestiona timeout por inactividad
 * Cierra sesión automáticamente a usuarios inactivos y opcionalmente muestra un modal de aviso
 * 
 * Uso:
 * <SessionTimeoutManager 
 *   timeoutMinutes={15}
 *   warningMinutes={10}
 *   children={<ProtectedRoutes />}
 * />
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthSession, isAuthenticated } from '../services/authSession';
import { useIdleTimeout } from '../hooks/useIdleTimeout';

export function SessionTimeoutManager({ 
  children, 
  timeoutMinutes = 15,
  warningMinutes = 10,
  showWarningModal = true,
}) {
  const navigate = useNavigate();
  const [showTimeout, setShowTimeout] = useState(false);
  const safeTimeoutMinutes = Math.max(0, timeoutMinutes);
  const safeWarningMinutes = Math.max(0, Math.min(warningMinutes, safeTimeoutMinutes));
  const warningTriggerMinutes = safeWarningMinutes;
  const warningWindowSeconds = Math.max(0, (safeTimeoutMinutes - safeWarningMinutes) * 60);
  const [timeRemaining, setTimeRemaining] = useState(warningWindowSeconds);

  // Aplicar timeout solo si el usuario está autenticado
  const isUserAuthenticated = isAuthenticated();

  // Manejar timeout de sesión
  const handleSessionTimeout = useCallback(() => {
    // Limpiar sesión
    clearAuthSession();
    
    // Ocultar modal de aviso
    setShowTimeout(false);

    // Redirigir al login
    navigate('/', { replace: true });
  }, [navigate]);

  const handleWarningTimeout = useCallback(() => {
    if (!showWarningModal || safeWarningMinutes <= 0) return;
    setShowTimeout(true);
    setTimeRemaining(warningWindowSeconds);
  }, [showWarningModal, safeWarningMinutes, warningWindowSeconds]);

  // Usar utilidad de timeout por inactividad
  const { reset: resetIdleTimer } = useIdleTimeout(
    safeTimeoutMinutes,
    handleSessionTimeout,
    isUserAuthenticated
  );

  // Timer de aviso de timeout, sincronizado con actividad del usuario
  const { reset: resetWarningTimer } = useIdleTimeout(
    warningTriggerMinutes,
    handleWarningTimeout,
    isUserAuthenticated && showWarningModal && safeWarningMinutes > 0
  );

  // Llevar control del tiempo restante para mostrar en el aviso
  useEffect(() => {
    if (!isUserAuthenticated || !showTimeout) return;

    const countdownInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;
        return next <= 0 ? 0 : next;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [showTimeout, isUserAuthenticated]);

  // Manejar cuando el usuario decide mantenerse conectado
  const handleStayLoggedIn = useCallback(() => {
    setShowTimeout(false);
    resetIdleTimer();
    resetWarningTimer();
  }, [resetIdleTimer, resetWarningTimer]);

  // Formatear segundos a MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {children}
      
      {/* Modal de aviso de timeout */}
      {showTimeout && isUserAuthenticated && showWarningModal && (
        <TimeoutWarningModal
          timeRemaining={timeRemaining}
          onStayLoggedIn={handleStayLoggedIn}
          onLogout={handleSessionTimeout}
          formatTime={formatTime}
        />
      )}
    </>
  );
}

/**
 * Componente TimeoutWarningModal
 * Muestra aviso antes del cierre de sesión automático
 */
function TimeoutWarningModal({ timeRemaining, onStayLoggedIn, onLogout, formatTime }) {
  return (
    <div className="session-timeout-overlay">
      <div className="session-timeout-modal">
        <div className="session-timeout-header">
          <h2>Sesión Expirando</h2>
        </div>
        
        <div className="session-timeout-body">
          <p>Tu sesión está a punto de expirar por inactividad.</p>
          <div className="session-timeout-timer">
            Tiempo restante: <strong>{formatTime(timeRemaining)}</strong>
          </div>
          <p className="session-timeout-subtext">
            Haz clic en "Mantener Sesión Iniciada" para continuar tu sesión.
          </p>
        </div>
        
        <div className="session-timeout-actions">
          <button 
            className="session-timeout-btn session-timeout-stay"
            onClick={onStayLoggedIn}
            title="Continuar con la sesión activa"
            aria-label="Mantener sesión"
            type="button"
          >
            Mantener Sesión
          </button>
          <button 
            className="session-timeout-btn session-timeout-logout"
            onClick={onLogout}
            title="Cerrar sesión actual"
            aria-label="Cerrar sesión"
            type="button"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
