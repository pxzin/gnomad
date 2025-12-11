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
			return processSelectTiles(state, command.tiles, command.addToSelection);

		case 'DIG':
			return processDig(state, command.tiles);

		case 'CANCEL_TASK':
			return processCancelTask(state, command.taskId);

		case 'PAN_CAMERA':
			return panCamera(state, command.dx, command.dy);

		case 'ZOOM_CAMERA':
			return zoomCamera(state, command.delta, command.mouseX, command.mouseY, command.screenWidth, command.screenHeight);

		case 'SET_SPEED':
			return processSetSpeed(state, command.speed);

		case 'TOGGLE_PAUSE':
			return processTogglePause(state);

		case 'SPAWN_GNOME':
			return processSpawnGnome(state);

		case 'SELECT_GNOMES':
			return processSelectGnomes(state, command.gnomeIds, command.addToSelection);

		case 'CLEAR_SELECTION':
			return processClearSelection(state);

		case 'CANCEL_DIG':
			return processCancelDig(state, command.tiles);

		default:
			return state;
	}
}

/**
 * Process SELECT_TILES command.
 */
function processSelectTiles(
	state: GameState,
	tiles: { x: number; y: number }[],
	addToSelection: boolean
): GameState {
	if (addToSelection) {
		// Add to existing selection, keep gnomes selected too
		const existingTiles = state.selectedTiles;
		const newTiles = [...existingTiles];

		for (const tile of tiles) {
			// Check if tile already selected
			const index = newTiles.findIndex((t) => t.x === tile.x && t.y === tile.y);
			if (index >= 0) {
				// Toggle off - remove from selection
				newTiles.splice(index, 1);
			} else {
				// Add to selection
				newTiles.push(tile);
			}
		}

		return {
			...state,
			selectedTiles: newTiles
			// Keep selectedGnomes as is when adding to selection
		};
	} else {
		// Replace selection, clear gnomes
		return {
			...state,
			selectedTiles: tiles,
			selectedGnomes: [] // Clear gnome selection when replacing
		};
	}
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

/**
 * Process SELECT_GNOMES command.
 */
function processSelectGnomes(
	state: GameState,
	gnomeIds: number[],
	addToSelection: boolean
): GameState {
	if (addToSelection) {
		// Toggle selection: add if not present, remove if present
		const newSelection = [...state.selectedGnomes];
		for (const gnomeId of gnomeIds) {
			const index = newSelection.indexOf(gnomeId);
			if (index >= 0) {
				// Remove from selection
				newSelection.splice(index, 1);
			} else {
				// Add to selection (if gnome exists)
				if (state.gnomes.has(gnomeId)) {
					newSelection.push(gnomeId);
				}
			}
		}
		return {
			...state,
			selectedGnomes: newSelection,
			// Clear tile selection when selecting gnomes
			selectedTiles: []
		};
	} else {
		// Replace selection with new gnomes (if they exist)
		const validGnomes = gnomeIds.filter((id) => state.gnomes.has(id));
		return {
			...state,
			selectedGnomes: validGnomes,
			// Clear tile selection when selecting gnomes
			selectedTiles: []
		};
	}
}

/**
 * Process CLEAR_SELECTION command.
 */
function processClearSelection(state: GameState): GameState {
	return {
		...state,
		selectedTiles: [],
		selectedGnomes: []
	};
}

/**
 * Process CANCEL_DIG command.
 * Cancels dig tasks for the specified tiles.
 */
function processCancelDig(
	state: GameState,
	tiles: { x: number; y: number }[]
): GameState {
	let currentState = state;

	for (const { x, y } of tiles) {
		// Find task at this position
		const taskId = findTaskAtPosition(currentState, x, y);
		if (taskId === null) continue;

		// Cancel the task (reuse existing processCancelTask logic)
		currentState = processCancelTask(currentState, taskId);
	}

	return currentState;
}
