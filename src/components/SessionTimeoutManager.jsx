/**
 * SessionTimeoutManager Component
 * 
 * Wraps protected routes/app and manages idle session timeout
 * Automatically logs out inactive users and optionally shows a warning modal
 * 
 * Usage:
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

  // Only apply timeout if user is authenticated
  const isUserAuthenticated = isAuthenticated();

  // Handle session timeout
  const handleSessionTimeout = useCallback(() => {
    // Clear session
    clearAuthSession();
    
    // Hide warning modal
    setShowTimeout(false);

    // Redirect to login
    navigate('/', { replace: true });
  }, [navigate]);

  // Calculate when to show warning (timeoutMinutes - warningMinutes)
  const warningTriggerMinutes = timeoutMinutes - warningMinutes;

  // Use idle timeout hook
  const { reset: resetIdleTimer } = useIdleTimeout(
    timeoutMinutes,
    handleSessionTimeout,
    isUserAuthenticated
  );

  // Track remaining time for warning display
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

  // Set up warning timer (when user is authenticated)
  useEffect(() => {
    if (!isUserAuthenticated || !showWarningModal) return;

    let warningTimeoutId = setTimeout(() => {
      setShowTimeout(true);
      setTimeRemaining(warningMinutes * 60);
    }, warningTriggerMinutes * 60 * 1000);

    return () => clearTimeout(warningTimeoutId);
  }, [isUserAuthenticated, warningTriggerMinutes, warningMinutes, showWarningModal]);

  // Handle user choosing to stay logged in
  const handleStayLoggedIn = useCallback(() => {
    setShowTimeout(false);
    resetIdleTimer();
  }, [resetIdleTimer]);

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {children}
      
      {/* Timeout Warning Modal */}
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
 * TimeoutWarningModal Component
 * Displays warning before automatic logout
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
