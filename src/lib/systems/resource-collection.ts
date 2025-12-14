/**
 * Resource Collection System
 *
 * Handles automatic resource collection when gnomes walk over dropped resources.
 * Runs after physics to ensure gnome positions are final for the tick.
 */

import type { GameState, ResourceInventory } from '$lib/game/state';
import { getEntitiesWithGnome, destroyEntity } from '$lib/ecs/world';
import { ResourceType } from '$lib/components/resource';

/**
 * Resource collection system update.
 * Checks all gnome positions against resource positions and collects matching resources.
 */
export function resourceCollectionSystem(state: GameState): GameState {
	let currentState = state;

	// Get all gnome entities
	const gnomeEntities = getEntitiesWithGnome(currentState);

	// For each gnome, check for resources at their position
	for (const gnomeEntity of gnomeEntities) {
		const gnomePos = currentState.positions.get(gnomeEntity);
		if (!gnomePos) continue;

		// Get gnome tile position (floor to get tile coordinates)
		const gnomeTileX = Math.floor(gnomePos.x);
		const gnomeTileY = Math.floor(gnomePos.y);

		// Find all resources at this tile position
		const resourcesToCollect: number[] = [];
		for (const [resourceEntity, _resource] of currentState.resources) {
			const resourcePos = currentState.positions.get(resourceEntity);
			if (!resourcePos) continue;

			// Check if resource is at same tile as gnome
			if (Math.floor(resourcePos.x) === gnomeTileX && Math.floor(resourcePos.y) === gnomeTileY) {
				resourcesToCollect.push(resourceEntity);
			}
		}

		// Collect all resources at this position
		for (const resourceEntity of resourcesToCollect) {
			currentState = collectResource(currentState, resourceEntity);
		}
	}

	return currentState;
}

/**
 * Collect a single resource: add to inventory and destroy entity.
 */
function collectResource(state: GameState, resourceEntity: number): GameState {
	const resource = state.resources.get(resourceEntity);
	if (!resource) return state;

	// Update inventory based on resource type
	const newInventory = addToInventory(state.inventory, resource.type);

	// Remove resource from resources map
	const newResources = new Map(state.resources);
	newResources.delete(resourceEntity);

	// Destroy the entity (removes from all component maps)
	let newState = destroyEntity(state, resourceEntity);

	// Apply updated inventory and resources
	newState = {
		...newState,
		resources: newResources,
		inventory: newInventory
	};

	return newState;
}

/**
 * Add one resource to the inventory.
 */
function addToInventory(inventory: ResourceInventory, type: ResourceType): ResourceInventory {
	switch (type) {
		case ResourceType.Dirt:
			return { ...inventory, dirt: inventory.dirt + 1 };
		case ResourceType.Stone:
			return { ...inventory, stone: inventory.stone + 1 };
		default:
			return inventory;
	}
}
