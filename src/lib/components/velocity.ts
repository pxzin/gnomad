/**
 * Velocity Component
 *
 * Movement vector for interpolation between tiles.
 * Used by gnomes during movement animation.
 */
export interface Velocity {
	/** Tiles per tick in X direction (usually fractional) */
	dx: number;
	/** Tiles per tick in Y direction (usually fractional) */
	dy: number;
}

/**
 * Create a new Velocity component.
 */
export function createVelocity(dx: number = 0, dy: number = 0): Velocity {
	return { dx, dy };
}

/**
 * Zero velocity constant.
 */
export const ZERO_VELOCITY: Velocity = { dx: 0, dy: 0 };
