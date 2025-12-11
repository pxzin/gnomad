/**
 * Mining System
 *
 * Handles gnome mining behavior and tile destruction.
 */

import type { GameState } from '$lib/game/state';
import type { Entity } from '$lib/ecs/types';
import { getEntitiesWithGnome, updateGnome, updateTask, updateTile } from '$lib/ecs/world';
import { GnomeState, GNOME_MINE_RATE } from '$lib/components/gnome';
import { TaskType } from '$lib/components/task';
import { TileType, createAirTile } from '$lib/components/tile';
import { getTileAt } from '$lib/world-gen/generator';

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

	// Get target tile
	const tileEntity = getTileAt(state, task.targetX, task.targetY);
	if (tileEntity === null) {
		// Tile doesn't exist, complete task
		return completeTask(state, gnomeEntity, gnome.currentTaskId);
	}

	const tile = state.tiles.get(tileEntity);
	if (!tile || tile.type === TileType.Air) {
		// Tile is already air, complete task
		return completeTask(state, gnomeEntity, gnome.currentTaskId);
	}

	// Reduce tile durability
	const newDurability = tile.durability - GNOME_MINE_RATE;

	if (newDurability <= 0) {
		// Tile destroyed - convert to air
		state = updateTile(state, tileEntity, () => createAirTile());

		// Update task progress to 100%
		state = updateTask(state, gnome.currentTaskId, (t) => ({
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
		return completeTask(state, gnomeEntity, gnome.currentTaskId);
	} else {
		// Update tile durability
		state = updateTile(state, tileEntity, (t) => ({
			...t,
			durability: newDurability
		}));

		// Update task progress
		const originalDurability = tile.durability + (100 - tile.durability);
		const progress = Math.floor((1 - newDurability / tile.durability) * 100);
		state = updateTask(state, gnome.currentTaskId, (t) => ({
			...t,
			progress: Math.min(99, progress) // Cap at 99 until complete
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
