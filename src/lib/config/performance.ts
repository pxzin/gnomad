/**
 * Performance Configuration
 *
 * Tuning constants for optimization systems.
 */

/** Ticks between task assignment runs (60 ticks = 1 second) */
export const TASK_ASSIGNMENT_THROTTLE_TICKS = 10;

/** Max pathfinding attempts per gnome per assignment cycle */
export const MAX_PATHFIND_ATTEMPTS_PER_GNOME = 10;

/** Maximum paths to cache */
export const PATH_CACHE_MAX_SIZE = 1000;

/** Path cache entry TTL in ticks (5 seconds at 60 TPS) */
export const PATH_CACHE_TTL_TICKS = 300;

/**
 * Maximum ticks to process per frame.
 * Prevents CPU overload at high game speeds (2x, 3x).
 * At 60 TPS with 3x speed, this limits to ~180 TPS instead of uncapped.
 */
export const MAX_TICKS_PER_FRAME = 4;
