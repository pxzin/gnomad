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
import type { Gnome, Health } from '$lib/components/gnome';
import type { Task } from '$lib/components/task';
import type { Resource } from '$lib/components/resource';
import type { Building } from '$lib/components/building';
import type { Storage } from '$lib/components/storage';

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
	const newResources = new Map(state.resources);
	const newBuildings = new Map(state.buildings);
	const newStorages = new Map(state.storages);
	const newHealths = new Map(state.healths);

	newPositions.delete(entity);
	newVelocities.delete(entity);
	newTiles.delete(entity);
	newGnomes.delete(entity);
	newTasks.delete(entity);
	newResources.delete(entity);
	newBuildings.delete(entity);
	newStorages.delete(entity);
	newHealths.delete(entity);

	return {
		...state,
		positions: newPositions,
		velocities: newVelocities,
		tiles: newTiles,
		gnomes: newGnomes,
		tasks: newTasks,
		resources: newResources,
		buildings: newBuildings,
		storages: newStorages,
		healths: newHealths
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
 * Add a resource component to an entity.
 */
export function addResource(state: GameState, entity: Entity, resource: Resource): GameState {
	const newResources = new Map(state.resources);
	newResources.set(entity, resource);
	return { ...state, resources: newResources };
}

/**
 * Remove a resource component from an entity.
 */
export function removeResource(state: GameState, entity: Entity): GameState {
	const newResources = new Map(state.resources);
	newResources.delete(entity);
	return { ...state, resources: newResources };
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
 * Get a resource component from an entity.
 */
export function getResource(state: GameState, entity: Entity): Resource | undefined {
	return state.resources.get(entity);
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
 * Check if an entity has a resource component.
 */
export function hasResource(state: GameState, entity: Entity): boolean {
	return state.resources.has(entity);
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
 * Get all entities with a resource component.
 */
export function getEntitiesWithResource(state: GameState): Entity[] {
	return Array.from(state.resources.keys());
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

/**
 * Add a building component to an entity.
 */
export function addBuilding(state: GameState, entity: Entity, building: Building): GameState {
	const newBuildings = new Map(state.buildings);
	newBuildings.set(entity, building);
	return { ...state, buildings: newBuildings };
}

/**
 * Remove a building component from an entity.
 */
export function removeBuilding(state: GameState, entity: Entity): GameState {
	const newBuildings = new Map(state.buildings);
	newBuildings.delete(entity);
	return { ...state, buildings: newBuildings };
}

/**
 * Get all entities with a building component.
 */
export function getEntitiesWithBuilding(state: GameState): Entity[] {
	return Array.from(state.buildings.keys());
}

/**
 * Add a storage component to an entity.
 */
export function addStorage(state: GameState, entity: Entity, storage: Storage): GameState {
	const newStorages = new Map(state.storages);
	newStorages.set(entity, storage);
	return { ...state, storages: newStorages };
}

/**
 * Remove a storage component from an entity.
 */
export function removeStorage(state: GameState, entity: Entity): GameState {
	const newStorages = new Map(state.storages);
	newStorages.delete(entity);
	return { ...state, storages: newStorages };
}

/**
 * Get all entities with a storage component.
 */
export function getEntitiesWithStorage(state: GameState): Entity[] {
	return Array.from(state.storages.keys());
}

/**
 * Update a storage component for an entity.
 */
export function updateStorage(
	state: GameState,
	entity: Entity,
	updater: (storage: Storage) => Storage
): GameState {
	const current = state.storages.get(entity);
	if (!current) return state;

	const newStorages = new Map(state.storages);
	newStorages.set(entity, updater(current));
	return { ...state, storages: newStorages };
}

/**
 * Update a resource component for an entity.
 */
export function updateResource(
	state: GameState,
	entity: Entity,
	updater: (resource: Resource) => Resource
): GameState {
	const current = state.resources.get(entity);
	if (!current) return state;

	const newResources = new Map(state.resources);
	newResources.set(entity, updater(current));
	return { ...state, resources: newResources };
}

// ============================================================================
// Health Component Accessors
// ============================================================================

/**
 * Add a health component to an entity.
 */
export function addHealth(state: GameState, entity: Entity, health: Health): GameState {
	const newHealths = new Map(state.healths);
	newHealths.set(entity, health);
	return { ...state, healths: newHealths };
}

/**
 * Get a health component from an entity.
 */
export function getHealth(state: GameState, entity: Entity): Health | undefined {
	return state.healths.get(entity);
}

/**
 * Check if an entity has a health component.
 */
export function hasHealth(state: GameState, entity: Entity): boolean {
	return state.healths.has(entity);
}

/**
 * Update a health component for an entity.
 */
export function updateHealth(
	state: GameState,
	entity: Entity,
	updater: (health: Health) => Health
): GameState {
	const current = state.healths.get(entity);
	if (!current) return state;

	const newHealths = new Map(state.healths);
	newHealths.set(entity, updater(current));
	return { ...state, healths: newHealths };
}
