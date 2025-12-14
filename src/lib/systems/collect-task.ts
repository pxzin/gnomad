/**
 * Collect Task System
 *
 * Handles gnomes collecting resources via Collect tasks.
 * When a gnome reaches a resource, it picks it up and adds to inventory.
 */

import type { GameState } from '$lib/game/state';
import type { Entity } from '$lib/ecs/types';
import {
	getEntitiesWithGnome,
	updateGnome,
	destroyEntity
} from '$lib/ecs/world';
import {
	GnomeState,
	hasInventorySpace,
	addToGnomeInventory,
	type Gnome
} from '$lib/components/gnome';
import { TaskType } from '$lib/components/task';

/**
 * Collect task system update.
 * Processes gnomes that are collecting resources.
 */
export function collectTaskSystem(state: GameState): GameState {
	let currentState = state;

	// Process all gnomes in Collecting state
	const gnomeEntities = getEntitiesWithGnome(currentState);
	for (const gnomeEntity of gnomeEntities) {
		const gnome = currentState.gnomes.get(gnomeEntity);
		if (!gnome || gnome.state !== GnomeState.Collecting) continue;

		currentState = processCollecting(currentState, gnomeEntity, gnome);
	}

	return currentState;
}

/**
 * Process collecting for a single gnome.
 */
function processCollecting(state: GameState, gnomeEntity: Entity, gnome: Gnome): GameState {
	if (!gnome.currentTaskId) {
		// No task, return to idle
		return updateGnome(state, gnomeEntity, (g) => ({
			...g,
			state: GnomeState.Idle
		}));
	}

	const task = state.tasks.get(gnome.currentTaskId);
	if (!task || task.type !== TaskType.Collect) {
		// Invalid task, return to idle
		return completeCollectTask(state, gnomeEntity, gnome.currentTaskId, null);
	}

	const resourceEntity = task.targetEntity;
	if (!resourceEntity) {
		// No target resource, complete task
		return completeCollectTask(state, gnomeEntity, gnome.currentTaskId, null);
	}

	const resource = state.resources.get(resourceEntity);
	if (!resource) {
		// Resource no longer exists (already collected), complete task
		return completeCollectTask(state, gnomeEntity, gnome.currentTaskId, null);
	}

	// Check if gnome has inventory space
	if (!hasInventorySpace(gnome)) {
		// Inventory full, can't collect - return to idle
		// Unassign task so another gnome can try
		const newTasks = new Map(state.tasks);
		newTasks.set(gnome.currentTaskId, {
			...task,
			assignedGnome: null
		});
		state = { ...state, tasks: newTasks };

		return updateGnome(state, gnomeEntity, (g) => ({
			...g,
			state: GnomeState.Idle,
			currentTaskId: null,
			path: null,
			pathIndex: 0
		}));
	}

	// Check if gnome is at the resource location
	const gnomePos = state.positions.get(gnomeEntity);
	const resourcePos = state.positions.get(resourceEntity);

	if (!gnomePos || !resourcePos) {
		return completeCollectTask(state, gnomeEntity, gnome.currentTaskId, null);
	}

	const gnomeTileX = Math.floor(gnomePos.x);
	const gnomeTileY = Math.floor(gnomePos.y);
	const resourceTileX = Math.floor(resourcePos.x);
	const resourceTileY = Math.floor(resourcePos.y);

	// Check if gnome is at or adjacent to resource (allow some tolerance)
	const isAtResource =
		Math.abs(gnomeTileX - resourceTileX) <= 1 && Math.abs(gnomeTileY - resourceTileY) <= 1;

	if (!isAtResource) {
		// Not at resource yet, keep walking (physics system handles movement)
		return state;
	}

	// Gnome is at resource - pick it up
	// Add to gnome inventory
	const updatedGnome = addToGnomeInventory(gnome, resource.type);
	if (!updatedGnome) {
		// Inventory full (shouldn't happen, we checked earlier)
		return completeCollectTask(state, gnomeEntity, gnome.currentTaskId, null);
	}

	// Update gnome with new inventory and complete task
	state = updateGnome(state, gnomeEntity, () => updatedGnome);

	// Remove resource entity from the world
	state = destroyEntity(state, resourceEntity);

	// Also remove from resources map explicitly (destroyEntity might not handle component-specific maps)
	const newResources = new Map(state.resources);
	newResources.delete(resourceEntity);
	state = { ...state, resources: newResources };

	// Complete the task
	return completeCollectTask(state, gnomeEntity, gnome.currentTaskId, resourceEntity);
}

/**
 * Complete a collect task and return gnome to idle.
 */
function completeCollectTask(
	state: GameState,
	gnomeEntity: Entity,
	taskEntity: Entity,
	_resourceEntity: Entity | null
): GameState {
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
