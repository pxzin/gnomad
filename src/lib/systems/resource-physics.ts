/**
 * Resource Physics System
 *
 * Handles gravity and grounding detection for dropped resources.
 * Resources fall until they land on solid ground.
 * Automatically creates Collect tasks when resources land.
 */

import type { GameState } from '$lib/game/state';
import { updatePosition, updateResource, createEntity, addTask } from '$lib/ecs/world';
import { isSolid } from '$lib/world-gen/generator';
import { GRAVITY, TERMINAL_VELOCITY } from '$lib/config/physics';
import { createCollectTask } from '$lib/components/task';

/**
 * Resource physics system update.
 * Applies gravity to non-grounded resources and detects landing.
 */
export function resourcePhysicsSystem(state: GameState): GameState {
	let currentState = state;

	// Process all resources
	for (const [entity, resource] of currentState.resources) {
		const position = currentState.positions.get(entity);
		const velocity = currentState.velocities.get(entity);

		if (!position || !velocity) continue;

		// Check if previously grounded resource should fall (support removed)
		if (resource.isGrounded) {
			const tileX = Math.floor(position.x);
			const tileY = Math.floor(position.y);

			// Check if there's still solid ground below
			if (!isSolid(currentState, tileX, tileY + 1)) {
				// Support removed - start falling again
				currentState = updateResource(currentState, entity, (r) => ({
					...r,
					isGrounded: false
				}));

				// Reset velocity for falling
				const newVelocities = new Map(currentState.velocities);
				newVelocities.set(entity, { dx: 0, dy: 0 });
				currentState = { ...currentState, velocities: newVelocities };
			}
			continue; // Skip physics for grounded resources
		}

		// Apply gravity to falling resources
		let newVy = velocity.dy + GRAVITY;
		newVy = Math.min(newVy, TERMINAL_VELOCITY);

		let newY = position.y + newVy;
		const tileX = Math.floor(position.x);
		const newTileY = Math.floor(newY);

		// Check for landing on solid ground
		if (isSolid(currentState, tileX, newTileY + 1)) {
			// Land on top of solid tile
			newY = newTileY;
			newVy = 0;

			// Mark as grounded
			currentState = updateResource(currentState, entity, (r) => ({
				...r,
				isGrounded: true
			}));

			// Create Collect task for this resource
			currentState = createCollectTaskForResource(currentState, entity, position.x, newY);
		}

		// Update position
		currentState = updatePosition(currentState, entity, () => ({
			x: position.x,
			y: newY
		}));

		// Update velocity
		const newVelocities = new Map(currentState.velocities);
		newVelocities.set(entity, { dx: velocity.dx, dy: newVy });
		currentState = { ...currentState, velocities: newVelocities };
	}

	return currentState;
}

/**
 * Create a Collect task for a grounded resource.
 */
function createCollectTaskForResource(
	state: GameState,
	resourceEntity: number,
	x: number,
	y: number
): GameState {
	// Check if a Collect task already exists for this resource
	for (const task of state.tasks.values()) {
		if (task.targetEntity === resourceEntity) {
			// Task already exists
			return state;
		}
	}

	// Create new Collect task
	const [newState, taskEntity] = createEntity(state);
	const task = createCollectTask(
		Math.floor(x),
		Math.floor(y),
		resourceEntity,
		newState.tick
	);
	return addTask(newState, taskEntity, task);
}
