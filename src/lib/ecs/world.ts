/**
 * ECS World
 *
 * Entity management functions for the ECS architecture.
 * All functions are pure and return new state.
 */

import type { Entity } from './types';
import type { GameState } from '$lib/game/state';
import type { Position } from '$lib/components/position';
import type { Velocity } from '$lib/components/velocity';
import type { Tile } from '$lib/components/tile';
import type { Gnome } from '$lib/components/gnome';
import type { Task } from '$lib/components/task';

/**
 * Create a new entity and return updated state with the new entity ID.
 */
export function createEntity(state: GameState): [GameState, Entity] {
	const entityId = state.nextEntityId;
	const newState: GameState = {
		...state,
		nextEntityId: state.nextEntityId + 1
	};
	return [newState, entityId];
}

/**
 * Destroy an entity by removing all its components.
 */
export function destroyEntity(state: GameState, entity: Entity): GameState {
	const newPositions = new Map(state.positions);
	const newVelocities = new Map(state.velocities);
	const newTiles = new Map(state.tiles);
	const newGnomes = new Map(state.gnomes);
	const newTasks = new Map(state.tasks);

	newPositions.delete(entity);
	newVelocities.delete(entity);
	newTiles.delete(entity);
	newGnomes.delete(entity);
	newTasks.delete(entity);

	return {
		...state,
		positions: newPositions,
		velocities: newVelocities,
		tiles: newTiles,
		gnomes: newGnomes,
		tasks: newTasks
	};
}

/**
 * Add a position component to an entity.
 */
export function addPosition(state: GameState, entity: Entity, position: Position): GameState {
	const newPositions = new Map(state.positions);
	newPositions.set(entity, position);
	return { ...state, positions: newPositions };
}

/**
 * Add a velocity component to an entity.
 */
export function addVelocity(state: GameState, entity: Entity, velocity: Velocity): GameState {
	const newVelocities = new Map(state.velocities);
	newVelocities.set(entity, velocity);
	return { ...state, velocities: newVelocities };
}

/**
 * Add a tile component to an entity.
 */
export function addTile(state: GameState, entity: Entity, tile: Tile): GameState {
	const newTiles = new Map(state.tiles);
	newTiles.set(entity, tile);
	return { ...state, tiles: newTiles };
}

/**
 * Add a gnome component to an entity.
 */
export function addGnome(state: GameState, entity: Entity, gnome: Gnome): GameState {
	const newGnomes = new Map(state.gnomes);
	newGnomes.set(entity, gnome);
	return { ...state, gnomes: newGnomes };
}

/**
 * Add a task component to an entity.
 */
export function addTask(state: GameState, entity: Entity, task: Task): GameState {
	const newTasks = new Map(state.tasks);
	newTasks.set(entity, task);
	return { ...state, tasks: newTasks };
}

/**
 * Get a position component from an entity.
 */
export function getPosition(state: GameState, entity: Entity): Position | undefined {
	return state.positions.get(entity);
}

/**
 * Get a velocity component from an entity.
 */
export function getVelocity(state: GameState, entity: Entity): Velocity | undefined {
	return state.velocities.get(entity);
}

/**
 * Get a tile component from an entity.
 */
export function getTile(state: GameState, entity: Entity): Tile | undefined {
	return state.tiles.get(entity);
}

/**
 * Get a gnome component from an entity.
 */
export function getGnome(state: GameState, entity: Entity): Gnome | undefined {
	return state.gnomes.get(entity);
}

/**
 * Get a task component from an entity.
 */
export function getTask(state: GameState, entity: Entity): Task | undefined {
	return state.tasks.get(entity);
}

/**
 * Check if an entity has a position component.
 */
export function hasPosition(state: GameState, entity: Entity): boolean {
	return state.positions.has(entity);
}

/**
 * Check if an entity has a velocity component.
 */
export function hasVelocity(state: GameState, entity: Entity): boolean {
	return state.velocities.has(entity);
}

/**
 * Check if an entity has a tile component.
 */
export function hasTile(state: GameState, entity: Entity): boolean {
	return state.tiles.has(entity);
}

/**
 * Check if an entity has a gnome component.
 */
export function hasGnome(state: GameState, entity: Entity): boolean {
	return state.gnomes.has(entity);
}

/**
 * Check if an entity has a task component.
 */
export function hasTask(state: GameState, entity: Entity): boolean {
	return state.tasks.has(entity);
}

/**
 * Get all entities with a position component.
 */
export function getEntitiesWithPosition(state: GameState): Entity[] {
	return Array.from(state.positions.keys());
}

/**
 * Get all entities with a gnome component.
 */
export function getEntitiesWithGnome(state: GameState): Entity[] {
	return Array.from(state.gnomes.keys());
}

/**
 * Get all entities with a task component.
 */
export function getEntitiesWithTask(state: GameState): Entity[] {
	return Array.from(state.tasks.keys());
}

/**
 * Update a position component for an entity.
 */
export function updatePosition(
	state: GameState,
	entity: Entity,
	updater: (pos: Position) => Position
): GameState {
	const current = state.positions.get(entity);
	if (!current) return state;

	const newPositions = new Map(state.positions);
	newPositions.set(entity, updater(current));
	return { ...state, positions: newPositions };
}

/**
 * Update a gnome component for an entity.
 */
export function updateGnome(
	state: GameState,
	entity: Entity,
	updater: (gnome: Gnome) => Gnome
): GameState {
	const current = state.gnomes.get(entity);
	if (!current) return state;

	const newGnomes = new Map(state.gnomes);
	newGnomes.set(entity, updater(current));
	return { ...state, gnomes: newGnomes };
}

/**
 * Update a task component for an entity.
 */
export function updateTask(
	state: GameState,
	entity: Entity,
	updater: (task: Task) => Task
): GameState {
	const current = state.tasks.get(entity);
	if (!current) return state;

	const newTasks = new Map(state.tasks);
	newTasks.set(entity, updater(current));
	return { ...state, tasks: newTasks };
}

/**
 * Update a tile component for an entity.
 */
export function updateTile(
	state: GameState,
	entity: Entity,
	updater: (tile: Tile) => Tile
): GameState {
	const current = state.tiles.get(entity);
	if (!current) return state;

	const newTiles = new Map(state.tiles);
	newTiles.set(entity, updater(current));
	return { ...state, tiles: newTiles };
}
