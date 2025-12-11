/**
 * Physics System
 *
 * Handles gravity, movement, and collision detection.
 */

import type { GameState } from '$lib/game/state';
import { getEntitiesWithGnome, updatePosition, updateGnome } from '$lib/ecs/world';
import { GnomeState, GNOME_SPEED } from '$lib/components/gnome';
import { isSolid } from '$lib/world-gen/generator';

/**
 * Gravity acceleration in tiles per tick squared.
 */
const GRAVITY = 0.02;

/**
 * Terminal velocity in tiles per tick.
 */
const TERMINAL_VELOCITY = 0.5;

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

	// Handle walking movement FIRST (before gravity check)
	// This allows gnomes to climb without being interrupted by gravity
	if (gnome.state === GnomeState.Walking && gnome.path && gnome.pathIndex < gnome.path.length) {
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
				// Path complete
				newState = gnome.currentTaskId ? GnomeState.Mining : GnomeState.Idle;
			}

			// Update gnome path index
			state = updateGnome(state, entity, (g) => ({
				...g,
				pathIndex: newPathIndex,
				state: newState
			}));
		} else {
			// Move toward target
			const moveX = (dx / dist) * GNOME_SPEED;
			const moveY = (dy / dist) * GNOME_SPEED;
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

	// Only apply gravity for Idle, Mining, or Falling gnomes
	const canHold = canHoldPosition(state, newX, newY);

	if (!canHold && gnome.state !== GnomeState.Falling && gnome.state !== GnomeState.Walking) {
		// Start falling
		newState = GnomeState.Falling;
		newVy = 0;
	}

	if (gnome.state === GnomeState.Falling) {
		// Apply gravity
		newVy = Math.min(newVy + GRAVITY, TERMINAL_VELOCITY);
		newY += newVy;

		// Check for landing (ground or can climb)
		if (canHoldPosition(state, newX, newY)) {
			// Land on surface or grab wall
			newY = Math.floor(newY);
			newVy = 0;
			newState = GnomeState.Idle;
		}
	}

	// Update position
	state = updatePosition(state, entity, () => ({ x: newX, y: newY }));

	// Update velocity
	const newVelocities = new Map(state.velocities);
	newVelocities.set(entity, { dx: newVx, dy: newVy });
	state = { ...state, velocities: newVelocities };

	// Update gnome state if needed
	if (newState !== gnome.state) {
		state = updateGnome(state, entity, (g) => ({ ...g, state: newState }));
	}

	return state;
}
