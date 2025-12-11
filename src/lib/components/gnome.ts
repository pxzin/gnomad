/**
 * Gnome Component
 *
 * Gnome entity data. The controllable colony unit.
 */

import type { Entity } from '$lib/ecs/types';
import type { Position } from './position';

/**
 * Gnome behavior states.
 */
export enum GnomeState {
	Idle = 'idle',
	Walking = 'walking',
	Mining = 'mining',
	Falling = 'falling'
}

/**
 * Gnome component data.
 */
export interface Gnome {
	/** Current behavior state */
	state: GnomeState;
	/** ID of the currently assigned task, or null if idle */
	currentTaskId: Entity | null;
	/** Current pathfinding result (array of positions to visit) */
	path: Position[] | null;
	/** Current index in the path array */
	pathIndex: number;
}

/**
 * Create a new Gnome component in idle state.
 */
export function createGnome(): Gnome {
	return {
		state: GnomeState.Idle,
		currentTaskId: null,
		path: null,
		pathIndex: 0
	};
}

// Re-export constants from centralized config (backwards compatibility)
export { GNOME_COLOR } from '$lib/config/colors';
export { GNOME_SPEED, GNOME_MINE_RATE } from '$lib/config/physics';
