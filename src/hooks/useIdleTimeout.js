/**
 * useIdleTimeout Hook
 * 
 * Detects user inactivity and triggers automatic logout
 * Listens for: mousemove, keydown, click, touch, scroll events
 * 
 * @param {number} timeoutMinutes - Minutes of inactivity before logout (default: 15)
 * @param {function} onTimeout - Callback function when timeout occurs
 * @param {boolean} enabled - Whether the timeout is active (default: true)
 */

import { useEffect, useRef, useCallback } from 'react';

export function useIdleTimeout(timeoutMinutes = 2, onTimeout = null, enabled = true) {
  const timeoutIdRef = useRef(null);
  const isIdleRef = useRef(false);

  // Convert minutes to milliseconds
  const timeoutMilliseconds = timeoutMinutes * 60 * 1000;

  // Reset the idle timer
  const resetIdleTimer = useCallback(() => {
    // Clear existing timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    isIdleRef.current = false;

    // Only set new timeout if enabled
    if (!enabled) return;

    // Set new timeout
    timeoutIdRef.current = setTimeout(() => {
      isIdleRef.current = true;
      if (onTimeout && typeof onTimeout === 'function') {
        onTimeout();
      }
    }, timeoutMilliseconds);
  }, [timeoutMilliseconds, enabled, onTimeout]);

  useEffect(() => {
    if (!enabled) {
      // Clean up if disabled
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      return;
    }

    // Define event handler
    const handleUserActivity = () => {
      resetIdleTimer();
    };

    // List of events to track user activity
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll', 'wheel'];

    // Add event listeners (use passive: true for scroll/wheel performance)
    events.forEach((event) => {
      const isPassive = ['scroll', 'wheel'].includes(event);
      window.addEventListener(event, handleUserActivity, { passive: isPassive });
    });

    // Initialize timer on mount
    resetIdleTimer();

    // Cleanup function
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });

      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [enabled, resetIdleTimer]);

  // Expose method to manually check if idle
  const isIdle = useCallback(() => isIdleRef.current, []);

  // Expose method to manually reset timer
  const manualReset = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  return {
    isIdle,
    reset: manualReset,
    /** Milliseconds remaining before timeout (approximate) */
    getTimeRemaining: () => {
      if (!timeoutIdRef.current) return 0;
      // Note: This is approximate since we can't access Timer internals directly
      return timeoutMilliseconds;
    },
  };
}
