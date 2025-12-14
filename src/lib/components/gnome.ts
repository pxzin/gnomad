/**
 * Gnome Component
 *
 * Gnome entity data. The controllable colony unit.
 */

import type { Entity } from '$lib/ecs/types';
import type { Position } from './position';
import { ResourceType } from './resource';

/**
 * Item in a gnome's personal inventory.
 */
export interface GnomeInventoryItem {
	/** Type of resource being carried */
	type: ResourceType;
}

/** Maximum items a gnome can carry */
export const GNOME_INVENTORY_CAPACITY = 5;

/**
 * Gnome behavior states.
 */
export enum GnomeState {
	Idle = 'idle',
	Walking = 'walking',
	Mining = 'mining',
	Falling = 'falling',
	Collecting = 'collecting',
	Depositing = 'depositing'
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
	/** Personal inventory of carried items (max 5) */
	inventory: GnomeInventoryItem[];
	/** Target storage entity for depositing (when walking to deposit) */
	depositTargetStorage?: Entity;
}

/**
 * Create a new Gnome component in idle state.
 */
export function createGnome(): Gnome {
	return {
		state: GnomeState.Idle,
		currentTaskId: null,
		path: null,
		pathIndex: 0,
		inventory: []
	};
}

/**
 * Check if gnome inventory has space.
 */
export function hasInventorySpace(gnome: Gnome): boolean {
	return gnome.inventory.length < GNOME_INVENTORY_CAPACITY;
}

/**
 * Add item to gnome inventory. Returns new gnome or null if full.
 */
export function addToGnomeInventory(gnome: Gnome, type: ResourceType): Gnome | null {
	if (!hasInventorySpace(gnome)) return null;
	return {
		...gnome,
		inventory: [...gnome.inventory, { type }]
	};
}

/**
 * Clear gnome inventory. Returns new gnome with empty inventory.
 */
export function clearGnomeInventory(gnome: Gnome): Gnome {
	return {
		...gnome,
		inventory: []
	};
}

// Re-export constants from centralized config (backwards compatibility)
export { GNOME_COLOR } from '$lib/config/colors';
export { GNOME_SPEED, GNOME_MINE_RATE } from '$lib/config/physics';
