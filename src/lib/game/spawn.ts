/**
 * Entity Spawning
 *
 * Functions for spawning game entities into the world.
 */

import type { GameState } from './state';
import { createEntity, addPosition, addGnome, addVelocity } from '$lib/ecs/world';
import { createPosition } from '$lib/components/position';
import { createVelocity } from '$lib/components/velocity';
import { createGnome } from '$lib/components/gnome';
import { findSpawnPosition } from '$lib/world-gen/generator';
import type { Entity } from '$lib/ecs/types';

/**
 * Spawn a gnome at a specific position.
 */
export function spawnGnomeAt(
	state: GameState,
	x: number,
	y: number
): [GameState, Entity] {
	const [newState, entity] = createEntity(state);
	let updatedState = newState;

	// Add components
	updatedState = addPosition(updatedState, entity, createPosition(x, y));
	updatedState = addVelocity(updatedState, entity, createVelocity());
	updatedState = addGnome(updatedState, entity, createGnome());

	return [updatedState, entity];
}

/**
 * Spawn a gnome at the default spawn location (surface center).
 */
export function spawnGnome(state: GameState): [GameState, Entity] | null {
	const spawnPos = findSpawnPosition(state);
	if (!spawnPos) return null;

	return spawnGnomeAt(state, spawnPos.x, spawnPos.y);
}

/**
 * Spawn multiple gnomes at the spawn location.
 */
export function spawnGnomes(state: GameState, count: number): [GameState, Entity[]] {
	const entities: Entity[] = [];
	let currentState = state;

	for (let i = 0; i < count; i++) {
		const result = spawnGnome(currentState);
		if (result) {
			const [newState, entity] = result;
			currentState = newState;
			entities.push(entity);
		}
	}

	return [currentState, entities];
}
