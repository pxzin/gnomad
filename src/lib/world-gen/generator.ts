/**
 * World Generator
 *
 * Generates the initial game world with terrain.
 * Uses seeded PRNG for deterministic generation.
 */

import type { GameState } from '$lib/game/state';
import { createEmptyState } from '$lib/game/state';
import { createRNG, noise1D } from './noise';
import { createEntity, addPosition, addTile } from '$lib/ecs/world';
import { TileType, createTile, createAirTile } from '$lib/components/tile';
import { createPosition } from '$lib/components/position';

/**
 * World generation configuration.
 */
export interface WorldConfig {
	/** World width in tiles */
	width: number;
	/** World height in tiles */
	height: number;
	/** Random seed for generation */
	seed: number;
	/** Surface level as percentage from top (0.0 - 1.0) */
	surfaceLevel: number;
	/** Dirt layer thickness in tiles */
	dirtDepth: number;
}

/**
 * Default world configuration for MVP.
 */
export const DEFAULT_WORLD_CONFIG: WorldConfig = {
	width: 100,
	height: 50,
	seed: Date.now(),
	surfaceLevel: 0.3, // Surface at 30% from top
	dirtDepth: 5
};

/**
 * Generate a complete game world.
 *
 * Terrain layers (from top to bottom):
 * - Air (above surface)
 * - Dirt (surface layer)
 * - Stone (below dirt)
 */
export function generateWorld(config: Partial<WorldConfig> = {}): GameState {
	const fullConfig: WorldConfig = { ...DEFAULT_WORLD_CONFIG, ...config };
	const { width, height, seed, surfaceLevel, dirtDepth } = fullConfig;

	// Create empty state
	let state = createEmptyState(seed, width, height);
	const rng = createRNG(seed);

	// Calculate base surface Y (in tile coordinates, 0 = top)
	const baseSurfaceY = Math.floor(height * surfaceLevel);

	// Generate terrain column by column
	for (let x = 0; x < width; x++) {
		// Add some noise to surface height for variation
		const surfaceNoise = noise1D(rng, x, 0.05);
		const surfaceVariation = Math.floor((surfaceNoise - 0.5) * 4); // -2 to +2 tiles
		const surfaceY = Math.max(2, Math.min(height - 10, baseSurfaceY + surfaceVariation));

		for (let y = 0; y < height; y++) {
			let tileType: TileType;

			if (y < surfaceY) {
				// Above surface: air
				tileType = TileType.Air;
			} else if (y < surfaceY + dirtDepth) {
				// Surface layer: dirt
				tileType = TileType.Dirt;
			} else {
				// Deep underground: stone
				tileType = TileType.Stone;
			}

			// Create tile entity
			const [newState, entity] = createEntity(state);
			state = newState;

			// Add position component
			state = addPosition(state, entity, createPosition(x, y));

			// Add tile component
			const tile = tileType === TileType.Air ? createAirTile() : createTile(tileType);
			state = addTile(state, entity, tile);

			// Store in tile grid
			state.tileGrid[y]![x] = entity;
		}
	}

	return state;
}

/**
 * Get the tile entity at a specific position.
 */
export function getTileAt(state: GameState, x: number, y: number): number | null {
	if (x < 0 || x >= state.worldWidth || y < 0 || y >= state.worldHeight) {
		return null;
	}
	return state.tileGrid[y]?.[x] ?? null;
}

/**
 * Check if a position is within world bounds.
 */
export function isInBounds(state: GameState, x: number, y: number): boolean {
	return x >= 0 && x < state.worldWidth && y >= 0 && y < state.worldHeight;
}

/**
 * Check if a tile position is solid (not air).
 */
export function isSolid(state: GameState, x: number, y: number): boolean {
	const entity = getTileAt(state, x, y);
	if (entity === null) return false;

	const tile = state.tiles.get(entity);
	return tile !== undefined && tile.type !== TileType.Air;
}

/**
 * Check if a tile position is walkable (air or passable).
 */
export function isWalkable(state: GameState, x: number, y: number): boolean {
	return !isSolid(state, x, y);
}

/**
 * Find the surface Y coordinate at a given X position.
 */
export function getSurfaceY(state: GameState, x: number): number {
	for (let y = 0; y < state.worldHeight; y++) {
		if (isSolid(state, x, y)) {
			return y;
		}
	}
	return state.worldHeight; // No surface found
}

/**
 * Find a valid spawn position for a gnome (on surface).
 */
export function findSpawnPosition(state: GameState): { x: number; y: number } | null {
	// Start from center and search outward
	const centerX = Math.floor(state.worldWidth / 2);

	for (let offset = 0; offset < state.worldWidth / 2; offset++) {
		for (const dx of offset === 0 ? [0] : [-offset, offset]) {
			const x = centerX + dx;
			if (x < 0 || x >= state.worldWidth) continue;

			const surfaceY = getSurfaceY(state, x);
			// Gnome spawns one tile above surface
			const spawnY = surfaceY - 1;

			if (spawnY >= 0 && !isSolid(state, x, spawnY)) {
				return { x, y: spawnY };
			}
		}
	}

	return null;
}
