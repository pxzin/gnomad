/**
 * Physics System
 *
 * Handles gravity, movement, and collision detection.
 */

import type { GameState } from '$lib/game/state';
import { getEntitiesWithGnome, updatePosition, updateGnome, updateTask } from '$lib/ecs/world';
import { GnomeState, GNOME_SPEED } from '$lib/components/gnome';
import { TaskType } from '$lib/components/task';
import { isSolid } from '$lib/world-gen/generator';
import { GRAVITY, TERMINAL_VELOCITY, GNOME_IDLE_SPEED } from '$lib/config/physics';
import { GNOME_CLIMB_SPEED, FALL_DAMAGE_THRESHOLD, FALL_DAMAGE_PER_TILE, SURFACE_MODIFIERS } from '$lib/config/climbing';
import { applyDamage } from '$lib/systems/health';
import { getClimbableSurface } from '$lib/systems/climbing';
import { ClimbableSurfaceType } from '$lib/components/climbing';

/**
 * Physics system update.
 * Handles gravity and movement for all entities.
 */
export function physicsSystem(state: GameState): GameState {
	let currentState = state;

	// Process all gnomes
	const gnomeEntities = getEntitiesWithGnome(currentState);
	for (const entity of gnomeEntities) {
		currentState = updateGnomePhysics(currentState, entity);
	}

	return currentState;
}

/**
 * Check if gnome can hold position (has wall to climb or ground below).
 */
function canHoldPosition(state: GameState, x: number, y: number): boolean {
	const tileX = Math.floor(x);
	const tileY = Math.floor(y);

	// Has ground below
	if (isSolid(state, tileX, tileY + 1)) {
		return true;
	}

	// Has wall to hold onto (can climb)
	if (isSolid(state, tileX - 1, tileY) || isSolid(state, tileX + 1, tileY)) {
		return true;
	}

	return false;
}

/**
 * Update physics for a single gnome.
 */
function updateGnomePhysics(state: GameState, entity: number): GameState {
	const gnome = state.gnomes.get(entity);
	const position = state.positions.get(entity);
	const velocity = state.velocities.get(entity);

	if (!gnome || !position || !velocity) return state;

	let newVx = velocity.dx;
	let newVy = velocity.dy;
	let newX = position.x;
	let newY = position.y;
	let newState = gnome.state;
	let newFallStartY = gnome.fallStartY;

	// Handle walking and climbing movement FIRST (before gravity check)
	// This allows gnomes to climb without being interrupted by gravity
	const isMovingOnPath =
		(gnome.state === GnomeState.Walking || gnome.state === GnomeState.Climbing) &&
		gnome.path &&
		gnome.pathIndex < gnome.path.length;

	if (isMovingOnPath && gnome.path) {
		const target = gnome.path[gnome.pathIndex]!;
		const dx = target.x - newX;
		const dy = target.y - newY;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist < 0.1) {
			// Reached waypoint
			newX = target.x;
			newY = target.y;

			// Move to next waypoint
			const newPathIndex = gnome.pathIndex + 1;
			if (newPathIndex >= gnome.path.length) {
				// Path complete - determine state based on context
				if (gnome.depositTargetStorage) {
					// Walking to deposit - transition to Depositing
					newState = GnomeState.Depositing;
				} else if (gnome.currentTaskId) {
					const task = state.tasks.get(gnome.currentTaskId);
					if (task?.type === TaskType.Collect) {
						newState = GnomeState.Collecting;
					} else {
						newState = GnomeState.Mining;
					}
				} else {
					newState = GnomeState.Idle;
				}
			}

			// Update gnome path index
			state = updateGnome(state, entity, (g) => ({
				...g,
				pathIndex: newPathIndex,
				state: newState
			}));
		} else {
			// Move toward target - determine speed based on state
			let speed: number;
			if (gnome.state === GnomeState.Climbing) {
				// Apply surface-specific speed modifier
				const surface = getClimbableSurface(state, newX, newY);
				const modifier = SURFACE_MODIFIERS[surface].speedMultiplier;
				speed = GNOME_CLIMB_SPEED * modifier;
			} else if (gnome.idleBehavior?.type === 'strolling') {
				speed = GNOME_IDLE_SPEED;
			} else {
				speed = GNOME_SPEED;
			}
			const moveX = (dx / dist) * speed;
			const moveY = (dy / dist) * speed;
			newX += moveX;
			newY += moveY;
		}

		// Update position for walking gnome
		state = updatePosition(state, entity, () => ({ x: newX, y: newY }));

		// Update velocity
		const newVelocities = new Map(state.velocities);
		newVelocities.set(entity, { dx: newVx, dy: newVy });
		state = { ...state, velocities: newVelocities };

		// Update gnome state if changed
		if (newState !== gnome.state) {
			state = updateGnome(state, entity, (g) => ({ ...g, state: newState }));
		}

		return state;
	}

	// Check if gnome should fall
	// For stationary states (Mining, Collecting, Depositing, Idle), require ground below
	// For climbing, can hold onto walls
	const isStationaryState =
		gnome.state === GnomeState.Mining ||
		gnome.state === GnomeState.Collecting ||
		gnome.state === GnomeState.Depositing ||
		gnome.state === GnomeState.Idle;

	const hasGround = isSolid(state, Math.floor(newX), Math.floor(newY) + 1);
	const canHold = isStationaryState ? hasGround : canHoldPosition(state, newX, newY);

	if (!canHold && gnome.state !== GnomeState.Falling && gnome.state !== GnomeState.Walking) {
		// Start falling - record starting Y position for damage calculation
		// Also clear current task since we lost our position
		newState = GnomeState.Falling;
		newFallStartY = newY;
		newVy = 0;

		// Clear task and path when falling unexpectedly
		if (gnome.currentTaskId) {
			// Unassign the task so another gnome can take it
			const task = state.tasks.get(gnome.currentTaskId);
			if (task) {
				state = updateTask(state, gnome.currentTaskId, (t) => ({
					...t,
					assignedGnome: null
				}));
			}
		}
		if (gnome.currentTaskId || gnome.path) {
			state = updateGnome(state, entity, (g) => ({
				...g,
				currentTaskId: null,
				path: null,
				pathIndex: 0
			}));
		}
	}

	if (gnome.state === GnomeState.Falling) {
		// Apply gravity
		newVy = Math.min(newVy + GRAVITY, TERMINAL_VELOCITY);
		newY += newVy;

		// Check for landing - must have actual ground to land on
		const hasGroundBelow = isSolid(state, Math.floor(newX), Math.floor(newY) + 1);

		if (hasGroundBelow) {
			// Land on solid ground
			newY = Math.floor(newY);
			newVy = 0;
			newState = GnomeState.Idle;

			// Calculate fall damage if we have a recorded fall start
			if (newFallStartY !== null) {
				const fallDistance = newY - newFallStartY;
				if (fallDistance > FALL_DAMAGE_THRESHOLD) {
					const damage = (fallDistance - FALL_DAMAGE_THRESHOLD) * FALL_DAMAGE_PER_TILE;
					state = applyDamage(state, entity, damage);
					// Re-fetch gnome state as applyDamage may have changed it to Incapacitated
					const updatedGnome = state.gnomes.get(entity);
					if (updatedGnome) {
						newState = updatedGnome.state;
					}
				}
				// Clear fall start after landing
				newFallStartY = null;
			}
		}
	}

	// Update position
	state = updatePosition(state, entity, () => ({ x: newX, y: newY }));

	// Update velocity
	const newVelocities = new Map(state.velocities);
	newVelocities.set(entity, { dx: newVx, dy: newVy });
	state = { ...state, velocities: newVelocities };

	// Update gnome state and fallStartY if needed
	if (newState !== gnome.state || newFallStartY !== gnome.fallStartY) {
		state = updateGnome(state, entity, (g) => ({
			...g,
			state: newState,
			fallStartY: newFallStartY
		}));
	}

	return state;
}
