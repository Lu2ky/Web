/**
 * Session Configuration
 * 
 * Centralized configuration for idle session timeout behavior
 * Modify these settings to adjust timeout parameters across the application
 */

export const SESSION_CONFIG = {
  // Main idle timeout (in minutes)
  // After this duration with no user activity, session expires
  IDLE_TIMEOUT_MINUTES: 2,

  // Warning display time (in minutes)
  // Modal shows X minutes before actual timeout
  // MUST be less than IDLE_TIMEOUT_MINUTES
  WARNING_BEFORE_LOGOUT_MINUTES: 1,

  // Show/hide warning modal
  SHOW_TIMEOUT_WARNING: true,

  // Events to track as user activity
  // These events reset the inactivity timer
  ACTIVITY_EVENTS: [
    'mousemove',      // Mouse movement
    'keydown',        // Keyboard input
    'click',          // Mouse/touch clicks
    'touchstart',     // Touch events
    'scroll',         // Page scroll
    'wheel',          // Mouse wheel scroll
  ],

  // Optional: Custom event handlers or callbacks
  // onBeforeLogout: () => { /* cleanup */ },
  // onLogoutComplete: () => { /* analytics */ },
};

/**
 * Helper function to get timeout config
 * Allows environment-based overrides if needed
 */
export function getSessionConfig() {
  // Example: Override with environment variables if needed
  return {
    ...SESSION_CONFIG,
    // IDLE_TIMEOUT_MINUTES: parseInt(process.env.REACT_APP_IDLE_TIMEOUT || SESSION_CONFIG.IDLE_TIMEOUT_MINUTES),
    // WARNING_BEFORE_LOGOUT_MINUTES: parseInt(process.env.REACT_APP_WARNING_MINUTES || SESSION_CONFIG.WARNING_BEFORE_LOGOUT_MINUTES),
  };
}
