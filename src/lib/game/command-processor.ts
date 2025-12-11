/**
 * Command Processor
 *
 * Processes player commands and updates game state.
 * All command handling is deterministic for replay support.
 */

import type { GameState } from './state';
import { panCamera, zoomCamera } from './state';
import type { Command, GameSpeed } from './commands';
import { createDigTask, TaskPriority } from '$lib/components/task';
import { createEntity, addTask } from '$lib/ecs/world';
import { getTileAt, isSolid } from '$lib/world-gen/generator';
import { TileType } from '$lib/components/tile';
import { spawnGnome } from './spawn';

/**
 * Process a single command and return updated state.
 */
export function processCommand(state: GameState, command: Command): GameState {
	switch (command.type) {
		case 'SELECT_TILES':
			return processSelectTiles(state, command.tiles);

		case 'DIG':
			return processDig(state, command.tiles);

		case 'CANCEL_TASK':
			return processCancelTask(state, command.taskId);

		case 'PAN_CAMERA':
			return panCamera(state, command.dx, command.dy);

		case 'ZOOM_CAMERA':
			return zoomCamera(state, command.delta);

		case 'SET_SPEED':
			return processSetSpeed(state, command.speed);

		case 'TOGGLE_PAUSE':
			return processTogglePause(state);

		case 'SPAWN_GNOME':
			return processSpawnGnome(state);

		default:
			return state;
	}
}

/**
 * Process SELECT_TILES command.
 */
function processSelectTiles(
	state: GameState,
	tiles: { x: number; y: number }[]
): GameState {
	return {
		...state,
		selectedTiles: tiles
	};
}

/**
 * Process DIG command.
 * Creates dig tasks for valid tiles.
 */
function processDig(
	state: GameState,
	tiles: { x: number; y: number }[]
): GameState {
	let currentState = state;

	for (const { x, y } of tiles) {
		// Check if tile is valid and diggable
		const tileEntity = getTileAt(currentState, x, y);
		if (tileEntity === null) continue;

		const tile = currentState.tiles.get(tileEntity);
		if (!tile || tile.type === TileType.Air) continue;

		// Check if task already exists for this tile
		const existingTask = findTaskAtPosition(currentState, x, y);
		if (existingTask !== null) continue;

		// Create dig task entity
		const [newState, taskEntity] = createEntity(currentState);
		currentState = newState;

		// Add task component
		const task = createDigTask(x, y, TaskPriority.Normal, currentState.tick);
		currentState = addTask(currentState, taskEntity, task);
	}

	// Clear selection after creating tasks
	return {
		...currentState,
		selectedTiles: []
	};
}

/**
 * Find a task targeting a specific position.
 */
function findTaskAtPosition(
	state: GameState,
	x: number,
	y: number
): number | null {
	for (const [entity, task] of state.tasks) {
		if (task.targetX === x && task.targetY === y) {
			return entity;
		}
	}
	return null;
}

/**
 * Process CANCEL_TASK command.
 */
function processCancelTask(state: GameState, taskId: number): GameState {
	const task = state.tasks.get(taskId);
	if (!task) return state;

	// If task is assigned to a gnome, clear the gnome's task reference
	if (task.assignedGnome !== null) {
		const gnome = state.gnomes.get(task.assignedGnome);
		if (gnome && gnome.currentTaskId === taskId) {
			const newGnomes = new Map(state.gnomes);
			newGnomes.set(task.assignedGnome, {
				...gnome,
				currentTaskId: null,
				path: null,
				pathIndex: 0
			});
			state = { ...state, gnomes: newGnomes };
		}
	}

	// Remove task
	const newTasks = new Map(state.tasks);
	newTasks.delete(taskId);

	return { ...state, tasks: newTasks };
}

/**
 * Process SET_SPEED command.
 */
function processSetSpeed(state: GameState, speed: GameSpeed): GameState {
	return {
		...state,
		speed
	};
}

/**
 * Process TOGGLE_PAUSE command.
 */
function processTogglePause(state: GameState): GameState {
	return {
		...state,
		isPaused: !state.isPaused
	};
}

/**
 * Process SPAWN_GNOME command.
 */
function processSpawnGnome(state: GameState): GameState {
	const result = spawnGnome(state);
	if (result) {
		return result[0];
	}
	return state;
}
