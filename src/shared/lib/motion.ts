/**
 * Spring configurations — Apple-style damping + response
 * Use with Motion/Framer Motion: { type: 'spring', damping: X, response: Y }
 */

export const springs = {
  /** Default UI — critically damped, no overshoot, graceful */
  critical:   { type: 'spring', damping: 1.0, response: 0.35 },

  /** Momentum interactions — flick, throw, slight bounce */
  momentum:   { type: 'spring', damping: 0.8,  response: 0.35 },

  /** Sheets, drawers, bottom sheets — slightly underdamped */
  sheet:      { type: 'spring', damping: 0.8,  response: 0.30 },

  /** Popovers, tooltips, dropdowns — fast, crisp */
  popover:    { type: 'spring', damping: 1.0, response: 0.25 },

  /** Full-screen modals — slightly slower, more deliberate */
  modal:      { type: 'spring', damping: 1.0, response: 0.40 },

  /** Press feedback — instant, critical */
  press:      { type: 'spring', damping: 1.0, response: 0.20 },
} as const;

export type SpringKey = keyof typeof springs;

/**
 * Velocity handoff — normalize absolute velocity to relative for spring APIs
 * relativeVelocity = velocityPxPerSec / distanceToTarget
 */
export function normalizeVelocity(velocityPxPerSec: number, distanceToTarget: number): number {
  if (distanceToTarget === 0) return 0;
  return velocityPxPerSec / distanceToTarget;
}

/**
 * Momentum projection — Apple's exponential decay formula
 * Projects where a flicked element will come to rest
 * decelerationRate ≈ 0.998 (standard scroll feel)
 */
export function projectMomentum(
  velocityPxPerSec: number,
  decelerationRate = 0.998
): number {
  return (velocityPxPerSec / 1000) * decelerationRate / (1 - decelerationRate);
}

/**
 * Rubber-band resistance — progressive resistance past boundary
 * constant ≈ 0.55 for standard feel
 */
export function rubberband(
  overshoot: number,
  dimension: number,
  constant = 0.55
): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/**
 * Spring config getter with reduced-motion support
 */
export function getSpringConfig(
  key: SpringKey,
  prefersReducedMotion: boolean
): typeof springs.critical | false {
  if (prefersReducedMotion) return false;
  return springs[key];
}