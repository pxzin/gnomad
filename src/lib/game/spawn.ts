/**
 * Entity Spawning
 *
 * Functions for spawning game entities into the world.
 */

import type { GameState } from './state';
import { createEntity, addPosition, addGnome, addVelocity, addBuilding, addStorage, addHealth } from '$lib/ecs/world';
import { createPosition } from '$lib/components/position';
import { createVelocity } from '$lib/components/velocity';
import { createGnome, createHealth } from '$lib/components/gnome';
import { findSpawnPosition, getSurfaceY, isSolid } from '$lib/world-gen/generator';
import type { Entity } from '$lib/ecs/types';
import { BuildingType, createBuilding, BUILDING_CONFIG } from '$lib/components/building';
import { createStorage } from '$lib/components/storage';
import { GNOME_MAX_HEALTH } from '$lib/config/physics';

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
	updatedState = addHealth(updatedState, entity, createHealth(GNOME_MAX_HEALTH));

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

/**
 * Spawn a Storage building at a specific position.
 */
export function spawnStorageAt(
	state: GameState,
	x: number,
	y: number
): [GameState, Entity] {
	const [newState, entity] = createEntity(state);
	let updatedState = newState;

	// Add building component
	const building = createBuilding(BuildingType.Storage);
	updatedState = addBuilding(updatedState, entity, building);

	// Add position component
	const newPositions = new Map(updatedState.positions);
	newPositions.set(entity, { x, y });
	updatedState = { ...updatedState, positions: newPositions };

	// Add storage component
	const storage = createStorage();
	updatedState = addStorage(updatedState, entity, storage);

	return [updatedState, entity];
}

/**
 * Find a valid position for a Storage building near spawn.
 * Storage needs 2x2 air space with solid ground below.
 */
export function findStoragePosition(state: GameState): { x: number; y: number } | null {
	const config = BUILDING_CONFIG[BuildingType.Storage];
	const { width, height } = config;

	// Start from center and search outward (offset from gnome spawn)
	const centerX = Math.floor(state.worldWidth / 2) + 3; // Offset right from center

	for (let offset = 0; offset < state.worldWidth / 2; offset++) {
		for (const dx of offset === 0 ? [0] : [-offset, offset]) {
			const x = centerX + dx;
			if (x < 0 || x + width > state.worldWidth) continue;

			const surfaceY = getSurfaceY(state, x);
			// Storage sits on surface (top of building at surface level - height)
			const buildingY = surfaceY - height;

			if (buildingY < 0) continue;

			// Check if all tiles are air
			let validAir = true;
			for (let bx = 0; bx < width && validAir; bx++) {
				for (let by = 0; by < height && validAir; by++) {
					if (isSolid(state, x + bx, buildingY + by)) {
						validAir = false;
					}
				}
			}
			if (!validAir) continue;

			// Check if ground below is solid
			let validGround = true;
			for (let bx = 0; bx < width && validGround; bx++) {
				if (!isSolid(state, x + bx, surfaceY)) {
					validGround = false;
				}
			}
			if (!validGround) continue;

			return { x, y: buildingY };
		}
	}

	return null;
}

/**
 * Spawn a Storage building at the default location near spawn.
 */
export function spawnStorage(state: GameState): [GameState, Entity] | null {
	const pos = findStoragePosition(state);
	if (!pos) return null;

	return spawnStorageAt(state, pos.x, pos.y);
}
