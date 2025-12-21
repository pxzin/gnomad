/**
 * Health System
 *
 * Manages gnome health, damage application, and recovery.
 */

import type { GameState } from '$lib/game/state';
import type { Entity } from '$lib/ecs/types';
import { GnomeState } from '$lib/components/gnome';
import { getEntitiesWithGnome, updateGnome, updateHealth, getHealth } from '$lib/ecs/world';
import { GNOME_MAX_HEALTH, HEALTH_RECOVERY_RATE } from '$lib/config/physics';

/**
 * Apply damage to a gnome's health.
 * Returns updated state with reduced health.
 * If health reaches 0 or below, transitions gnome to Incapacitated state.
 *
 * @param state - Current game state
 * @param entity - The gnome entity to damage
 * @param amount - Amount of damage to apply
 * @returns Updated game state
 */
export function applyDamage(state: GameState, entity: Entity, amount: number): GameState {
	const health = getHealth(state, entity);
	const gnome = state.gnomes.get(entity);

	if (!health || !gnome) return state;

	const newHealth = Math.max(0, health.current - amount);

	// Update health
	state = updateHealth(state, entity, (h) => ({
		...h,
		current: newHealth
	}));

	// Transition to Incapacitated if health reaches 0
	if (newHealth === 0) {
		state = updateGnome(state, entity, (g) => ({
			...g,
			state: GnomeState.Incapacitated,
			path: null,
			pathIndex: 0,
			currentTaskId: null,
			idleBehavior: null
		}));
	}

	return state;
}

/**
 * Health system update.
 * Handles health recovery for incapacitated gnomes.
 */
export function healthSystem(state: GameState): GameState {
	let currentState = state;

	const gnomeEntities = getEntitiesWithGnome(currentState);
	for (const entity of gnomeEntities) {
		currentState = updateGnomeHealth(currentState, entity);
	}

	return currentState;
}

/**
 * Update health for a single gnome.
 * Incapacitated gnomes slowly recover health.
 */
function updateGnomeHealth(state: GameState, entity: Entity): GameState {
	const gnome = state.gnomes.get(entity);
	const health = getHealth(state, entity);

	if (!gnome || !health) return state;

	// Only recover health if incapacitated
	if (gnome.state !== GnomeState.Incapacitated) return state;

	// Recover health over time
	const newHealth = Math.min(health.max, health.current + HEALTH_RECOVERY_RATE);

	state = updateHealth(state, entity, (h) => ({
		...h,
		current: newHealth
	}));

	// If fully recovered, transition to Idle
	if (newHealth >= GNOME_MAX_HEALTH) {
		state = updateGnome(state, entity, (g) => ({
			...g,
			state: GnomeState.Idle,
			fallStartY: null
		}));
	}

	return state;
}
