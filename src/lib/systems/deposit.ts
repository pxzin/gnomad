/**
 * Deposit System
 *
 * Handles gnomes depositing resources from their inventory into Storage buildings.
 * When a gnome has items in inventory and a Storage exists, it auto-deposits.
 */

import type { GameState } from '$lib/game/state';
import type { Entity } from '$lib/ecs/types';
import {
	getEntitiesWithGnome,
	getEntitiesWithStorage,
	updateGnome,
	updateStorage
} from '$lib/ecs/world';
import { GnomeState, GNOME_INVENTORY_CAPACITY, type Gnome } from '$lib/components/gnome';
import { TaskType } from '$lib/components/task';
import { addToStorage } from '$lib/components/storage';
import { findPath } from './pathfinding';
import type { Position } from '$lib/components/position';
import { BUILDING_CONFIG } from '$lib/components/building';
import { TileType } from '$lib/components/tile';

/**
 * Deposit system update.
 * Processes gnomes that need to deposit resources.
 */
export function depositSystem(state: GameState): GameState {
	let currentState = state;

	// Get all gnome entities
	const gnomeEntities = getEntitiesWithGnome(currentState);

	for (const gnomeEntity of gnomeEntities) {
		const gnome = currentState.gnomes.get(gnomeEntity);
		if (!gnome) continue;

		// Process gnomes in Depositing state
		if (gnome.state === GnomeState.Depositing) {
			currentState = processDepositing(currentState, gnomeEntity, gnome);
			continue;
		}

		// Check if idle gnome should start depositing
		// Only deposit when:
		// 1. Inventory is full, OR
		// 2. Has items AND no more unassigned Collect tasks available
		if (gnome.state === GnomeState.Idle && gnome.inventory.length > 0) {
			const inventoryFull = gnome.inventory.length >= GNOME_INVENTORY_CAPACITY;
			const hasCollectTasks = hasUnassignedCollectTasks(currentState);

			if (inventoryFull || !hasCollectTasks) {
				currentState = tryStartDepositing(currentState, gnomeEntity, gnome);
			}
		}
	}

	return currentState;
}

/**
 * Check if there are unassigned Collect tasks in the game.
 */
function hasUnassignedCollectTasks(state: GameState): boolean {
	for (const task of state.tasks.values()) {
		if (task.type === TaskType.Collect && task.assignedGnome === null) {
			return true;
		}
	}
	return false;
}

/**
 * Try to start depositing for an idle gnome with items.
 */
function tryStartDepositing(state: GameState, gnomeEntity: Entity, gnome: Gnome): GameState {
	const gnomePos = state.positions.get(gnomeEntity);
	if (!gnomePos) return state;

	// Find nearest storage
	const nearestStorage = findNearestStorage(state, gnomePos.x, gnomePos.y);
	if (!nearestStorage) return state; // No storage available

	const { entity: storageEntity, position: storagePos } = nearestStorage;

	// Get storage building dimensions to find deposit spot
	const building = state.buildings.get(storageEntity);
	if (!building) return state;

	const config = BUILDING_CONFIG[building.type];

	// Find a path to a position adjacent to the storage
	const depositSpot = findDepositSpot(state, gnomePos, storagePos, config.width, config.height);
	if (!depositSpot) return state;

	// Pathfind to deposit spot
	const gnomeX = Math.floor(gnomePos.x);
	const gnomeY = Math.floor(gnomePos.y);
	const path = findPath(state, gnomeX, gnomeY, depositSpot.x, depositSpot.y);

	if (!path || path.length === 0) return state;

	// Start walking to storage
	return updateGnome(state, gnomeEntity, (g) => ({
		...g,
		state: GnomeState.Walking,
		path,
		pathIndex: 0,
		depositTargetStorage: storageEntity
	}));
}

/**
 * Find a suitable deposit spot adjacent to the storage.
 */
function findDepositSpot(
	state: GameState,
	gnomePos: Position,
	storagePos: Position,
	width: number,
	height: number
): { x: number; y: number } | null {
	// Find valid spots on the ground level adjacent to storage
	const groundY = storagePos.y + height - 1; // Bottom row of storage

	// Try positions to the left and right of the storage
	const candidates: { x: number; y: number; dist: number }[] = [];

	// Left of storage
	const leftX = storagePos.x - 1;
	if (isValidDepositSpot(state, leftX, groundY)) {
		const dist = Math.abs(leftX - gnomePos.x) + Math.abs(groundY - gnomePos.y);
		candidates.push({ x: leftX, y: groundY, dist });
	}

	// Right of storage
	const rightX = storagePos.x + width;
	if (isValidDepositSpot(state, rightX, groundY)) {
		const dist = Math.abs(rightX - gnomePos.x) + Math.abs(groundY - gnomePos.y);
		candidates.push({ x: rightX, y: groundY, dist });
	}

	// Sort by distance and return closest
	candidates.sort((a, b) => a.dist - b.dist);
	return candidates[0] ?? null;
}

/**
 * Check if a position is valid for depositing (walkable).
 */
function isValidDepositSpot(state: GameState, x: number, y: number): boolean {
	// Check tile at position is Air
	const tileEntity = state.tileGrid[y]?.[x];
	if (tileEntity !== null && tileEntity !== undefined) {
		const tile = state.tiles.get(tileEntity);
		if (tile && tile.type !== TileType.Air) {
			return false;
		}
	}

	// Check tile below is solid (ground)
	const groundTileEntity = state.tileGrid[y + 1]?.[x];
	if (groundTileEntity === null || groundTileEntity === undefined) {
		return false;
	}
	const groundTile = state.tiles.get(groundTileEntity);
	if (!groundTile || groundTile.type === TileType.Air) {
		return false;
	}

	return true;
}

/**
 * Find the nearest storage building to a position.
 */
function findNearestStorage(
	state: GameState,
	x: number,
	y: number
): { entity: Entity; position: Position } | null {
	const storageEntities = getEntitiesWithStorage(state);
	if (storageEntities.length === 0) return null;

	let nearestEntity: Entity | null = null;
	let nearestPos: Position | null = null;
	let nearestDist = Infinity;

	for (const entity of storageEntities) {
		const pos = state.positions.get(entity);
		if (!pos) continue;

		const dist = Math.abs(pos.x - x) + Math.abs(pos.y - y);
		if (dist < nearestDist) {
			nearestDist = dist;
			nearestEntity = entity;
			nearestPos = pos;
		}
	}

	if (nearestEntity === null || nearestPos === null) return null;
	return { entity: nearestEntity, position: nearestPos };
}

/**
 * Process a gnome that is depositing.
 */
function processDepositing(state: GameState, gnomeEntity: Entity, gnome: Gnome): GameState {
	const gnomePos = state.positions.get(gnomeEntity);
	if (!gnomePos) {
		return returnToIdle(state, gnomeEntity);
	}

	// Get the target storage
	const storageEntity = gnome.depositTargetStorage;
	if (!storageEntity) {
		return returnToIdle(state, gnomeEntity);
	}

	const storage = state.storages.get(storageEntity);
	const storagePos = state.positions.get(storageEntity);
	const building = state.buildings.get(storageEntity);

	if (!storage || !storagePos || !building) {
		return returnToIdle(state, gnomeEntity);
	}

	// Check if gnome is adjacent to storage
	const config = BUILDING_CONFIG[building.type];
	const isAdjacent = isAdjacentToStorage(gnomePos, storagePos, config.width, config.height);

	if (!isAdjacent) {
		// Not at storage yet - should still be walking
		return state;
	}

	// Gnome is at storage - deposit all inventory items
	let updatedStorage = storage;
	for (const item of gnome.inventory) {
		updatedStorage = addToStorage(updatedStorage, item.type);
	}

	// Update storage
	state = updateStorage(state, storageEntity, () => updatedStorage);

	// Clear gnome inventory and return to idle
	return updateGnome(state, gnomeEntity, (g) => ({
		...g,
		state: GnomeState.Idle,
		inventory: [],
		path: null,
		pathIndex: 0,
		depositTargetStorage: undefined
	}));
}

/**
 * Check if gnome position is adjacent to storage.
 */
function isAdjacentToStorage(
	gnomePos: Position,
	storagePos: Position,
	width: number,
	height: number
): boolean {
	const gnomeX = Math.floor(gnomePos.x);
	const gnomeY = Math.floor(gnomePos.y);

	// Check if gnome is immediately to the left or right of storage at ground level
	const groundY = storagePos.y + height - 1;

	// Left side
	if (gnomeX === storagePos.x - 1 && gnomeY === groundY) return true;

	// Right side
	if (gnomeX === storagePos.x + width && gnomeY === groundY) return true;

	return false;
}

/**
 * Return gnome to idle state.
 */
function returnToIdle(state: GameState, gnomeEntity: Entity): GameState {
	return updateGnome(state, gnomeEntity, (g) => ({
		...g,
		state: GnomeState.Idle,
		path: null,
		pathIndex: 0,
		depositTargetStorage: undefined
	}));
}
