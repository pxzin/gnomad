/**
 * Mining System
 *
 * Handles gnome mining behavior and tile destruction.
 */

import type { GameState } from '$lib/game/state';
import type { Entity } from '$lib/ecs/types';
import {
	getEntitiesWithGnome,
	updateGnome,
	updateTask,
	updateTile,
	createEntity,
	addPosition,
	addVelocity,
	addResource
} from '$lib/ecs/world';
import { GnomeState, GNOME_MINE_RATE } from '$lib/components/gnome';
import { TaskType } from '$lib/components/task';
import { TileType, createAirTile, isIndestructible } from '$lib/components/tile';
import { getTileAt, isWorldBoundary } from '$lib/world-gen/generator';
import { getResourceTypeForTile, createResource } from '$lib/components/resource';
import {
	getBackgroundTileAt,
	getBackgroundTile,
	updateBackgroundTile,
	removeBackgroundTile,
	setBackgroundTileAt
} from '$lib/ecs/background';

/**
 * Mining layer type.
 */
export type MiningLayer = 'foreground' | 'background';

/**
 * Mining target information.
 */
export interface MiningTarget {
	entity: Entity;
	layer: MiningLayer;
	x: number;
	y: number;
}

/**
 * Get the mineable target at a position.
 * Foreground takes priority over background.
 * Permanent backgrounds (Sky/Cave) are not mineable.
 */
export function getMiningTarget(state: GameState, x: number, y: number): MiningTarget | null {
	// Check foreground first
	const foregroundEntity = getTileAt(state, x, y);
	if (foregroundEntity !== null) {
		const tile = state.tiles.get(foregroundEntity);
		if (tile && tile.type !== TileType.Air && !isIndestructible(tile.type)) {
			// World boundaries are not mineable
			if (!isWorldBoundary(state, x, y)) {
				return { entity: foregroundEntity, layer: 'foreground', x, y };
			}
		}
	}

	// Check background if no mineable foreground
	const backgroundEntity = getBackgroundTileAt(state, x, y);
	if (backgroundEntity !== null) {
		const tile = getBackgroundTile(state, backgroundEntity);
		if (tile && tile.type !== TileType.Air && !isIndestructible(tile.type)) {
			return { entity: backgroundEntity, layer: 'background', x, y };
		}
	}

	// Permanent background not mineable
	return null;
}

/**
 * Mining system update.
 * Processes gnomes in mining state and updates tile durability.
 */
export function miningSystem(state: GameState): GameState {
	let currentState = state;

	// Process all gnomes in mining state
	const gnomeEntities = getEntitiesWithGnome(currentState);
	for (const entity of gnomeEntities) {
		const gnome = currentState.gnomes.get(entity);
		if (!gnome || gnome.state !== GnomeState.Mining) continue;

		currentState = processMining(currentState, entity);
	}

	return currentState;
}

/**
 * Process mining for a single gnome.
 */
function processMining(state: GameState, gnomeEntity: Entity): GameState {
	const gnome = state.gnomes.get(gnomeEntity);
	if (!gnome || !gnome.currentTaskId) return state;

	const task = state.tasks.get(gnome.currentTaskId);
	if (!task || task.type !== TaskType.Dig) return state;

	// Get mining target (foreground priority, then background)
	const target = getMiningTarget(state, task.targetX, task.targetY);
	if (!target) {
		// Nothing to mine at this position, complete task
		return completeTask(state, gnomeEntity, gnome.currentTaskId);
	}

	if (target.layer === 'foreground') {
		return mineForegroundTile(state, gnomeEntity, gnome.currentTaskId, task, target.entity);
	} else {
		return mineBackgroundTile(state, gnomeEntity, gnome.currentTaskId, task, target.entity);
	}
}

/**
 * Mine a foreground tile.
 */
function mineForegroundTile(
	state: GameState,
	gnomeEntity: Entity,
	taskEntity: Entity,
	task: { targetX: number; targetY: number },
	tileEntity: Entity
): GameState {
	const tile = state.tiles.get(tileEntity);
	if (!tile || tile.type === TileType.Air) {
		return completeTask(state, gnomeEntity, taskEntity);
	}

	// Reduce tile durability
	const newDurability = tile.durability - GNOME_MINE_RATE;

	if (newDurability <= 0) {
		// Drop resource before destroying tile
		state = dropResource(state, task.targetX, task.targetY, tile.type);

		// Tile destroyed - convert to air
		state = updateTile(state, tileEntity, () => createAirTile());

		// Update task progress to 100%
		state = updateTask(state, taskEntity, (t) => ({
			...t,
			progress: 100
		}));

		// Remove destroyed tile from selection
		const updatedSelectedTiles = state.selectedTiles.filter(
			(t) => t.x !== task.targetX || t.y !== task.targetY
		);
		if (updatedSelectedTiles.length !== state.selectedTiles.length) {
			state = { ...state, selectedTiles: updatedSelectedTiles };
		}

		// Complete task
		return completeTask(state, gnomeEntity, taskEntity);
	} else {
		// Update tile durability
		state = updateTile(state, tileEntity, (t) => ({
			...t,
			durability: newDurability
		}));

		// Update task progress
		const progress = Math.floor((1 - newDurability / tile.durability) * 100);
		state = updateTask(state, taskEntity, (t) => ({
			...t,
			progress: Math.min(99, progress) // Cap at 99 until complete
		}));

		return state;
	}
}

/**
 * Mine a background tile.
 * Background mining does NOT drop resources.
 */
function mineBackgroundTile(
	state: GameState,
	gnomeEntity: Entity,
	taskEntity: Entity,
	task: { targetX: number; targetY: number },
	bgTileEntity: Entity
): GameState {
	const tile = getBackgroundTile(state, bgTileEntity);
	if (!tile || tile.type === TileType.Air) {
		return completeTask(state, gnomeEntity, taskEntity);
	}

	// Reduce tile durability
	const newDurability = tile.durability - GNOME_MINE_RATE;

	if (newDurability <= 0) {
		// Background tile destroyed - remove from grid (NO resource drop)
		state = removeBackgroundTile(state, bgTileEntity);
		state = setBackgroundTileAt(state, task.targetX, task.targetY, null);

		// Update task progress to 100%
		state = updateTask(state, taskEntity, (t) => ({
			...t,
			progress: 100
		}));

		// Remove destroyed tile from selection
		const updatedSelectedTiles = state.selectedTiles.filter(
			(t) => t.x !== task.targetX || t.y !== task.targetY
		);
		if (updatedSelectedTiles.length !== state.selectedTiles.length) {
			state = { ...state, selectedTiles: updatedSelectedTiles };
		}

		// Complete task
		return completeTask(state, gnomeEntity, taskEntity);
	} else {
		// Update background tile durability
		state = updateBackgroundTile(state, bgTileEntity, (t) => ({
			...t,
			durability: newDurability
		}));

		// Update task progress
		const progress = Math.floor((1 - newDurability / tile.durability) * 100);
		state = updateTask(state, taskEntity, (t) => ({
			...t,
			progress: Math.min(99, progress)
		}));

		return state;
	}
}

/**
 * Complete a task and return gnome to idle.
 */
function completeTask(state: GameState, gnomeEntity: Entity, taskEntity: Entity): GameState {
	// Remove task
	const newTasks = new Map(state.tasks);
	newTasks.delete(taskEntity);
	state = { ...state, tasks: newTasks };

	// Return gnome to idle
	state = updateGnome(state, gnomeEntity, (g) => ({
		...g,
		state: GnomeState.Idle,
		currentTaskId: null,
		path: null,
		pathIndex: 0
	}));

	return state;
}

/**
 * Drop a resource entity at the specified tile position.
 * Creates a new resource entity based on the tile type.
 * Resource starts with isGrounded: false and will fall via resourcePhysicsSystem.
 */
function dropResource(state: GameState, x: number, y: number, tileType: TileType): GameState {
	const resourceType = getResourceTypeForTile(tileType);
	if (resourceType === null) {
		// Tile type doesn't drop a resource (Air, Bedrock)
		return state;
	}

	// Create resource entity with position and velocity for physics
	const [newState, entity] = createEntity(state);
	let result = addPosition(newState, entity, { x, y });
	result = addVelocity(result, entity, { dx: 0, dy: 0 });
	result = addResource(result, entity, createResource(resourceType));

	return result;
}
