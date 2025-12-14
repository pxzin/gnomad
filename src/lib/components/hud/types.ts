/**
 * HUD Component Types
 *
 * TypeScript interfaces for HUD Svelte component props and utility functions.
 */

import type { Entity } from '$lib/ecs/types';
import type { GameState, ResourceInventory } from '$lib/game/state';
import { GnomeState } from '$lib/components/gnome';
import { TileType, TILE_CONFIG, isIndestructible } from '$lib/components/tile';
import { isWorldBoundary } from '$lib/world-gen/generator';

// Re-export ResourceInventory for convenience
export type { ResourceInventory };

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
	/** Tile type (dirt, stone, bedrock) */
	tileType: TileType;
	/** Current durability */
	durability: number;
	/** Maximum durability for this tile type */
	maxDurability: number;
	/** Whether this tile has an active dig task */
	hasDigTask: boolean;
	/** Whether this tile cannot be mined */
	isIndestructible: boolean;
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

export interface AvailableActions {
	/** Can dig new tiles (tiles without dig tasks) */
	canDig: boolean;
	/** Can cancel existing dig tasks */
	canCancelDig: boolean;
	/** Tiles that can be dug (no existing task) */
	digTiles: { x: number; y: number }[];
	/** Tiles with existing dig tasks that can be cancelled */
	cancelTiles: { x: number; y: number }[];
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

			// Check if tile is indestructible (world boundary or bedrock type)
			const isBoundary = isWorldBoundary(state, coord.x, coord.y);
			const tileIsIndestructible = isBoundary || isIndestructible(tile.type);

			// Display as Bedrock if it's a world boundary
			const displayType = isBoundary ? TileType.Bedrock : tile.type;

			return {
				type: 'single-tile',
				tile: {
					x: coord.x,
					y: coord.y,
					tileType: displayType,
					durability: tileIsIndestructible ? Infinity : tile.durability,
					maxDurability: TILE_CONFIG[displayType].durability,
					hasDigTask,
					isIndestructible: tileIsIndestructible
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
 * @deprecated Use computeAvailableActions instead for multi-button support
 */
export function computeActionButtonState(state: GameState): ActionButtonState {
	const actions = computeAvailableActions(state);

	// Prefer dig action, fallback to cancel
	if (actions.canDig) {
		return {
			label: 'Dig (D)',
			shortcut: 'D',
			enabled: true,
			action: 'dig'
		};
	}

	if (actions.canCancelDig) {
		return {
			label: 'Cancel Dig (X)',
			shortcut: 'X',
			enabled: true,
			action: 'cancel-dig'
		};
	}

	return {
		label: 'Dig (D)',
		shortcut: 'D',
		enabled: false,
		action: 'dig'
	};
}

/**
 * Compute available actions from GameState.
 * Returns which actions are available and the tiles they apply to.
 */
export function computeAvailableActions(state: GameState): AvailableActions {
	const { selectedTiles, selectedGnomes, tasks } = state;

	const result: AvailableActions = {
		canDig: false,
		canCancelDig: false,
		digTiles: [],
		cancelTiles: []
	};

	// No actions if gnomes are selected or no tiles selected
	if (selectedGnomes.length > 0 || selectedTiles.length === 0) {
		return result;
	}

	// Build a set of tiles with existing dig tasks for O(1) lookup
	const tilesWithTasks = new Set<string>();
	for (const task of tasks.values()) {
		tilesWithTasks.add(`${task.targetX},${task.targetY}`);
	}

	// Categorize each selected tile
	for (const coord of selectedTiles) {
		// Skip indestructible tiles (world boundaries)
		if (isWorldBoundary(state, coord.x, coord.y)) continue;

		// Check tile type for bedrock
		const tileEntity = state.tileGrid[coord.y]?.[coord.x];
		if (tileEntity) {
			const tile = state.tiles.get(tileEntity);
			if (tile && isIndestructible(tile.type)) continue;
		}

		const key = `${coord.x},${coord.y}`;
		if (tilesWithTasks.has(key)) {
			result.cancelTiles.push({ x: coord.x, y: coord.y });
		} else {
			result.digTiles.push({ x: coord.x, y: coord.y });
		}
	}

	result.canDig = result.digTiles.length > 0;
	result.canCancelDig = result.cancelTiles.length > 0;

	return result;
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
		case TileType.Bedrock:
			return 'Bedrock';
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
