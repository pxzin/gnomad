/**
 * Bounds System
 *
 * Removes entities that fall outside the world boundaries.
 * Prevents memory leaks from entities falling infinitely.
 */

import type { GameState } from '$lib/game/state';
import { destroyEntity } from '$lib/ecs/world';

/** Margin outside world bounds before entity is destroyed */
const DESTROY_MARGIN = 10;

/**
 * Bounds checking system.
 * Destroys gnomes that exit the world boundaries.
 */
export function boundsSystem(state: GameState): GameState {
	let currentState = state;
	const entitiesToDestroy: number[] = [];

	// Check all gnomes for out-of-bounds
	for (const [entity, position] of currentState.positions) {
		// Only check gnomes (other entities like tiles are static)
		if (!currentState.gnomes.has(entity)) continue;

		const isOutOfBounds =
			position.x < -DESTROY_MARGIN ||
			position.x > currentState.worldWidth + DESTROY_MARGIN ||
			position.y < -DESTROY_MARGIN ||
			position.y > currentState.worldHeight + DESTROY_MARGIN;

		if (isOutOfBounds) {
			entitiesToDestroy.push(entity);
		}
	}

	// Destroy out-of-bounds entities
	for (const entity of entitiesToDestroy) {
		// Cancel any task assigned to this gnome
		const gnome = currentState.gnomes.get(entity);
		if (gnome?.currentTaskId !== null && gnome?.currentTaskId !== undefined) {
			const task = currentState.tasks.get(gnome.currentTaskId);
			if (task) {
				// Unassign the task so another gnome can take it
				const newTasks = new Map(currentState.tasks);
				newTasks.set(gnome.currentTaskId, { ...task, assignedGnome: null });
				currentState = { ...currentState, tasks: newTasks };
			}
		}

		// Remove from selection if selected
		if (currentState.selectedGnomes.includes(entity)) {
			currentState = {
				...currentState,
				selectedGnomes: currentState.selectedGnomes.filter((e) => e !== entity)
			};
		}

		currentState = destroyEntity(currentState, entity);
	}

	return currentState;
}
