/**
 * Resource Component
 *
 * Resource entities dropped when mining tiles.
 * Resources are collected by gnomes and add to global inventory.
 */

import { TileType } from './tile';

/**
 * Types of resources that can be collected.
 * Maps 1:1 with mineable TileTypes.
 */
export enum ResourceType {
	Dirt = 1,
	Stone = 2
}

/**
 * Resource component data.
 * Pure data structure per ECS principles.
 */
export interface Resource {
	/** Type of resource (determines inventory slot) */
	type: ResourceType;
}

/**
 * Visual configuration for resource rendering.
 */
export interface ResourceConfig {
	/** Hex color for MVP rendering */
	color: number;
}

/**
 * Resource type configurations.
 * Darker shades than tile colors to distinguish dropped resources.
 */
export const RESOURCE_CONFIG: Record<ResourceType, ResourceConfig> = {
	[ResourceType.Dirt]: { color: 0x6b3a0b },
	[ResourceType.Stone]: { color: 0x4a4a4a }
};

/**
 * Map tile type to resource type for drops.
 * Returns null for non-droppable tiles (Air, Bedrock).
 */
export function getResourceTypeForTile(tileType: TileType): ResourceType | null {
	switch (tileType) {
		case TileType.Dirt:
			return ResourceType.Dirt;
		case TileType.Stone:
			return ResourceType.Stone;
		default:
			return null;
	}
}

/**
 * Create a new Resource component.
 */
export function createResource(type: ResourceType): Resource {
	return { type };
}
