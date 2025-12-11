/**
 * HUD Component Types
 *
 * TypeScript interfaces for HUD Svelte component props and utility functions.
 */

import type { Entity } from '$lib/ecs/types';
import type { GameState } from '$lib/game/state';
import { GnomeState } from '$lib/components/gnome';
import { TileType, TILE_CONFIG } from '$lib/components/tile';

// ============================================================================
// TaskProgress
// ============================================================================

export interface TaskProgress {
	/** Tasks currently assigned to gnomes */
	assigned: number;
	/** Total number of tasks */
	total: number;
}

// ============================================================================
// SelectionInfo Types
// ============================================================================

export type SelectionInfo = SelectionNone | SelectionSingleTile | SelectionSingleGnome | SelectionMultiple;

export interface SelectionNone {
	type: 'none';
}

export interface SelectionSingleTile {
	type: 'single-tile';
	tile: TileInfo;
}

export interface SelectionSingleGnome {
	type: 'single-gnome';
	gnome: GnomeInfo;
}

export interface SelectionMultiple {
	type: 'multiple';
	tileCount: number;
	gnomeCount: number;
}

export interface TileInfo {
	/** Grid X coordinate */
	x: number;
	/** Grid Y coordinate */
	y: number;
	/** Tile type (dirt or stone) */
	tileType: TileType;
	/** Current durability */
	durability: number;
	/** Maximum durability for this tile type */
	maxDurability: number;
	/** Whether this tile has an active dig task */
	hasDigTask: boolean;
}

export interface GnomeInfo {
	/** Gnome entity ID */
	entity: Entity;
	/** Current gnome state */
	state: GnomeState;
	/** Description of current task, or null if idle */
	currentTask: string | null;
	/** Current tile position */
	position: { x: number; y: number };
}

// ============================================================================
// ActionButtonState
// ============================================================================

export interface ActionButtonState {
	/** Button label with shortcut (e.g., "Dig (D)") */
	label: string;
	/** Keyboard shortcut key */
	shortcut: string;
	/** Whether the button is enabled */
	enabled: boolean;
	/** Action type for command dispatch */
	action: 'dig' | 'cancel-dig';
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Compute TaskProgress from GameState.
 */
export function computeTaskProgress(state: GameState): TaskProgress {
	let assigned = 0;
	for (const task of state.tasks.values()) {
		if (task.assignedGnome !== null) {
			assigned++;
		}
	}
	return {
		assigned,
		total: state.tasks.size
	};
}

/**
 * Compute SelectionInfo from GameState.
 */
export function computeSelectionInfo(state: GameState): SelectionInfo {
	const { selectedTiles, selectedGnomes, tiles, tileGrid, gnomes, positions, tasks } = state;

	const tileCount = selectedTiles.length;
	const gnomeCount = selectedGnomes.length;

	// No selection
	if (tileCount === 0 && gnomeCount === 0) {
		return { type: 'none' };
	}

	// Multiple selection
	if (tileCount > 1 || gnomeCount > 1 || (tileCount > 0 && gnomeCount > 0)) {
		return { type: 'multiple', tileCount, gnomeCount };
	}

	// Single tile
	if (tileCount === 1 && gnomeCount === 0) {
		const coord = selectedTiles[0]!;
		const entityId = tileGrid[coord.y]?.[coord.x];
		const tile = entityId !== null && entityId !== undefined ? tiles.get(entityId) : null;

		if (tile) {
			// Check for dig task at this tile
			let hasDigTask = false;
			for (const task of tasks.values()) {
				if (task.targetX === coord.x && task.targetY === coord.y) {
					hasDigTask = true;
					break;
				}
			}

			return {
				type: 'single-tile',
				tile: {
					x: coord.x,
					y: coord.y,
					tileType: tile.type,
					durability: tile.durability,
					maxDurability: TILE_CONFIG[tile.type].durability,
					hasDigTask
				}
			};
		}
	}

	// Single gnome
	if (gnomeCount === 1 && tileCount === 0) {
		const gnomeId = selectedGnomes[0]!;
		const gnome = gnomes.get(gnomeId);
		const position = positions.get(gnomeId);

		if (gnome && position) {
			let currentTask: string | null = null;
			if (gnome.currentTaskId !== null) {
				const task = tasks.get(gnome.currentTaskId);
				if (task) {
					currentTask = `Dig at (${task.targetX}, ${task.targetY})`;
				}
			}

			return {
				type: 'single-gnome',
				gnome: {
					entity: gnomeId,
					state: gnome.state,
					currentTask,
					position: { x: Math.floor(position.x), y: Math.floor(position.y) }
				}
			};
		}
	}

	// Fallback
	return { type: 'none' };
}

/**
 * Compute ActionButtonState from GameState.
 */
export function computeActionButtonState(state: GameState): ActionButtonState {
	const { selectedTiles, selectedGnomes, tasks } = state;

	// Mixed selection or gnomes only = disabled
	if (selectedGnomes.length > 0) {
		return {
			label: 'Dig (D)',
			shortcut: 'D',
			enabled: false,
			action: 'dig'
		};
	}

	// No tiles selected = disabled
	if (selectedTiles.length === 0) {
		return {
			label: 'Dig (D)',
			shortcut: 'D',
			enabled: false,
			action: 'dig'
		};
	}

	// Check if all selected tiles have dig tasks
	let allHaveDigTask = true;

	for (const coord of selectedTiles) {
		let hasTask = false;
		for (const task of tasks.values()) {
			if (task.targetX === coord.x && task.targetY === coord.y) {
				hasTask = true;
				break;
			}
		}
		if (!hasTask) {
			allHaveDigTask = false;
			break;
		}
	}

	// All have dig task = Cancel Dig
	if (allHaveDigTask) {
		return {
			label: 'Cancel Dig (D)',
			shortcut: 'D',
			enabled: true,
			action: 'cancel-dig'
		};
	}

	// Some or none have dig task = Dig
	return {
		label: 'Dig (D)',
		shortcut: 'D',
		enabled: true,
		action: 'dig'
	};
}

/**
 * Get tile type display name.
 */
export function getTileTypeName(type: TileType): string {
	switch (type) {
		case TileType.Dirt:
			return 'Dirt';
		case TileType.Stone:
			return 'Stone';
		case TileType.Air:
			return 'Air';
		default:
			return 'Unknown';
	}
}

/**
 * Get gnome state display name.
 */
export function getGnomeStateName(state: GnomeState): string {
	switch (state) {
		case GnomeState.Idle:
			return 'Idle';
		case GnomeState.Walking:
			return 'Walking';
		case GnomeState.Mining:
			return 'Mining';
		case GnomeState.Falling:
			return 'Falling';
		default:
			return 'Unknown';
	}
}
