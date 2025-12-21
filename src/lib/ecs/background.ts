/**
 * ECS Background
 *
 * Background tile entity management functions.
 * All functions are pure and return new state.
 */

import type { Entity } from './types';
import type { GameState } from '$lib/game/state';
import type { BackgroundTile } from '$lib/components/tile';

/**
 * Get background tile entity at grid position.
 */
export function getBackgroundTileAt(state: GameState, x: number, y: number): Entity | null {
	if (x < 0 || x >= state.worldWidth || y < 0 || y >= state.worldHeight) {
		return null;
	}
	return state.backgroundTileGrid[y]?.[x] ?? null;
}

/**
 * Set background tile entity at grid position.
 */
export function setBackgroundTileAt(
	state: GameState,
	x: number,
	y: number,
	entity: Entity | null
): GameState {
	if (x < 0 || x >= state.worldWidth || y < 0 || y >= state.worldHeight) {
		return state;
	}

	const newGrid = state.backgroundTileGrid.map((row, rowY) =>
		rowY === y ? row.map((cell, cellX) => (cellX === x ? entity : cell)) : row
	);
	return { ...state, backgroundTileGrid: newGrid };
}

/**
 * Add a background tile component to an entity.
 */
export function addBackgroundTile(
	state: GameState,
	entity: Entity,
	tile: BackgroundTile
): GameState {
	const newTiles = new Map(state.backgroundTiles);
	newTiles.set(entity, tile);
	return { ...state, backgroundTiles: newTiles };
}

/**
 * Remove a background tile component from an entity.
 */
export function removeBackgroundTile(state: GameState, entity: Entity): GameState {
	const newTiles = new Map(state.backgroundTiles);
	newTiles.delete(entity);
	return { ...state, backgroundTiles: newTiles };
}

/**
 * Get a background tile component from an entity.
 */
export function getBackgroundTile(state: GameState, entity: Entity): BackgroundTile | undefined {
	return state.backgroundTiles.get(entity);
}

/**
 * Update a background tile component for an entity.
 */
export function updateBackgroundTile(
	state: GameState,
	entity: Entity,
	updater: (tile: BackgroundTile) => BackgroundTile
): GameState {
	const current = state.backgroundTiles.get(entity);
	if (!current) return state;

	const newTiles = new Map(state.backgroundTiles);
	newTiles.set(entity, updater(current));
	return { ...state, backgroundTiles: newTiles };
}

/**
 * Check if an entity has a background tile component.
 */
export function hasBackgroundTile(state: GameState, entity: Entity): boolean {
	return state.backgroundTiles.has(entity);
}

/**
 * Get all entities with a background tile component.
 */
export function getEntitiesWithBackgroundTile(state: GameState): Entity[] {
	return Array.from(state.backgroundTiles.keys());
}
