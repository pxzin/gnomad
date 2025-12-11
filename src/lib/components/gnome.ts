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

/**
 * Gnome rendering color (MVP: colored square).
 */
export const GNOME_COLOR = 0x00ff00; // Bright green

/**
 * Gnome movement speed in tiles per tick.
 */
export const GNOME_SPEED = 0.1; // 6 tiles per second at 60 ticks/s

/**
 * Base mining rate (durability reduced per tick).
 */
export const GNOME_MINE_RATE = 1;
