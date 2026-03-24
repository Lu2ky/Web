/**
 * Componente SessionTimeoutManager
 * 
 * Envuelve rutas protegidas/app y gestiona timeout por inactividad
 * Cierra sesión automáticamente a usuarios inactivos y opcionalmente muestra un modal de aviso
 * 
 * Uso:
 * <SessionTimeoutManager 
 *   timeoutMinutes={15}
 *   warningMinutes={2}
 *   children={<ProtectedRoutes />}
 * />
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthSession, isAuthenticated } from '../services/authSession';
import { useIdleTimeout } from '../hooks/useIdleTimeout';

export function SessionTimeoutManager({ 
  children, 
  timeoutMinutes = 2,
  warningMinutes = 1,
  showWarningModal = true,
}) {
  const navigate = useNavigate();
  const [showTimeout, setShowTimeout] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(warningMinutes * 60);

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

  // Calcular cuándo mostrar aviso (timeoutMinutes - warningMinutes)
  const warningTriggerMinutes = timeoutMinutes - warningMinutes;

  // Usar utilidad de timeout por inactividad
  const { reset: resetIdleTimer } = useIdleTimeout(
    timeoutMinutes,
    handleSessionTimeout,
    isUserAuthenticated
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

  // Configurar temporizador de aviso (cuando el usuario está autenticado)
  useEffect(() => {
    if (!isUserAuthenticated || !showWarningModal) return;

    let warningTimeoutId = setTimeout(() => {
      setShowTimeout(true);
      setTimeRemaining(warningMinutes * 60);
    }, warningTriggerMinutes * 60 * 1000);

    return () => clearTimeout(warningTimeoutId);
  }, [isUserAuthenticated, warningTriggerMinutes, warningMinutes, showWarningModal]);

  // Manejar cuando el usuario decide mantenerse conectado
  const handleStayLoggedIn = useCallback(() => {
    setShowTimeout(false);
    resetIdleTimer();
  }, [resetIdleTimer]);

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
          >
            Mantener Sesión
          </button>
          <button 
            className="session-timeout-btn session-timeout-logout"
            onClick={onLogout}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
