/**
 * Idle Behavior Configuration
 *
 * Constants for gnome idle behavior system including weights and durations.
 */

/** Behavior selection weights (must sum to 100) */
export const IDLE_BEHAVIOR_WEIGHTS = {
	stroll: 70,
	socialize: 25,
	rest: 5
} as const;

/** Minimum rest duration in ticks (3 seconds at 60 TPS) */
export const REST_MIN_DURATION_TICKS = 180;

/** Maximum rest duration in ticks (8 seconds at 60 TPS) */
export const REST_MAX_DURATION_TICKS = 480;

/** Minimum socialization duration in ticks (5 seconds at 60 TPS) */
export const SOCIALIZE_MIN_DURATION_TICKS = 300;

/** Maximum socialization duration in ticks (15 seconds at 60 TPS) */
export const SOCIALIZE_MAX_DURATION_TICKS = 900;

/** Pause duration after completing a stroll (ticks) */
export const STROLL_PAUSE_DURATION_TICKS = 60;

/**
 * Whether idle behaviors (strolling, socializing, resting) can be interrupted
 * when a new task becomes available.
 *
 * When true: Gnomes performing idle behaviors will immediately stop and take
 * new tasks. Better for debugging and responsive gameplay.
 *
 * When false: Gnomes will finish their current idle behavior before accepting
 * new tasks. More realistic/organic feeling for final gameplay.
 */
export const INTERRUPT_IDLE_BEHAVIORS_FOR_TASKS = true;
